"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProgress } from "@/lib/client/useProgress";
import { milestoneCatalog } from "@/lib/content/milestones";
import { milestoneStates } from "@/lib/core/milestones";

const MODES = [
  {
    href: "/akshar",
    guj: "અક્ષર",
    title: "Akshar Lab",
    blurb: "Read it, write whole words by hand, type it",
    emoji: "📝",
    ring: "border-peacock/40 bg-peacock/10 hover:bg-peacock/15",
    chev: "text-peacock",
  },
  {
    href: "/vyakaran",
    guj: "વ્યાકરણ",
    title: "Vyakaran",
    blurb: "Learn the grammar properly",
    emoji: "🧩",
    ring: "border-marigold/40 bg-marigold/10 hover:bg-marigold/15",
    chev: "text-marigold",
  },
  {
    href: "/vaat",
    guj: "વાત",
    title: "Vaat Mode",
    blurb: "Have a real conversation",
    emoji: "💬",
    ring: "border-magenta/40 bg-magenta/10 hover:bg-magenta/15",
    chev: "text-magenta",
  },
];

export default function ExplorePage() {
  const { progress, hydrated } = useProgress();

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6 px-4 py-6 pb-24">
      <div className="flex items-baseline gap-2">
        <h1 className="guj text-2xl">શોધો</h1>
        <span className="text-sm font-semibold text-ink-soft">Explore</span>
      </div>

      <p className="text-sm text-ink-soft">
        Three ways to practice, whenever you want a change of pace.
      </p>

      <div className="flex flex-col gap-3">
        {MODES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors active:scale-[.99] ${m.ring}`}
          >
            <span className="text-3xl" aria-hidden="true">
              {m.emoji}
            </span>
            <span className="flex flex-1 flex-col">
              <span className="flex items-baseline gap-2">
                <span className="guj text-base font-semibold text-ink">{m.guj}</span>
                <span className="text-sm font-semibold text-ink">{m.title}</span>
              </span>
              <span className="text-xs text-ink-soft">{m.blurb}</span>
            </span>
            <span className={`text-xl ${m.chev}`} aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </div>

      {/* The journey. This shelf used to hold six XP thresholds — "Reach 500 XP"
          and the like — which measured activity and promised nothing. Same
          shelf, same warmth, but every tile is now a thing you can do. */}
      <JourneySummary />

    </div>
  );
}

/** The journey, as a shelf you can tap into. */
function JourneySummary() {
  const { progress, hydrated } = useProgress();
  const states = useMemo(
    () => (hydrated ? milestoneStates(progress, milestoneCatalog(progress)) : []),
    [progress, hydrated],
  );
  if (!hydrated) return null;
  const earned = states.filter((s) => s.earned).length;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Your journey
        </h2>
        <span className="text-xs font-medium text-ink-soft">
          {earned} of {states.length}
        </span>
      </div>
      <Link
        href="/journey"
        className="flex gap-3 overflow-x-auto rounded-2xl border border-line bg-surface p-3 transition-colors hover:bg-surface-2"
      >
        {states.map(({ milestone, earned: won }) => (
          <div
            key={milestone.id}
            className={`flex w-24 shrink-0 flex-col items-center gap-1 rounded-xl border p-3 text-center ${
              won ? "border-marigold/50 bg-marigold/10" : "border-line bg-surface-2"
            }`}
          >
            <span className={`text-2xl ${won ? "" : "opacity-40 grayscale"}`} aria-hidden="true">
              {milestone.emoji}
            </span>
            <span
              className={`text-[11px] font-semibold leading-tight ${won ? "text-ink" : "text-ink-soft"}`}
            >
              {milestone.title}
            </span>
          </div>
        ))}
      </Link>
    </section>
  );
}
