"use client";

// The next milestone, on the home screen.
//
// One card, one thing to aim for. When something's just been earned it takes
// over instead — a capability you didn't have last week is worth interrupting
// for, and it's the only interruption this app makes.

import Link from "next/link";
import { useMemo } from "react";
import { useProgress } from "@/lib/client/useProgress";
import { milestoneCatalog } from "@/lib/content/milestones";
import { nextMilestone, uncelebrated, earnedMilestoneIds } from "@/lib/core/milestones";
import MilestoneRow from "./MilestoneRow";

export default function JourneyCard() {
  const { progress, hydrated, celebrateMilestones } = useProgress();

  const cat = useMemo(() => milestoneCatalog(progress), [progress]);
  const fresh = useMemo(
    () => (hydrated ? uncelebrated(progress, cat) : []),
    [progress, cat, hydrated],
  );
  const next = useMemo(
    () => (hydrated ? nextMilestone(progress, cat) : undefined),
    [progress, cat, hydrated],
  );
  const earnedCount = useMemo(
    () => (hydrated ? earnedMilestoneIds(progress, cat).length : 0),
    [progress, cat, hydrated],
  );

  if (!hydrated) return null;

  if (fresh.length > 0) {
    const won = fresh[0];
    return (
      <section className="overflow-hidden rounded-3xl border border-marigold/50 bg-marigold/10 p-5 text-center shadow-[var(--shadow)]">
        <div className="text-4xl" aria-hidden="true">
          {won.emoji}
        </div>
        <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-marigold">
          {fresh.length > 1 ? `${fresh.length} milestones reached` : "Milestone reached"}
        </div>
        <p className="mt-0.5 font-serif text-xl font-semibold text-ink">{won.title}</p>
        <p className="mt-1 text-sm text-ink-soft">{won.requirement}</p>
        <button
          type="button"
          onClick={() => celebrateMilestones(fresh.map((m) => m.id))}
          className="mt-4 w-full rounded-full bg-marigold px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
        >
          🎉 Nice!
        </button>
      </section>
    );
  }

  if (!next) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Working toward
        </h2>
        <Link href="/journey" className="text-xs font-medium text-ink-soft hover:text-ink">
          {earnedCount} earned ›
        </Link>
      </div>
      <Link href="/journey" className="block transition-transform active:scale-[.99]">
        <MilestoneRow state={next} />
      </Link>
    </section>
  );
}
