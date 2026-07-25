"use client";

// Review session — a spaced-repetition vocab flashcard drill. Same shape as
// AksharPractice (keyed multiple-choice, graded via the SRS engine), but the
// prompt is a Gujarati word/phrase and the options are English meanings, in
// the style of LessonRunner's RecallExercise.

import { useEffect, useMemo, useState } from "react";
import type { LexItem } from "@/lib/core/types";
import { useProgress } from "@/lib/client/useProgress";
import { XP } from "@/lib/core/gamification";
import { playAudio } from "@/lib/client/speech";
import { ITEMS } from "@/lib/content/units";
import { shuffled } from "@/lib/core/variation";
import AudioButton from "./AudioButton";

interface Question {
  id: string;
  target: LexItem;
  options: LexItem[];
}

const SESSION_SIZE = 10;

function buildSession(pool: LexItem[]): Question[] {
  // Fall back to the full item bank for distractors when the pool itself is
  // too small to offer three other meanings.
  const distractorBank = pool.length > 3 ? pool : ITEMS;
  return shuffled(pool, Math.random)
    .slice(0, Math.min(SESSION_SIZE, pool.length))
    .map((target, i) => {
      const distractors = shuffled(
        distractorBank.filter((it) => it.id !== target.id && it.english !== target.english),
        Math.random,
      ).slice(0, 3);
      return {
        id: `${target.id}-${i}`,
        target,
        options: shuffled([target, ...distractors], Math.random),
      };
    });
}

export default function ReviewSession({ pool, onExit }: { pool: LexItem[]; onExit: () => void }) {
  const { gradeItem, award } = useProgress();
  const [round, setRound] = useState(0);
  // Freeze the deck at session start. Grading updates `progress`, which changes
  // the parent-derived `pool` reference every answer — without this snapshot
  // that would rebuild the session mid-question and mis-judge your selection.
  const [poolSnapshot] = useState(pool);
  const session = useMemo(() => buildSession(poolSnapshot), [poolSnapshot, round]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const q = session[index];

  // Auto-play the word's audio each time a new question is shown.
  useEffect(() => {
    if (q) void playAudio(q.target.audio, q.target.gujarati);
  }, [q]);

  function choose(optId: string) {
    if (selected) return;
    setSelected(optId);
    const ok = optId === q.target.id;
    gradeItem(q.target.id, ok ? "good" : "again");
    if (ok) {
      award(XP.exercise);
      setCorrectCount((c) => c + 1);
    }
  }

  function next() {
    if (index + 1 >= session.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  }

  function again() {
    setRound((r) => r + 1);
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="text-6xl" aria-hidden="true">
          {correctCount === session.length ? "🎉" : "🌸"}
        </div>
        <h2 className="text-2xl">Review complete!</h2>
        <p className="text-ink-soft">
          <span className="font-semibold text-marigold">
            {correctCount}/{session.length}
          </span>{" "}
          correct
          {correctCount > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-marigold">+{correctCount * XP.exercise} XP</span>
            </>
          )}
        </p>
        <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
          <button
            type="button"
            onClick={again}
            className="w-full rounded-full bg-marigold px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
          >
            Review again
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

  if (!q) return null;

  return (
    <div className="flex flex-1 flex-col">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={onExit} aria-label="Exit review" className="text-ink-soft">
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

      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-ink-soft">
        What does this mean?
      </p>

      {/* Prompt card */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <AudioButton src={q.target.audio} gujarati={q.target.gujarati} size="sm" />
        <div>
          <div className="guj text-2xl font-medium text-ink">{q.target.gujarati}</div>
          <div className="text-sm text-ink-soft">{q.target.roman}</div>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {q.options.map((opt) => {
          const isSelected = selected === opt.id;
          const showState = selected !== null;
          const isCorrect = opt.id === q.target.id;
          const stateClass =
            showState && isCorrect
              ? "border-good bg-good/10 text-good"
              : showState && isSelected
                ? "border-bad bg-bad/10 text-bad"
                : "border-line bg-surface text-ink hover:bg-surface-2";
          return (
            <button
              key={opt.id}
              type="button"
              disabled={selected !== null}
              onClick={() => choose(opt.id)}
              className={`rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${stateClass}`}
            >
              {opt.english}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <button
          type="button"
          onClick={next}
          className="mt-6 w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent active:scale-[.99]"
        >
          {index + 1 >= session.length ? "Finish" : "Continue"}
        </button>
      )}
    </div>
  );
}
