"use client";

// ─────────────────────────────────────────────────────────────────────────
// Runs a single grammar concept: guided discovery → tiny rule → production
// drills → win. Sibling to LessonRunner; grades the concept's SRS card once at
// the end (spaced review, not massed) and awards XP. See docs/VYAKARAN.md.
// ─────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import type { GrammarConcept, GrammarExample, GrammarExercise } from "@/lib/core/types";
import type { Grade3 } from "@/lib/core/srs";
import { grammarCardId } from "@/lib/core/progress";
import { XP } from "@/lib/core/gamification";
import { useProgress } from "@/lib/client/useProgress";
import { playAudio } from "@/lib/client/speech";
import { funFactFor } from "@/lib/content";
import AudioButton from "./AudioButton";
import FunFactCard from "./FunFactCard";
import { seededShuffle } from "./shuffle";

type Phase = "predict" | "discover" | "drill" | "done";

/** Render Gujarati with the pattern substring emphasized. */
function Highlighted({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text.includes(highlight)) return <>{text}</>;
  const at = text.indexOf(highlight);
  return (
    <>
      {text.slice(0, at)}
      <span className="rounded bg-peacock/15 px-0.5 font-semibold text-peacock">{highlight}</span>
      {text.slice(at + highlight.length)}
    </>
  );
}

function scoreToGrade(correct: number, total: number): Grade3 {
  if (total === 0) return "good";
  const pct = correct / total;
  if (pct >= 0.9) return "easy";
  if (pct >= 0.6) return "good";
  return "again";
}

