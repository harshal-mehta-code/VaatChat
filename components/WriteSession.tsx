"use client";

// Lekhan session — the ladder from watching a letter to writing it from memory.
//
//   Watch  👀  see it formed, stroke by stroke, with the start points marked
//   Trace  ✍️  follow it under your pen, generous tolerance
//   Write  🧠  blank box, prompted only by the sound — writing as *recall*
//
// The ladder is adaptive rather than fixed: a letter you've never written starts
// at Watch, one you've written before goes straight to Write with Watch a tap
// away. That keeps a session short (docs/PLAN.md §4.5 — 2–7 min, always ends on
// a win) without ever locking the demonstration away from someone who wants it.

import { useMemo, useState } from "react";
import type { Akshar, StrokeGlyph } from "@/lib/core/types";
import type { GlyphScore } from "@/lib/core/strokes";
import { useProgress } from "@/lib/client/useProgress";
import { itemStatus, writingCardId } from "@/lib/core/progress";
import { XP } from "@/lib/core/gamification";
import { playAudio } from "@/lib/client/speech";
import StrokeAnimation from "@/components/StrokeAnimation";
import WritePad from "@/components/WritePad";

const SESSION_SIZE = 5;

type Stage = "watch" | "trace" | "write";

export interface WritableLetter {
  akshar: Akshar;
  glyph: StrokeGlyph;
}

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
  onExit,
}: {
  pool: WritableLetter[];
  onExit: () => void;
}) {
  const { progress, gradeItem, award } = useProgress();
  const [round, setRound] = useState(0);

  // New letters first — the demonstration is the draw, so lead with it.
  const session = useMemo(() => {
    const fresh = pool.filter((l) => itemStatus(progress, writingCardId(l.akshar.id)) === "new");
    const seen = pool.filter((l) => itemStatus(progress, writingCardId(l.akshar.id)) !== "new");
    return [...shuffle(fresh), ...shuffle(seen)].slice(0, Math.min(SESSION_SIZE, pool.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, round]);

  const [index, setIndex] = useState(0);
  /** null = "wherever this letter naturally starts"; set = the learner steered. */
  const [stageOverride, setStageOverride] = useState<Stage | null>(null);
  const [stars, setStars] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const current = session[index];

  // A letter you've never written starts at Watch; one you have goes straight to
  // the blank box — but Watch stays one tap away, so this steers, never locks.
  const naturalStage: Stage =
    current && itemStatus(progress, writingCardId(current.akshar.id)) === "new"
      ? "watch"
      : "write";
  const stage: Stage = stageOverride ?? naturalStage;

  function advance(score: GlyphScore) {
    if (stage === "trace") {
      setStageOverride("write");
      return;
    }
    // The Write rung is the one that counts toward memory.
    const id = writingCardId(current.akshar.id);
    gradeItem(id, score.stars >= 3 ? "easy" : score.stars >= 2 ? "good" : "again");
    if (score.stars >= 2) award(XP.letterWritten);
    setStars((s) => [...s, score.stars]);

    if (index + 1 >= session.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setStageOverride(null);
    }
  }

  function again() {
    setRound((r) => r + 1);
    setIndex(0);
    setStageOverride(null);
    setStars([]);
    setDone(false);
  }

  if (done) {
    const clean = stars.filter((s) => s >= 2).length;
    const earned = clean * XP.letterWritten;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="text-6xl" aria-hidden="true">
          🪶
        </div>
        <h2 className="text-2xl">You wrote {session.length} letters by hand.</h2>
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

  const { akshar, glyph } = current;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-5 flex items-center gap-3">
        <button type="button" onClick={onExit} aria-label="Exit writing practice" className="text-ink-soft">
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
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">
              Watch how it's written
            </p>
            <button
              type="button"
              onClick={() => void playAudio(akshar.audio, akshar.char)}
              className="mt-1 text-2xl font-semibold text-ink"
            >
              {akshar.roman} <span aria-hidden="true">🔊</span>
            </button>
          </div>

          <div className="w-full max-w-[560px]">
            <div className="relative aspect-square w-full rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
              <StrokeAnimation
                strokes={glyph.strokes}
                ghostChar={akshar.char}
                loop
                className="absolute inset-0"
              />
            </div>
          </div>

          <p className="max-w-[560px] text-center text-sm text-ink-soft">{akshar.mnemonic}</p>

          <button
            type="button"
            onClick={() => setStageOverride("trace")}
            className="w-full max-w-[560px] rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent active:scale-[.99]"
          >
            I'll try it →
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">
              {stage === "trace" ? "Trace it" : "Now write it from memory"}
            </p>
            <button
              type="button"
              onClick={() => void playAudio(akshar.audio, akshar.char)}
              className="mt-1 text-2xl font-semibold text-ink"
            >
              {akshar.roman} <span aria-hidden="true">🔊</span>
            </button>
          </div>

          <WritePad
            key={`${akshar.id}-${stage}`}
            glyph={glyph}
            mode={stage === "trace" ? "trace" : "memory"}
            ghostChar={akshar.char}
            onDone={advance}
            continueLabel={
              stage === "trace"
                ? "Now write it from memory →"
                : index + 1 >= session.length
                  ? "Finish"
                  : "Next letter →"
            }
            onWatchAgain={() => setStageOverride("watch")}
          />
        </div>
      )}
    </div>
  );
}
