"use client";

// Onboarding: five quick screens that end with you knowing what you signed up
// for.
//
// It used to be three — why, goal, say hello — and then you were dropped on the
// home screen having never been told what the app would teach you or how long
// it takes. Two things changed:
//
//   Your name in Gujarati. It costs one input and it's the first moment the
//   script stops being decoration and becomes *yours*. It also sets up the
//   milestone that the whole writing track builds toward (docs/LEKHAN.md §5).
//
//   The plan. Four pillars, one line each, an honest five-minutes-a-day, and
//   the first milestone named. Expectations set once, up front.
//
// What left: the "teach me properly" grammar toggle. It asked people to decide
// about Gujarati grammar in the first thirty seconds, before they'd seen any,
// and then delivered one extra button. Vyakaran is now offered when it's
// relevant, and is a preference in Account — see lib/core/personalize.ts.

import { useState } from "react";
import { MOTIVATIONS, GOAL_SUGGESTIONS, ITEMS_BY_ID } from "@/lib/content";
import { transliterateRoman } from "@/lib/core/translit";
import { playAudio } from "@/lib/client/speech";
import type { OnboardingAnswers } from "@/lib/core/progress";
import AudioButton from "./AudioButton";

const KEM_CHO = ITEMS_BY_ID["kem-cho"];

interface OnboardingProps {
  onFinish: (answers: OnboardingAnswers) => void;
}

const TOTAL_STEPS = 5;

const PILLARS: { guj: string; label: string; blurb: string; emoji: string }[] = [
  { guj: "વાત", label: "Speak", blurb: "Real phrases from day one, out loud.", emoji: "💬" },
  { guj: "અક્ષર", label: "The script", blurb: "Read it, write it by hand, type it.", emoji: "✍️" },
  { guj: "વ્યાકરણ", label: "Grammar", blurb: "Why the words change shape — when you want it.", emoji: "🧩" },
  { guj: "સંગ્રહ", label: "Remember", blurb: "Reviews timed so nothing slips away.", emoji: "🔁" },
];

