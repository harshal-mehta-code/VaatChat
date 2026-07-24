"use client";

// Lekhan session — the ladder from watching something written to writing it
// from memory.
//
//   Watch  👀  see it formed, stroke by stroke, with the start points marked
//   Trace  ✍️  follow it under your pen, generous tolerance
//   Write  🧠  blank box, prompted only by the sound — writing as *recall*
//
// The ladder is adaptive rather than fixed: something you've never written
// starts at Watch, something you have goes straight to Write with Watch a tap
// away. That keeps a session short (docs/PLAN.md §4.5 — 2–7 min, always ends on
// a win) without ever locking the demonstration away from someone who wants it.
//
// It drives both halves of the track. A letter's strokes are hand-authored; a
// word's are composed from those same letters (lib/core/compose.ts), so from
// here down the two are the same thing — some ink to follow and a card to
// grade. Only the framing differs, which is what `kind` is for.

import { useCallback, useRef, useState } from "react";
import type { Stroke } from "@/lib/core/types";
import { GLYPH_BOX, type GlyphScore } from "@/lib/core/strokes";
import { useProgress } from "@/lib/client/useProgress";
import { itemStatus, writingCardId } from "@/lib/core/progress";
import { XP } from "@/lib/core/gamification";
import { playAudio } from "@/lib/client/speech";
import StrokeAnimation from "@/components/StrokeAnimation";
import WritePad from "@/components/WritePad";

const SESSION_SIZE = 5;

type Stage = "watch" | "trace" | "write";

/** One thing to write: a letter, or a whole word. */
export interface WriteTarget {
  /** The item this practises. `writingCardId()` turns it into an SRS card. */
  id: string;
  /** The ink to learn, already placed in the box. */
  strokes: Stroke[];
  /** Box width. Omit for a square single-letter box. */
  width?: number;
  /** The Gujarati being written — shown once, on the Watch rung. */
  char: string;
  /** The prompt: how it's said, tappable to hear it. */
  label: string;
  /** One line under the prompt — a letter's mnemonic, a word's meaning. */
  note?: string;
  audio?: string;
  /** Which strokes make up which letter — a word only. Lets the feedback name
   *  the letter that went wrong instead of a stroke number. */
  parts?: { guj: string; from: number; count: number }[];
  /** Shown faintly under the trace guide. Letters only: a font's spacing for a
   *  word wouldn't line up with the strokes we composed from our own letters. */
  ghostChar?: string;
}

export type WriteKind = "letter" | "word";

