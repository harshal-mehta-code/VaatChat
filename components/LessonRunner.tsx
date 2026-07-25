"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Exercise, LexItem, Lesson } from "@/lib/core/types";
import type { Grade3 } from "@/lib/core/srs";
import { ITEMS_BY_ID, UNITS_BY_ID, funFactFor, tipForLesson, type GrammarTip } from "@/lib/content";
import { XP } from "@/lib/core/gamification";
import { useProgress } from "@/lib/client/useProgress";
import { playAudio, listenOnce, sttSupported } from "@/lib/client/speech";
import AudioButton from "./AudioButton";
import FunFactCard from "./FunFactCard";
import { planLesson } from "@/lib/core/session";
import { makeRng, newSeed, sample, seededShuffle } from "@/lib/core/variation";

interface LessonRunnerProps {
  lesson: Lesson;
}

type Step =
  | { kind: "exercise"; exercise: Exercise }
  | { kind: "tip"; tip: GrammarTip };

/**
 * Lesson steps = this sitting's exercises, with the lesson's grammar tip (if it
 * has one) inserted after the last intro/predict — i.e. once every word has been
 * met, but before the drills. Grammar in context, at the moment it pays off.
 */
function buildSteps(lesson: Lesson, seed: string): Step[] {
  const exercises = planLesson(lesson.exercises, makeRng(seed));
  const steps: Step[] = exercises.map((exercise) => ({ kind: "exercise", exercise }));
  const tip = tipForLesson(lesson.id);
  if (!tip) return steps;

  const lastIntro = exercises.reduce(
    (last, ex, i) => (ex.kind === "intro" || ex.kind === "predict" ? i : last),
    -1,
  );
  steps.splice(lastIntro + 1, 0, { kind: "tip", tip });
  return steps;
}

/** How many wrong answers a multiple-choice exercise shows. */
const OPTIONS = 3;

export default function LessonRunner({ lesson }: LessonRunnerProps) {
  const { progress, gradeItem, completeLesson } = useProgress();
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  // One seed for this sitting. Everything that varies hangs off it, so the
  // lesson is stable while you're in it and different when you come back —
  // rather than a seed like the exercise id, which is stable *forever* and is
  // how an app ends up with the answer always in the same place.
  const [seed] = useState(newSeed);

  // The lesson's steps: this sitting's exercises, plus (for some lessons) one
  // grammar tip slipped in right after the introduction phase — the learner has
  // just met every word, so the pattern connecting them lands before the drills.
  const steps = useMemo(() => buildSteps(lesson, seed), [lesson, seed]);
  const total = steps.length;
  const step = steps[index];
  const exercise = step?.kind === "exercise" ? step.exercise : undefined;

  function handleAdvance(grade: Grade3 | null) {
    if (grade && exercise) gradeItem(exercise.itemId, grade);
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
        <div className="mt-2 w-full">
          <FunFactCard fact={funFactFor(progress.completedLessons.length)} />
        </div>
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

  const item = exercise ? ITEMS_BY_ID[exercise.itemId] : undefined;
  if (step?.kind === "exercise" && !item) {
    return (
      <div className="mx-auto max-w-[480px] px-6 py-10 text-center text-ink-soft">
        Something&apos;s missing for this exercise.{" "}
        <Link href="/" className="text-peacock underline">
          Back home
        </Link>
      </div>
    );
  }
  // Three wrong answers drawn from the exercise's candidate pool. Seeded on the
  // exercise *and* the session, so they hold still while you're choosing and
  // aren't the same three you dismissed on sight last time.
  const distractors = exercise
    ? sample(
        (exercise.distractorIds ?? [])
          .map((id) => ITEMS_BY_ID[id])
          .filter((i): i is LexItem => Boolean(i)),
        makeRng(`${seed}:${exercise.id}`),
        OPTIONS,
      )
    : [];

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

      {step?.kind === "tip" ? (
        <GrammarTipCard key={step.tip.id} tip={step.tip} onContinue={() => handleAdvance(null)} />
      ) : (
        exercise &&
        item && (
          <ExerciseView
            key={exercise.id}
            exercise={exercise}
            item={item}
            distractors={distractors}
            optionSeed={`${seed}:${exercise.id}`}
            onAdvance={handleAdvance}
          />
        )
      )}
    </div>
  );
}

/**
 * A grammar tip inside a vocab lesson: one pattern, phrased around the words
 * just learned, with a door into the full Vyakaran concept for anyone who
 * wants the whole story. Reading beat only — nothing to get wrong, no grading.
 */
