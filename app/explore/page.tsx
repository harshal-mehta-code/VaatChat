"use client";

import Link from "next/link";
import { useProgress } from "@/lib/client/useProgress";
import { REWARDS } from "@/lib/content";

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

      {/* Rewards — the culture, collected. Quiet, non-interactive shelf. */}
      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Rewards
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {REWARDS.map((reward) => {
            const unlocked = hydrated && progress.xp >= reward.xpNeeded;
            return (
              <div
                key={reward.id}
                className={`flex w-24 shrink-0 flex-col items-center gap-1 rounded-2xl border p-3 text-center ${
                  unlocked ? "border-marigold/50 bg-marigold/10" : "border-line bg-surface-2"
                }`}
              >
                <span className={`text-2xl ${unlocked ? "" : "opacity-40 grayscale"}`} aria-hidden="true">
                  {reward.emoji}
                </span>
                <span
                  className={`text-[11px] font-semibold leading-tight ${
                    unlocked ? "text-ink" : "text-ink-soft"
                  }`}
                >
                  {reward.title}
                </span>
                <span className="text-[10px] leading-tight text-ink-soft">
                  {unlocked ? "Unlocked" : `${reward.xpNeeded} XP`}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