const COPY = {
  letter: {
    watch: "Watch how it's written",
    memory: "Now write it from memory",
    next: "Next letter →",
    xp: XP.letterWritten,
    done: (n: number) => `You wrote ${n} letters by hand.`,
    more: "Write more",
  },
  word: {
    watch: "Watch the whole word",
    memory: "Now write the word from memory",
    next: "Next word →",
    xp: XP.wordWritten,
    done: (n: number) => `You wrote ${n} whole words by hand.`,
    more: "Write more words",
  },
} as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WriteSession({
  pool,
  kind = "letter",
  onExit,
}: {
  pool: WriteTarget[];
  kind?: WriteKind;
  onExit: () => void;
}) {
  const { progress, gradeItem, award } = useProgress();
  const copy = COPY[kind];

  // Build the session once, from a ref rather than from the props directly.
  // Grading updates `progress`, and a pool derived from progress is a new array
  // every answer — reacting to that would rebuild the deck mid-question and
  // mis-attribute the attempt on screen. Same trap ReviewSession and
  // TypeSession each had to close.
  const live = useRef({ pool, progress });
  live.current = { pool, progress };

  const compose = useCallback(() => {
    const { pool: p, progress: pr } = live.current;
    // New things first — the demonstration is the draw, so lead with it.
    const fresh = p.filter((t) => itemStatus(pr, writingCardId(t.id)) === "new");
    const seen = p.filter((t) => itemStatus(pr, writingCardId(t.id)) !== "new");
    return [...shuffle(fresh), ...shuffle(seen)].slice(0, Math.min(SESSION_SIZE, p.length));
  }, []);

  const [session, setSession] = useState<WriteTarget[]>(compose);
  const [index, setIndex] = useState(0);
  /** null = "wherever this one naturally starts"; set = the learner steered. */
  const [stageOverride, setStageOverride] = useState<Stage | null>(null);
  const [stars, setStars] = useState<number[]>([]);
  const [earned, setEarned] = useState(0);
  const [done, setDone] = useState(false);

  const current = session[index];

  // Something you've never written starts at Watch; something you have goes
  // straight to the blank box — but Watch stays one tap away, so this steers,
  // never locks.
  const naturalStage: Stage =
    current && itemStatus(progress, writingCardId(current.id)) === "new" ? "watch" : "write";
  const stage: Stage = stageOverride ?? naturalStage;

  function advance(score: GlyphScore) {
    if (stage === "trace") {
      // Tracing is guided practice, not recall, so it must never grade like it —
      // but it's still real work, and walking away after it shouldn't leave a
      // learner with nothing. Credit the effort, and register a first encounter
      // so it shows as in progress. Only for something with no card yet: an
      // established one must never be pushed backwards by a traced attempt.
      if (score.stars >= 2) {
        award(XP.exercise);
        setEarned((x) => x + XP.exercise);
      }
      const id = writingCardId(current.id);
      if (itemStatus(progress, id) === "new") gradeItem(id, "again");
      setStageOverride("write");
      return;
    }
    // The Write rung is the one that counts toward memory.
    const id = writingCardId(current.id);
    gradeItem(id, score.stars >= 3 ? "easy" : score.stars >= 2 ? "good" : "again");
    if (score.stars >= 2) {
      award(copy.xp);
      setEarned((x) => x + copy.xp);
    }
    setStars((s) => [...s, score.stars]);

    if (index + 1 >= session.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setStageOverride(null);
    }
  }

  function again() {
    setSession(compose());
    setIndex(0);
    setStageOverride(null);
    setStars([]);
    setEarned(0);
    setDone(false);
  }

  if (done) {
    const clean = stars.filter((s) => s >= 2).length;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="text-6xl" aria-hidden="true">
          🪶
        </div>
        <h2 className="text-2xl">{copy.done(session.length)}</h2>
        <p className="text-ink-soft">
          <span className="font-semibold text-marigold">{clean}</span> came out clean
          {earned > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-marigold">+{earned} XP</span>
            </>
          )}
        </p>
        <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
          <button
            type="button"
            onClick={again}
            className="w-full rounded-full bg-marigold px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
          >
            {copy.more}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="w-full rounded-full border border-line bg-surface px-6 py-3 text-base font-semibold text-ink"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const shell = (current.width ?? GLYPH_BOX) > GLYPH_BOX ? "max-w-[720px]" : "max-w-[560px]";

  const prompt = (
    <div className="text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">
        {stage === "watch" ? copy.watch : stage === "trace" ? "Trace it" : copy.memory}
      </p>
      <button
        type="button"
        onClick={() => void playAudio(current.audio, current.char)}
        className="mt-1 text-2xl font-semibold text-ink"
      >
        {current.label} <span aria-hidden="true">🔊</span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit writing practice"
          className="text-ink-soft"
        >
          <span aria-hidden="true">✕</span>
        </button>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-peacock transition-[width]"
            style={{ width: `${(index / session.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-ink-soft">
          {index + 1}/{session.length}
        </span>
      </div>

      {stage === "watch" ? (
        <div className="flex flex-1 flex-col items-center gap-4">
          {prompt}

          <div className={`w-full ${shell}`}>
            <div
              className="relative w-full rounded-2xl border border-line bg-surface shadow-[var(--shadow)]"
              style={{ aspectRatio: `${current.width ?? GLYPH_BOX} / ${GLYPH_BOX}` }}
            >
              <StrokeAnimation
                strokes={current.strokes}
                width={current.width}
                ghostChar={current.ghostChar}
                loop
                className="absolute inset-0"
              />
            </div>
          </div>

          {current.note && (
            <p className={`text-center text-sm text-ink-soft ${shell}`}>{current.note}</p>
          )}

          <button
            type="button"
            onClick={() => setStageOverride("trace")}
            className={`w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent active:scale-[.99] ${shell}`}
          >
            I'll try it →
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-4">
          {prompt}

          <WritePad
            key={`${current.id}-${stage}`}
            reference={current.strokes}
            width={current.width}
            mode={stage === "trace" ? "trace" : "memory"}
            ghostChar={current.ghostChar}
            parts={current.parts}
            onDone={advance}
            continueLabel={
              stage === "trace"
                ? copy.memory + " →"
                : index + 1 >= session.length
                  ? "Finish"
                  : copy.next
            }
            onWatchAgain={() => setStageOverride("watch")}
          />
        </div>
      )}
    </div>
  );
}
