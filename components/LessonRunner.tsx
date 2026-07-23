"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Exercise, LexItem, Lesson } from "@/lib/core/types";
import type { Grade3 } from "@/lib/core/srs";
import { ITEMS_BY_ID, UNITS_BY_ID } from "@/lib/content";
import { XP } from "@/lib/core/gamification";
import { useProgress } from "@/lib/client/useProgress";
import { playAudio, listenOnce, sttSupported } from "@/lib/client/speech";
import AudioButton from "./AudioButton";
import { seededShuffle } from "./shuffle";

interface LessonRunnerProps {
  lesson: Lesson;
}

export default function LessonRunner({ lesson }: LessonRunnerProps) {
  const { progress, gradeItem, completeLesson } = useProgress();
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  const total = lesson.exercises.length;
  const exercise = lesson.exercises[index];

  function handleAdvance(grade: Grade3 | null) {
    if (grade) gradeItem(exercise.itemId, grade);
    if (index + 1 >= total) {
      completeLesson(lesson.id);
      setDone(true);
    } else {
      setIndex(index + 1);
    }
  }

  if (done) {
    const unit = UNITS_BY_ID[lesson.unitId];
    const idxInUnit = unit?.lessons.findIndex((l) => l.id === lesson.id) ?? -1;
    const nextLesson =
      unit && idxInUnit >= 0 ? unit.lessons[idxInUnit + 1] : undefined;

    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-5 px-6 py-10 text-center">
        <div className="text-6xl" aria-hidden="true">
          🪔
        </div>
        <h1 className="text-3xl">Lesson complete!</h1>
        <p className="text-ink-soft">
          <span className="font-semibold text-marigold">+{XP.lessonComplete} XP</span> — you&apos;re
          a step closer to:
        </p>
        <p className="rounded-2xl border border-line bg-surface px-5 py-3 font-serif text-lg text-ink shadow-[var(--shadow)]">
          {progress.goal ?? "your goal"}
        </p>
        <div className="mt-4 flex w-full flex-col gap-3">
          {nextLesson && (
            <Link
              href={`/lesson/${nextLesson.id}`}
              className="w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent"
            >
              Next lesson →
            </Link>
          )}
          <Link
            href="/"
            className="w-full rounded-full border border-line bg-surface px-6 py-3.5 text-base font-semibold text-ink"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const item = ITEMS_BY_ID[exercise.itemId];
  if (!item) {
    return (
      <div className="mx-auto max-w-[480px] px-6 py-10 text-center text-ink-soft">
        Something&apos;s missing for this exercise.{" "}
        <Link href="/" className="text-peacock underline">
          Back home
        </Link>
      </div>
    );
  }
  const distractors = (exercise.distractorIds ?? [])
    .map((id) => ITEMS_BY_ID[id])
    .filter((i): i is LexItem => Boolean(i));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" aria-label="Exit lesson" className="text-ink-soft">
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

      <ExerciseView
        key={exercise.id}
        exercise={exercise}
        item={item}
        distractors={distractors}
        onAdvance={handleAdvance}
      />
    </div>
  );
}

// ── Per-exercise views ──────────────────────────────────────────────────────

interface ExerciseViewProps {
  exercise: Exercise;
  item: LexItem;
  distractors: LexItem[];
  onAdvance: (grade: Grade3 | null) => void;
}

function ExerciseView({ exercise, item, distractors, onAdvance }: ExerciseViewProps) {
  switch (exercise.kind) {
    case "recall":
      return <RecallExercise exercise={exercise} item={item} distractors={distractors} onAdvance={onAdvance} />;
    case "listen":
      return <ListenExercise exercise={exercise} item={item} distractors={distractors} onAdvance={onAdvance} />;
    case "speak":
      return <SpeakExercise item={item} onAdvance={onAdvance} />;
    case "intro":
    case "assemble":
    case "dialogue":
    default:
      return <IntroExercise item={item} onAdvance={onAdvance} />;
  }
}

function IntroExercise({ item, onAdvance }: { item: LexItem; onAdvance: (grade: Grade3 | null) => void }) {
  useEffect(() => {
    void playAudio(item.audio, item.gujarati);
    // Only on mount for this exercise instance (component is keyed by exercise.id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-ink-soft">New phrase</p>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow)]">
        <div className="guj text-4xl font-medium text-ink">{item.gujarati}</div>
        <div className="text-lg text-ink-soft">{item.roman}</div>
        <div className="text-base text-ink">{item.english}</div>
        {item.literal && (
          <div className="text-xs italic text-ink-soft">lit. &ldquo;{item.literal}&rdquo;</div>
        )}
        {item.note && <div className="mt-2 text-xs text-ink-soft">💡 {item.note}</div>}
        <div className="mt-2">
          <AudioButton src={item.audio} gujarati={item.gujarati} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onAdvance(null)}
        className="mt-6 w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent"
      >
        Got it
      </button>
    </div>
  );
}

