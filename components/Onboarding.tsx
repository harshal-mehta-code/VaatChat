"use client";

// Three warm, quick onboarding steps: motivation → goal → first word.

import { useState } from "react";
import { MOTIVATIONS, GOAL_SUGGESTIONS } from "@/lib/content";
import { speak } from "@/lib/client/speech";
import AudioButton from "./AudioButton";

interface OnboardingProps {
  onFinish: (goal: string, motivation: string) => void;
}

const TOTAL_STEPS = 3;

export default function Onboarding({ onFinish }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [motivationId, setMotivationId] = useState<string | null>(null);
  const [goal, setGoal] = useState<string>("");
  const [customGoal, setCustomGoal] = useState("");
  const [said, setSaid] = useState(false);

  const effectiveGoal = goal || customGoal.trim();

  function finish() {
    const finalGoal = effectiveGoal || GOAL_SUGGESTIONS[0];
    const finalMotivation = motivationId ?? MOTIVATIONS[0].id;
    onFinish(finalGoal, finalMotivation);
  }

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
            <button
              type="button"
              onClick={() => setStep(0)}
              className="rounded-full border border-line bg-surface px-5 py-3.5 text-sm font-medium text-ink-soft"
            >
              Back
            </button>
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

      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-1 text-2xl">Say your first word 🗣️</h2>
          <p className="mb-6 text-sm text-ink-soft">
            Every journey starts with hello. Listen, then say it out loud.
          </p>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow)]">
            <div className="guj text-4xl font-medium text-ink">કેમ છો?</div>
            <div className="text-lg text-ink-soft">Kem cho?</div>
            <div className="text-sm text-ink-soft">&ldquo;How are you?&rdquo;</div>
            <AudioButton
              gujarati="કેમ છો?"
              label="Play Kem cho"
              size="lg"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSaid(true);
              speak("કેમ છો?");
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
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full border border-line bg-surface px-5 py-3.5 text-sm font-medium text-ink-soft"
            >
              Back
            </button>
            <button
              type="button"
              onClick={finish}
              className="flex-1 rounded-full bg-peacock px-6 py-3.5 text-base font-semibold text-on-accent"
            >
              Start learning →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