function GrammarTipCard({ tip, onContinue }: { tip: GrammarTip; onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-peacock">
        <span aria-hidden="true">🧩</span> Grammar tip
      </div>

      <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-peacock/40 bg-peacock/10 p-5">
        <h2 className="text-lg font-semibold text-ink">{tip.title}</h2>
        <p className="text-sm leading-relaxed text-ink">{tip.body}</p>

        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
          <AudioButton src={tip.example.audio} gujarati={tip.example.gujarati} size="sm" />
          <div>
            <div className="guj text-xl font-medium text-ink">{tip.example.gujarati}</div>
            <div className="text-xs text-ink-soft">{tip.example.roman}</div>
            <div className="mt-0.5 text-sm text-ink">{tip.example.english}</div>
          </div>
        </div>

        <Link
          href={`/vyakaran/${tip.conceptId}`}
          className="text-center text-xs font-semibold text-peacock underline-offset-2 hover:underline"
        >
          Learn this properly in Vyakaran →
        </Link>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent"
      >
        Got it
      </button>
    </div>
  );
}

// ── Per-exercise views ──────────────────────────────────────────────────────

interface ExerciseViewProps {
  exercise: Exercise;
  /** Seeds the option order: stable while answering, new next sitting. */
  optionSeed: string;
  item: LexItem;
  distractors: LexItem[];
  onAdvance: (grade: Grade3 | null) => void;
}

function ExerciseView({ exercise, item, distractors, optionSeed, onAdvance }: ExerciseViewProps) {
  switch (exercise.kind) {
    case "predict":
      return <PredictExercise item={item} distractors={distractors} optionSeed={optionSeed} onAdvance={onAdvance} />;
    case "recall":
      return <RecallExercise item={item} distractors={distractors} optionSeed={optionSeed} onAdvance={onAdvance} />;
    case "listen":
      return <ListenExercise item={item} distractors={distractors} optionSeed={optionSeed} onAdvance={onAdvance} />;
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

/**
 * Predict-then-reveal: the learner commits a guess at the meaning *before*
 * seeing it. Even a wrong guess opens an information gap and primes memory
 * (pretesting / generation effect), so the reveal lands harder than a passive
 * first look — the same beat the Vyakaran hooks use, brought to vocab.
 *
 * Deliberately NOT SRS-graded: this is first exposure, so a "wrong" answer is
 * expected and grading it would poison the item's schedule before it's taught.
 */
function PredictExercise({
  item,
  distractors,
  optionSeed,
  onAdvance,
}: {
  item: LexItem;
  distractors: LexItem[];
  optionSeed: string;
  onAdvance: (grade: Grade3 | null) => void;
}) {
  const options = seededShuffle([item, ...distractors], optionSeed);
  const [guess, setGuess] = useState<string | null>(null);
  const answered = guess !== null;
  const gotIt = guess === item.english;

  useEffect(() => {
    void playAudio(item.audio, item.gujarati);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-marigold">
        <span aria-hidden="true">💭</span> Take a guess
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <AudioButton src={item.audio} gujarati={item.gujarati} size="sm" />
        <div>
          <div className="guj text-2xl font-medium text-ink">{item.gujarati}</div>
          <div className="text-sm text-ink-soft">{item.roman}</div>
        </div>
      </div>

      <p className="mb-3 text-sm text-ink-soft">
        New word — what do you think it means? A wrong guess helps you remember.
      </p>

      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isThis = guess === opt.english;
          const isRight = opt.english === item.english;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={answered}
              onClick={() => setGuess(opt.english)}
              className={`rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
                answered && isRight
                  ? "border-good bg-good/10 text-good"
                  : answered && isThis
                    ? "border-bad bg-bad/10 text-bad"
                    : "border-line bg-surface text-ink hover:bg-surface-2"
              }`}
            >
              {opt.english}
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          <div className="mt-5 rounded-2xl border border-marigold/40 bg-marigold/10 p-4 text-sm text-ink">
            <span className="font-semibold">
              {gotIt ? "Good instinct! " : "Good guess — "}
            </span>
            <span className="guj">{item.gujarati}</span> ({item.roman}) means{" "}
            <span className="font-semibold">{item.english}</span>.
            {item.literal && (
              <div className="mt-1 text-xs italic text-ink-soft">
                lit. &ldquo;{item.literal}&rdquo;
              </div>
            )}
            {item.note && <div className="mt-1 text-xs text-ink-soft">💡 {item.note}</div>}
          </div>
          <button
            type="button"
            onClick={() => onAdvance(null)}
            className="mt-6 w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent"
          >
            Got it
          </button>
        </>
      )}
    </div>
  );
}

function RecallExercise({
  item,
  distractors,
  optionSeed,
  onAdvance,
}: {
  item: LexItem;
  distractors: LexItem[];
  optionSeed: string;
  onAdvance: (grade: Grade3 | null) => void;
}) {
  const options = seededShuffle([item, ...distractors], optionSeed);
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
  item,
  distractors,
  optionSeed,
  onAdvance,
}: {
  item: LexItem;
  distractors: LexItem[];
  optionSeed: string;
  onAdvance: (grade: Grade3 | null) => void;
}) {
  const options = seededShuffle([item, ...distractors], optionSeed);
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