function RecallExercise({
  exercise,
  item,
  distractors,
  onAdvance,
}: {
  exercise: Exercise;
  item: LexItem;
  distractors: LexItem[];
  onAdvance: (grade: Grade3 | null) => void;
}) {
  const options = seededShuffle([item, ...distractors], exercise.id);
  const [selected, setSelected] = useState<string | null>(null);

  const correct = selected === item.english;

  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-ink-soft">
        What does this mean?
      </p>
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <AudioButton src={item.audio} gujarati={item.gujarati} size="sm" />
        <div>
          <div className="guj text-2xl font-medium text-ink">{item.gujarati}</div>
          <div className="text-sm text-ink-soft">{item.roman}</div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isSelected = selected === opt.english;
          const showState = selected !== null;
          const isCorrectOpt = opt.english === item.english;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={selected !== null}
              onClick={() => setSelected(opt.english)}
              className={`rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
                showState && isCorrectOpt
                  ? "border-good bg-good/10 text-good"
                  : showState && isSelected
                    ? "border-bad bg-bad/10 text-bad"
                    : "border-line bg-surface text-ink hover:bg-surface-2"
              }`}
            >
              {opt.english}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <button
          type="button"
          onClick={() => onAdvance(correct ? "good" : "again")}
          className="mt-6 w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent"
        >
          {correct ? "Continue" : "Got it — continue"}
        </button>
      )}
    </div>
  );
}

function ListenExercise({
  exercise,
  item,
  distractors,
  onAdvance,
}: {
  exercise: Exercise;
  item: LexItem;
  distractors: LexItem[];
  onAdvance: (grade: Grade3 | null) => void;
}) {
  const options = seededShuffle([item, ...distractors], exercise.id);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    void playAudio(item.audio, item.gujarati);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const correct = selected === item.id;

  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-ink-soft">
        Which word did you hear?
      </p>
      <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow)]">
        <AudioButton src={item.audio} gujarati={item.gujarati} />
        <span className="text-xs text-ink-soft">Tap to replay</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          const showState = selected !== null;
          const isCorrectOpt = opt.id === item.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={selected !== null}
              onClick={() => setSelected(opt.id)}
              className={`guj rounded-2xl border px-4 py-4 text-center text-xl font-medium transition-colors ${
                showState && isCorrectOpt
                  ? "border-good bg-good/10 text-good"
                  : showState && isSelected
                    ? "border-bad bg-bad/10 text-bad"
                    : "border-line bg-surface text-ink hover:bg-surface-2"
              }`}
            >
              {opt.gujarati}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <button
          type="button"
          onClick={() => onAdvance(correct ? "good" : "again")}
          className="mt-6 w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent"
        >
          {correct ? "Continue" : "Got it — continue"}
        </button>
      )}
    </div>
  );
}

function SpeakExercise({
  item,
  onAdvance,
}: {
  item: LexItem;
  onAdvance: (grade: Grade3 | null) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [selfChecked, setSelfChecked] = useState(false);

  useEffect(() => {
    setSupported(sttSupported());
  }, []);

  async function handleSayIt() {
    setListening(true);
    setTranscript(null);
    const res = await listenOnce();
    setListening(false);
    setTranscript(res.transcript);
  }

  const heardSomething = !!transcript && transcript.trim().length > 0;
  const attempted = transcript !== null || selfChecked;

  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-ink-soft">Say it out loud</p>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow)]">
        <div className="guj text-4xl font-medium text-ink">{item.gujarati}</div>
        <div className="text-lg text-ink-soft">{item.roman}</div>
        <div className="text-base text-ink">{item.english}</div>
        <div className="mt-2">
          <AudioButton src={item.audio} gujarati={item.gujarati} />
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        {supported ? (
          <>
            <button
              type="button"
              onClick={() => void handleSayIt()}
              disabled={listening}
              className="w-full rounded-full border border-peacock bg-peacock/10 px-6 py-3.5 text-base font-semibold text-peacock transition-opacity disabled:opacity-60"
            >
              {listening ? "Listening…" : "🎤 Say it"}
            </button>
            {transcript !== null && (
              <p className="text-sm text-ink-soft">
                {heardSomething ? (
                  <>
                    We heard: <span className="guj">{transcript}</span> — nice work! 🎉
                  </>
                ) : (
                  "Didn't quite catch that — want to try again?"
                )}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-ink-soft">
              Speech recognition isn&apos;t available here — self-check instead.
            </p>
            <button
              type="button"
              onClick={() => setSelfChecked(true)}
              disabled={selfChecked}
              className="w-full rounded-full border border-peacock bg-peacock/10 px-6 py-3.5 text-base font-semibold text-peacock disabled:opacity-60"
            >
              {selfChecked ? "Nice! 👍" : "I said it 👍"}
            </button>
          </>
        )}
      </div>

      {attempted && (
        <button
          type="button"
          onClick={() => onAdvance(heardSomething || selfChecked ? "good" : "again")}
          className="mt-6 w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent"
        >
          Continue
        </button>
      )}
    </div>
  );
}
