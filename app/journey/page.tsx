"use client";

// The journey — everything you're working toward, in one place.
//
// This is the app's answer to "how far am I?", and it deliberately isn't a
// percentage. Progress used to live in four disconnected corners; here the
// letters you can read, the ones you can form by hand, the words you can type
// and the grammar you understand all count toward the same list.

import Link from "next/link";
import { useMemo } from "react";
import { useProgress } from "@/lib/client/useProgress";
import { milestoneCatalog } from "@/lib/content/milestones";
import { milestoneStates } from "@/lib/core/milestones";
import MilestoneRow from "@/components/MilestoneRow";

export default function JourneyPage() {
  const { progress, hydrated } = useProgress();

  const states = useMemo(
    () => (hydrated ? milestoneStates(progress, milestoneCatalog(progress)) : []),
    [progress, hydrated],
  );

  const earned = states.filter((s) => s.earned);
  const open = states.filter((s) => !s.earned);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="guj animate-pulse text-lg text-ink-soft">કેમ છો...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6 px-4 py-6 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back home" className="text-ink-soft">
          <span aria-hidden="true">←</span>
        </Link>
        <div className="flex items-baseline gap-2">
          <h1 className="guj text-2xl">સફર</h1>
          <span className="text-sm font-semibold text-ink-soft">Your journey</span>
        </div>
      </div>

      <div className="rounded-2xl border border-marigold/40 bg-marigold/10 p-4 text-center">
        <div className="font-serif text-3xl font-semibold text-ink">
          {earned.length}
          <span className="text-lg text-ink-soft"> / {states.length}</span>
        </div>
        <p className="mt-0.5 text-sm text-ink-soft">
          {earned.length === 0
            ? "Every one of these is a thing you'll be able to do."
            : earned.length === states.length
              ? "All of them. Genuinely — that's the whole journey."
              : "Things you can do in Gujarati that you couldn't before."}
        </p>
      </div>

      {open.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Ahead
          </h2>
          {open.map((s) => (
            <MilestoneRow key={s.milestone.id} state={s} />
          ))}
        </section>
      )}

      {earned.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Done
          </h2>
          {earned.map((s) => (
            <MilestoneRow key={s.milestone.id} state={s} />
          ))}
        </section>
      )}
    </div>
  );
}