export default function GrammarRunner({ concept }: { concept: GrammarConcept }) {
  const { progress, gradeItem, completeGrammar } = useProgress();
  const [phase, setPhase] = useState<Phase>(() => (concept.hook ? "predict" : "discover"));
  const [guess, setGuess] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const exercises = concept.exercises;
  const total = exercises.length;

  function finishDrills(finalCorrect: number) {
    gradeItem(grammarCardId(concept.id), scoreToGrade(finalCorrect, total));
    completeGrammar(concept.id);
    setPhase("done");
  }

  function handleAnswered(wasCorrect: boolean) {
    const nextCorrect = correctCount + (wasCorrect ? 1 : 0);
    setCorrectCount(nextCorrect);
    if (index + 1 >= total) {
      finishDrills(nextCorrect);
    } else {
      setIndex(index + 1);
    }
  }

  // ── Predict (curiosity hook) ─────────────────────────────────────────────
  if (phase === "predict" && concept.hook) {
    const hook = concept.hook;
    const answered = guess !== null;
    const gotIt = guess === hook.answerIndex;
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 py-6">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/vyakaran" aria-label="Back to grammar" className="text-ink-soft">
            <span aria-hidden="true">←</span>
          </Link>
          <h1 className="text-lg font-semibold text-ink">{concept.title}</h1>
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-marigold">
          <span aria-hidden="true">💭</span> Take a guess
        </div>
        <p className="mb-6 text-lg font-medium leading-relaxed text-ink">{hook.question}</p>

        <div className="flex flex-col gap-2">
          {hook.guesses.map((g, i) => {
            const show = answered;
            const isThis = guess === i;
            const isRight = i === hook.answerIndex;
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => setGuess(i)}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                  show && isRight
                    ? "border-good bg-good/10"
                    : show && isThis
                      ? "border-bad bg-bad/10"
                      : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <span className="guj text-lg font-medium text-ink">{g.text}</span>
                {g.roman && <span className="text-sm text-ink-soft">{g.roman}</span>}
              </button>
            );
          })}
        </div>

        {answered && (
          <>
            <div className="mt-5 rounded-2xl border border-marigold/40 bg-marigold/10 p-4 text-sm text-ink">
              <span className="font-semibold">
                {gotIt ? "Good instinct! " : "Interesting guess — "}
              </span>
              {hook.reveal}
            </div>
            <button
              type="button"
              onClick={() => setPhase("discover")}
              className="mt-6 w-full rounded-full bg-peacock px-6 py-3.5 text-base font-semibold text-on-accent active:scale-[.99]"
            >
              See why →
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Discover ───────────────────────────────────────────────────────────
  if (phase === "discover") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 py-6">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/vyakaran" aria-label="Back to grammar" className="text-ink-soft">
            <span aria-hidden="true">←</span>
          </Link>
          <h1 className="text-lg font-semibold text-ink">{concept.title}</h1>
        </div>

        <p className="mb-4 text-sm text-ink-soft">{concept.discovery.intro}</p>

        <div className="flex flex-col gap-3">
          {concept.discovery.examples.map((ex: GrammarExample, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]"
            >
              <AudioButton src={ex.audio} gujarati={ex.gujarati} size="sm" />
              <div className="min-w-0">
                <div className="guj text-2xl font-medium text-ink">
                  <Highlighted text={ex.gujarati} highlight={ex.highlight} />
                </div>
                <div className="text-sm text-ink-soft">{ex.roman}</div>
                <div className="text-sm text-ink">{ex.english}</div>
                {ex.note && (
                  <div className="mt-0.5 text-xs font-medium text-peacock">{ex.note}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {revealed ? (
          <div className="mt-5 flex flex-col gap-3">
            <div className="rounded-2xl border border-peacock/40 bg-peacock/10 p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-peacock">
                The pattern
              </div>
              <p className="text-sm leading-relaxed text-ink">{concept.discovery.rule}</p>
            </div>
            {concept.contrast && (
              <div className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  💡 For an English speaker
                </div>
                <p className="text-sm leading-relaxed text-ink">{concept.contrast}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setPhase("drill")}
              className="mt-2 w-full rounded-full bg-peacock px-6 py-3.5 text-base font-semibold text-on-accent active:scale-[.99]"
            >
              Start practice →
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-6 w-full rounded-full border border-peacock bg-peacock/10 px-6 py-3.5 text-base font-semibold text-peacock active:scale-[.99]"
          >
            What&apos;s the pattern? →
          </button>
        )}
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-5 px-6 py-10 text-center">
        <div className="text-6xl" aria-hidden="true">
          🧩
        </div>
        <h1 className="text-3xl">Concept mastered!</h1>
        <p className="text-ink-soft">
          <span className="font-semibold text-peacock">+{XP.grammarConcept} XP</span> — you got{" "}
          {correctCount}/{total}. It&apos;ll come back for review to lock it in.
        </p>
        <p className="rounded-2xl border border-line bg-surface px-5 py-3 font-serif text-lg text-ink shadow-[var(--shadow)]">
          {concept.title}
        </p>
        <div className="mt-2 w-full">
          <FunFactCard fact={funFactFor(progress.completedGrammar.length + 3)} />
        </div>
        <div className="mt-4 flex w-full flex-col gap-3">
          <Link
            href="/vyakaran"
            className="w-full rounded-full bg-peacock px-6 py-3.5 text-base font-semibold text-on-accent"
          >
            Back to grammar →
          </Link>
          <Link
            href="/"
            className="w-full rounded-full border border-line bg-surface px-6 py-3.5 text-base font-semibold text-ink"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Drill ────────────────────────────────────────────────────────────────
  const exercise = exercises[index];
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/vyakaran" aria-label="Exit" className="text-ink-soft">
          <span aria-hidden="true">✕</span>
        </Link>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-peacock transition-[width]"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-ink-soft">
          {index + 1}/{total}
        </span>
      </div>

      {exercise.kind === "build" ? (
        <BuildDrill key={exercise.id} exercise={exercise} onAnswered={handleAnswered} />
      ) : (
        <ChooseDrill key={exercise.id} exercise={exercise} onAnswered={handleAnswered} />
      )}
    </div>
  );
}

// ── Choose / cloze drill ─────────────────────────────────────────────────────

function ChooseDrill({
  exercise,
  onAnswered,
}: {
  exercise: GrammarExercise;
  onAnswered: (correct: boolean) => void;
}) {
  const options = seededShuffle(exercise.options ?? [], exercise.id);
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  // `picked` indexes the shuffled `options`, so read correctness from there.
  const pickedOption = picked !== null ? options[picked] : null;
  const isCorrect = pickedOption?.correct === true;

  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-4 text-sm font-medium text-ink">{exercise.prompt}</p>

      {exercise.frame && (
        <div className="mb-5 flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface p-6 text-center shadow-[var(--shadow)]">
          <div className="guj text-3xl font-medium text-ink">{exercise.frame}</div>
          {exercise.frameRoman && <div className="text-sm text-ink-soft">{exercise.frameRoman}</div>}
          {exercise.english && <div className="mt-1 text-sm text-ink">{exercise.english}</div>}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const show = answered;
          const isThis = picked === i;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                show && opt.correct
                  ? "border-good bg-good/10"
                  : show && isThis
                    ? "border-bad bg-bad/10"
                    : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              <span className="guj text-xl font-medium text-ink">{opt.text}</span>
              {opt.roman && <span className="text-sm text-ink-soft">{opt.roman}</span>}
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          <div
            className={`mt-5 rounded-2xl border p-4 text-sm ${
              isCorrect ? "border-good/40 bg-good/5 text-ink" : "border-bad/40 bg-bad/5 text-ink"
            }`}
          >
            <span className="font-semibold">{isCorrect ? "Correct! " : "Not quite. "}</span>
            {exercise.explain ??
              (pickedOption?.correct ? "" : "Have another look at the pattern.")}
          </div>
          <button
            type="button"
            onClick={() => onAnswered(isCorrect)}
            className="mt-6 w-full rounded-full bg-peacock px-6 py-3.5 text-base font-semibold text-on-accent"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}

// ── Build (word-order) drill ─────────────────────────────────────────────────

function BuildDrill({
  exercise,
  onAnswered,
}: {
  exercise: GrammarExercise;
  onAnswered: (correct: boolean) => void;
}) {
  const answer = exercise.answer ?? [];
  const roman = exercise.answerRoman ?? [];
  // Tiles carry their correct position so we can compare regardless of shuffle.
  const tiles = seededShuffle(
    answer.map((token, i) => ({ token, roman: roman[i], pos: i })),
    exercise.id,
  );

  const [placed, setPlaced] = useState<number[]>([]); // indices into `tiles`
  const [checked, setChecked] = useState(false);

  const placedSet = new Set(placed);
  const isComplete = placed.length === answer.length;
  const builtTokens = placed.map((ti) => tiles[ti].token);
  const isCorrect = isComplete && builtTokens.every((t, i) => t === answer[i]);

  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-1 text-sm font-medium text-ink">{exercise.prompt}</p>
      {exercise.english && <p className="mb-4 text-sm text-ink-soft">“{exercise.english}”</p>}

      {/* Build area */}
      <div className="mb-4 min-h-[64px] rounded-2xl border border-dashed border-line bg-surface-2 p-3">
        {placed.length === 0 ? (
          <span className="text-sm text-ink-soft">Tap the words in order…</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {placed.map((ti, slot) => (
              <button
                key={slot}
                type="button"
                disabled={checked}
                onClick={() => setPlaced(placed.filter((_, s) => s !== slot))}
                className="guj rounded-xl border border-peacock bg-peacock/10 px-3 py-2 text-lg text-ink"
              >
                {tiles[ti].token}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {tiles.map((t, ti) =>
          placedSet.has(ti) ? (
            <span
              key={ti}
              className="guj rounded-xl border border-line bg-surface-2 px-3 py-2 text-lg text-ink-soft opacity-40"
            >
              {t.token}
            </span>
          ) : (
            <button
              key={ti}
              type="button"
              disabled={checked}
              onClick={() => setPlaced([...placed, ti])}
              className="guj flex flex-col items-center rounded-xl border border-line bg-surface px-3 py-2 text-lg text-ink hover:bg-surface-2"
            >
              <span>{t.token}</span>
              {t.roman && <span className="text-[10px] text-ink-soft">{t.roman}</span>}
            </button>
          ),
        )}
      </div>

      <div className="mt-auto pt-6">
        {checked ? (
          <>
            <div
              className={`mb-4 rounded-2xl border p-4 text-sm ${
                isCorrect ? "border-good/40 bg-good/5 text-ink" : "border-bad/40 bg-bad/5 text-ink"
              }`}
            >
              <span className="font-semibold">{isCorrect ? "Correct! " : "Close — "}</span>
              {!isCorrect && (
                <span className="guj">Right order: {answer.join(" ")}. </span>
              )}
              {exercise.explain}
            </div>
            <button
              type="button"
              onClick={() => onAnswered(isCorrect)}
              className="w-full rounded-full bg-peacock px-6 py-3.5 text-base font-semibold text-on-accent"
            >
              Continue
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={!isComplete}
            onClick={() => setChecked(true)}
            className="w-full rounded-full bg-peacock px-6 py-3.5 text-base font-semibold text-on-accent transition-opacity disabled:opacity-40"
          >
            Check
          </button>
        )}
      </div>
    </div>
  );
}