export default function Onboarding({ onFinish }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [motivationId, setMotivationId] = useState<string | null>(null);
  const [goal, setGoal] = useState<string>("");
  const [customGoal, setCustomGoal] = useState("");
  const [name, setName] = useState("");
  const [said, setSaid] = useState(false);

  const effectiveGoal = goal || customGoal.trim();
  const nameGujarati = name.trim() ? transliterateRoman(name.trim()) : "";

  function finish() {
    onFinish({
      goal: effectiveGoal || GOAL_SUGGESTIONS[0],
      motivation: motivationId ?? MOTIVATIONS[0].id,
      ...(name.trim() ? { name: name.trim(), nameGujarati } : {}),
    });
  }

  const back = (to: number) => (
    <button
      type="button"
      onClick={() => setStep(to)}
      className="rounded-full border border-line bg-surface px-5 py-3.5 text-sm font-medium text-ink-soft"
    >
      Back
    </button>
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 py-8">
      {/* Progress dots */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`h-2 w-2 rounded-full transition-colors ${
              i === step ? "bg-marigold" : i < step ? "bg-marigold/50" : "bg-line"
            }`}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-1 text-2xl">Why are you here? 🌱</h2>
          <p className="mb-6 text-sm text-ink-soft">
            Pick what fits best — it helps us keep things relevant to you.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {MOTIVATIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMotivationId(m.id)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  motivationId === m.id
                    ? "border-marigold bg-marigold/10"
                    : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <div className="mb-1 text-2xl" aria-hidden="true">
                  {m.emoji}
                </div>
                <div className="text-sm font-semibold text-ink">{m.label}</div>
                <div className="mt-0.5 text-xs text-ink-soft">{m.blurb}</div>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <button
              type="button"
              disabled={!motivationId}
              onClick={() => setStep(1)}
              className="w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent transition-opacity disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-1 text-2xl">Your goal 🎯</h2>
          <p className="mb-6 text-sm text-ink-soft">
            What would make you feel proud in a few weeks? Pick one, or write your own.
          </p>
          <div className="flex flex-col gap-2">
            {GOAL_SUGGESTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGoal(g);
                  setCustomGoal("");
                }}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                  goal === g
                    ? "border-magenta bg-magenta/10 text-ink"
                    : "border-line bg-surface text-ink hover:bg-surface-2"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label htmlFor="custom-goal" className="mb-1 block text-xs text-ink-soft">
              Or type your own
            </label>
            <input
              id="custom-goal"
              type="text"
              value={customGoal}
              onChange={(e) => {
                setCustomGoal(e.target.value);
                if (e.target.value) setGoal("");
              }}
              placeholder="e.g. Sing along at Garba"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus-visible:border-magenta"
            />
          </div>
          <div className="mt-auto flex gap-2 pt-6">
            {back(0)}
            <button
              type="button"
              disabled={!effectiveGoal}
              onClick={() => setStep(2)}
              className="flex-1 rounded-full bg-magenta px-6 py-3.5 text-base font-semibold text-on-accent transition-opacity disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Your name, in Gujarati ────────────────────────────────────────
          The only Gujarati in this app that isn't authored and reviewed. It
          can't be: nobody can look up how *your* name is spelled, and the
          person typing it is the one qualified to say. So we render what a
          phonetic keyboard would render and let them correct it. */}
      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-1 text-2xl">What should we call you? 🪔</h2>
          <p className="mb-6 text-sm text-ink-soft">
            Type it the way it sounds. We&apos;ll show you your name in Gujarati — and one
            day soon, how to write it by hand.
          </p>

          <input
            id="learner-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Smita"
            autoComplete="given-name"
            autoCapitalize="words"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus-visible:border-peacock"
          />

          <div className="mt-5 flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface p-6 text-center shadow-[var(--shadow)]">
            {nameGujarati ? (
              <>
                <div className="guj text-4xl font-medium text-ink">{nameGujarati}</div>
                <div className="text-xs text-ink-soft">That&apos;s you.</div>
              </>
            ) : (
              <div className="text-sm text-ink-soft">Your name will appear here ✨</div>
            )}
          </div>

          {nameGujarati && (
            <p className="mt-3 text-center text-xs text-ink-soft">
              Not quite right? Gujarati spells names by sound — try writing the vowels you
              actually hear (<span className="font-mono text-ink">garaba</span>, not{" "}
              <span className="font-mono text-ink">garba</span>). You can change it any time.
            </p>
          )}

          <div className="mt-auto flex gap-2 pt-6">
            {back(1)}
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 rounded-full bg-peacock px-6 py-3.5 text-base font-semibold text-on-accent"
            >
              {nameGujarati ? "That's me" : "Skip for now"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-1 text-2xl">Say your first word 🗣️</h2>
          <p className="mb-6 text-sm text-ink-soft">
            Every journey starts with hello. Listen, then say it out loud.
          </p>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow)]">
            <div className="guj text-4xl font-medium text-ink">{KEM_CHO.gujarati}</div>
            <div className="text-lg text-ink-soft">{KEM_CHO.roman}</div>
            <div className="text-sm text-ink-soft">&ldquo;How are you?&rdquo;</div>
            <AudioButton
              src={KEM_CHO.audio}
              gujarati={KEM_CHO.gujarati}
              label="Play Kem cho"
              size="lg"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSaid(true);
              void playAudio(KEM_CHO.audio, KEM_CHO.gujarati);
            }}
            className={`mt-6 w-full rounded-full border px-6 py-3.5 text-base font-semibold transition-colors ${
              said
                ? "border-good bg-good/10 text-good"
                : "border-line bg-surface text-ink hover:bg-surface-2"
            }`}
          >
            {said ? "Nice! 🎉 I said it!" : "I said it!"}
          </button>
          <div className="mt-auto flex gap-2 pt-6">
            {back(2)}
            <button
              type="button"
              onClick={() => setStep(4)}
              className="flex-1 rounded-full bg-magenta px-6 py-3.5 text-base font-semibold text-on-accent"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── The plan ───────────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-1 text-2xl">Here&apos;s the plan 🗺️</h2>
          <p className="mb-5 text-sm text-ink-soft">
            Four things, woven together. About five minutes a day — short sessions beat
            long ones, and we&apos;ll never guilt you for missing one.
          </p>

          <ul className="flex flex-col gap-2">
            {PILLARS.map((p) => (
              <li
                key={p.guj}
                className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5"
              >
                <span className="text-xl" aria-hidden="true">
                  {p.emoji}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-baseline gap-2">
                    <span className="guj text-sm font-semibold text-ink">{p.guj}</span>
                    <span className="text-sm font-semibold text-ink">{p.label}</span>
                  </span>
                  <span className="text-xs text-ink-soft">{p.blurb}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-2xl border border-marigold/40 bg-marigold/10 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-marigold">
              First milestone
            </div>
            <p className="mt-0.5 text-base font-semibold text-ink">🌱 Your first Gujarati</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Finish one lesson — about five minutes from now. There are ten more after it,
              and the last one is holding your own in a real conversation.
            </p>
          </div>

          <div className="mt-auto flex gap-2 pt-6">
            {back(3)}
            <button
              type="button"
              onClick={finish}
              className="flex-1 rounded-full bg-peacock px-6 py-3.5 text-base font-semibold text-on-accent"
            >
              Let&apos;s go →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
