"use client";

// Akshar practice — a short recognition drill that actually teaches (and marks
// mastery via the SRS engine), so the script is learned by retrieval rather
// than a self-report button. Three question directions keep it lively:
//   sound  → see the letter, pick its sound
//   letter → read the sound, pick the letter
//   audio  → hear the letter, pick it

import { useEffect, useMemo, useState } from "react";
import type { Akshar } from "@/lib/core/types";
import { useProgress } from "@/lib/client/useProgress";
import { XP } from "@/lib/core/gamification";
import { playAudio } from "@/lib/client/speech";
import { pick, shuffled } from "@/lib/core/variation";

type Mode = "sound" | "letter" | "audio";

interface Question {
  id: string;
  target: Akshar;
  mode: Mode;
  options: Akshar[];
}

const SESSION_SIZE = 12;

function buildSession(pool: Akshar[]): Question[] {
  const modes: Mode[] = ["sound", "letter", "audio"];
  return shuffled(pool, Math.random)
    .slice(0, Math.min(SESSION_SIZE, pool.length))
    .map((target, i) => {
      const distractors = shuffled(
        pool.filter((a) => a.type === target.type && a.id !== target.id),
        Math.random,
      ).slice(0, 3);
      return {
        id: `${target.id}-${i}`,
        target,
        mode: pick(modes, Math.random)!,
        options: shuffled([target, ...distractors], Math.random),
      };
    });
}

export default function AksharPractice({ pool, onExit }: { pool: Akshar[]; onExit: () => void }) {
  const { gradeItem, award } = useProgress();
  const [round, setRound] = useState(0);
  const session = useMemo(() => buildSession(pool), [pool, round]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const q = session[index];

  // Auto-play the prompt for audio questions (recorded file, TTS fallback).
  useEffect(() => {
    if (q && q.mode === "audio") void playAudio(q.target.audio, q.target.char);
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
          🌸
        </div>
        <h2 className="text-2xl">Nice practice!</h2>
        <p className="text-ink-soft">
          <span className="font-semibold text-marigold">{correctCount}/{session.length}</span> correct
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
            Practice again
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

  const prompt =
    q.mode === "sound"
      ? "Which sound is this?"
      : q.mode === "letter"
        ? "Which letter makes this sound?"
        : "Which letter did you hear?";

  return (
    <div className="flex flex-1 flex-col">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={onExit} aria-label="Exit practice" className="text-ink-soft">
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

      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-ink-soft">{prompt}</p>

      {/* Prompt card */}
      <div className="mb-5 flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface p-6 text-center shadow-[var(--shadow)]">
        {q.mode === "sound" && <div className="guj text-6xl font-medium text-ink">{q.target.char}</div>}
        {q.mode === "letter" && (
          <>
            <div className="text-3xl font-semibold text-ink">{q.target.roman}</div>
            <div className="text-sm text-ink-soft">{q.target.sound}</div>
          </>
        )}
        {q.mode === "audio" && (
          <button
            type="button"
            onClick={() => void playAudio(q.target.audio, q.target.char)}
            aria-label="Replay sound"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-peacock text-2xl text-on-accent shadow-[var(--shadow)] active:scale-95"
          >
            <span aria-hidden="true">🔊</span>
          </button>
        )}
      </div>

      {/* Options */}
      <div className={q.mode === "sound" ? "flex flex-col gap-2" : "grid grid-cols-2 gap-2"}>
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
              className={`rounded-2xl border px-4 py-4 text-center font-medium transition-colors ${stateClass}`}
            >
              {q.mode === "sound" ? (
                <span className="text-lg">{opt.roman}</span>
              ) : (
                <span className="guj text-3xl">{opt.char}</span>
              )}
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
