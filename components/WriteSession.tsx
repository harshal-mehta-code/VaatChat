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
// Letters and whole words are one track, not two. A letter's strokes are
// hand-authored; a word's are composed from those same letters
// (lib/core/compose.ts), so from here down they're the same thing — some ink to
// follow and a card to grade. A word joins the session once its own letters are
// under way, which makes "you can write ઘ and ર, so here's ઘર" a moment the
// session hands you rather than a second button you have to find.

import { useCallback, useRef, useState } from "react";
import type { Stroke } from "@/lib/core/types";
import { GLYPH_BOX, type GlyphScore } from "@/lib/core/strokes";
import { useProgress } from "@/lib/client/useProgress";
import { itemStatus, writingCardId } from "@/lib/core/progress";
import { XP } from "@/lib/core/gamification";
import { playAudio } from "@/lib/client/speech";
import { shuffled } from "@/lib/core/variation";
import StrokeAnimation from "@/components/StrokeAnimation";
import WritePad from "@/components/WritePad";

const SESSION_SIZE = 5;
/** How many whole words one session ends on. The payoff, not the bulk. */
const WORDS_PER_SESSION = 2;

type Stage = "watch" | "trace" | "write";

export type WriteKind = "letter" | "word";

/** One thing to write: a letter, or a whole word. */
export interface WriteTarget {
  /** The item this practises. `writingCardId()` turns it into an SRS card. */
  id: string;
  kind: WriteKind;
  /** For a word: the letters it's built from. It only comes up once every one
   *  of them is already being written — so a word is always a victory lap over
   *  letters you know, never a wall. */
  requires?: string[];
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

const COPY = {
  letter: {
    watch: "Watch how it's written",
    memory: "Now write it from memory",
    next: "Next letter →",
    xp: XP.letterWritten,
  },
  word: {
    watch: "Watch the whole word",
    memory: "Now write the word from memory",
    next: "Next word →",
    xp: XP.wordWritten,
  },
} as const;

/** "3 letters and 2 words", "5 letters", "2 words" — whichever it actually was. */
function tally(targets: WriteTarget[]): string {
  const letters = targets.filter((t) => t.kind === "letter").length;
  const words = targets.length - letters;
  const parts = [
    letters > 0 ? `${letters} letter${letters === 1 ? "" : "s"}` : "",
    words > 0 ? `${words} word${words === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return parts.join(" and ");
}

export interface WritePools {
  letters: WriteTarget[];
  /** Composed from the letters — see lib/core/compose.ts. */
  words: WriteTarget[];
}

export default function WriteSession({
  pools,
  onExit,
}: {
  pools: WritePools;
  onExit: () => void;
}) {
  const { progress, gradeItem, award } = useProgress();

  // Build the session once, from a ref rather than from the props directly.
  // Grading updates `progress`, and a pool derived from progress is a new array
  // every answer — reacting to that would rebuild the deck mid-question and
  // mis-attribute the attempt on screen. Same trap ReviewSession and
  // TypeSession each had to close.
  const live = useRef({ pools, progress });
  live.current = { pools, progress };

  const compose = useCallback(() => {
    const { pools: p, progress: pr } = live.current;
    const started = (id: string) => itemStatus(pr, writingCardId(id)) !== "new";

    // A word earns its place only once every letter in it is already under way.
    // Nothing is gated on a count or a level — it's the actual prerequisite,
    // which is why it can sit in the same session instead of behind a door.
    const ready = p.words.filter((w) => (w.requires ?? []).every(started));
    const words = shuffled(ready, Math.random).slice(0, WORDS_PER_SESSION);

    // New letters first — the demonstration is the draw, so lead with it.
    const fresh = p.letters.filter((t) => !started(t.id));
    const seen = p.letters.filter((t) => started(t.id));
    const letters = [...shuffled(fresh, Math.random), ...shuffled(seen, Math.random)].slice(
      0,
      Math.max(0, SESSION_SIZE - words.length),
    );
    // Words last: they're the payoff, and they read as one.
    return [...letters, ...words];
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
    const copy = COPY[current.kind];
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
        <h2 className="text-2xl">You wrote {tally(session)} by hand.</h2>
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
            Write more
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

  const copy = COPY[current.kind];

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
