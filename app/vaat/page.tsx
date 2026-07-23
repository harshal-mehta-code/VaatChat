"use client";

import Link from "next/link";
import { SCENARIOS } from "@/lib/content";
import { useProgress } from "@/lib/client/useProgress";

export default function VaatListPage() {
  const { progress, hydrated } = useProgress();

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6 pb-16">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back home" className="text-ink-soft">
          <span aria-hidden="true">←</span>
        </Link>
        <h1 className="guj text-2xl">વાત Mode</h1>
      </div>
      <p className="text-sm text-ink-soft">
        Real, scripted conversations — practice what you&apos;ve learned with a friendly character.
      </p>

      <div className="flex flex-col gap-3">
        {SCENARIOS.map((scenario) => {
          const complete = hydrated && progress.completedScenarios.includes(scenario.id);
          return (
            <Link
              key={scenario.id}
              href={`/vaat/${scenario.id}`}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)] transition-colors hover:bg-surface-2"
            >
              <span className="text-3xl" aria-hidden="true">
                {scenario.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="guj text-sm font-semibold text-ink">{scenario.characterGuj}</span>
                  <span className="text-xs text-ink-soft">{scenario.character}</span>
                </div>
                <div className="text-base font-semibold text-ink">{scenario.title}</div>
                <div className="text-xs text-ink-soft">{scenario.blurb}</div>
              </div>
              {complete && (
                <span
                  aria-label="Completed"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-good/20 text-good"
                >
                  ✓
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
