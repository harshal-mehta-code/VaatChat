"use client";

import Link from "next/link";
import { useProgress } from "@/lib/client/useProgress";
import { getLevel, dueItemIds } from "@/lib/core/progress";
import { UNITS, REWARDS } from "@/lib/content";
import type { Lesson } from "@/lib/core/types";
import Onboarding from "@/components/Onboarding";
import TopBar from "@/components/TopBar";
import LevelBar from "@/components/LevelBar";
import { ACCENT_BG, ACCENT_TEXT, ACCENT_SOFT_BG } from "@/components/accent";

const ORDERED_UNITS = [...UNITS].sort((a, b) => a.order - b.order);

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{children}</h2>
  );
}

export default function Home() {
  const { progress, hydrated, finishOnboarding } = useProgress();

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="guj animate-pulse text-lg text-ink-soft">કેમ છો...</div>
      </div>
    );
  }

  if (!progress.onboarded) {
    return <Onboarding onFinish={finishOnboarding} />;
  }

  const level = getLevel(progress);
  const dueCount = dueItemIds(progress).length;

  // The single next action: first not-yet-completed lesson across the path.
  const allLessons: Lesson[] = ORDERED_UNITS.flatMap((u) => u.lessons);
  const nextLesson = allLessons.find((l) => !progress.completedLessons.includes(l.id));
  const finishedAll = !nextLesson;

  const ctaHref = nextLesson ? `/lesson/${nextLesson.id}` : "/akshar";
  const ctaKicker = finishedAll ? "You've finished the path — keep it sharp" : "Continue learning";
  const ctaLabel = finishedAll ? "Practice the script" : nextLesson!.title;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-7 px-4 py-6 pb-16">
      <TopBar progress={progress} />

      {/* ── HERO: goal, level, and the one clear primary action ── */}
      <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow)]">
        <div className="bg-marigold/10 px-5 pb-5 pt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-marigold">
            Your goal
          </div>
          <p className="mt-0.5 font-serif text-xl font-semibold text-ink">
            {progress.goal ?? "Learn Gujarati"}
          </p>
          <div className="mt-4">
            <LevelBar level={level} />
          </div>
        </div>

        <div className="p-3">
          <Link
            href={ctaHref}
            className="flex items-center justify-between gap-3 rounded-2xl bg-marigold px-5 py-4 text-on-accent shadow-[var(--shadow)] transition-transform active:scale-[.99]"
          >
            <span className="flex flex-col text-left">
              <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                {ctaKicker}
              </span>
              <span className="text-lg font-semibold">{ctaLabel}</span>
            </span>
            <span className="text-2xl" aria-hidden="true">
              {finishedAll ? "✨" : "▶"}
            </span>
          </Link>
          {dueCount > 0 && (
            <p className="px-2 pt-2 text-center text-xs text-ink-soft">
              🔁 {dueCount} word{dueCount === 1 ? "" : "s"} ready for review — revisit a lesson to refresh them.
            </p>
          )}
        </div>
      </section>

      {/* ── PATH: units with clearly-tappable lesson rows ── */}
      <section className="flex flex-col gap-3">
        <Eyebrow>Your path</Eyebrow>
        {ORDERED_UNITS.map((unit) => (
          <div key={unit.id} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
            <div className={`flex items-center gap-3 px-4 py-3 ${ACCENT_SOFT_BG[unit.accent]}`}>
              <div>
                <div className={`guj text-base font-semibold ${ACCENT_TEXT[unit.accent]}`}>
                  {unit.gujaratiTitle}
                </div>
                <div className="text-sm font-semibold text-ink">{unit.title}</div>
              </div>
            </div>
            <ul>
              {unit.lessons.map((lesson, i) => {
                const done = progress.completedLessons.includes(lesson.id);
                const isNext = nextLesson?.id === lesson.id;
                return (
                  <li key={lesson.id} className="border-t border-line first:border-t-0">
                    <Link
                      href={`/lesson/${lesson.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 active:bg-surface-2"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          done
                            ? `${ACCENT_BG[unit.accent]} text-on-accent`
                            : isNext
                              ? `border-2 ${ACCENT_TEXT[unit.accent]} border-current`
                              : "border border-line text-ink-soft"
                        }`}
                        aria-hidden="true"
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-ink">{lesson.title}</span>
                        <span className="text-xs text-ink-soft">
                          {done ? "Completed · tap to review" : isNext ? "Up next" : "Not started"}
                        </span>
                      </span>
                      <span className="text-ink-soft" aria-hidden="true">
                        ›
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {/* ── PRACTICE & PLAY: distinct navigation tiles ── */}
      <section className="flex flex-col gap-3">
        <Eyebrow>Practice &amp; play</Eyebrow>
        <div className="grid grid-cols-1 gap-3">
          <Link
            href="/akshar"
            className="flex items-center gap-4 rounded-2xl border border-peacock/40 bg-peacock/10 p-4 transition-colors hover:bg-peacock/15 active:scale-[.99]"
          >
            <span className="text-3xl" aria-hidden="true">
              📝
            </span>
            <span className="flex flex-1 flex-col">
              <span className="flex items-baseline gap-2">
                <span className="guj text-base font-semibold text-ink">અક્ષર</span>
                <span className="text-sm font-semibold text-ink">Akshar Lab</span>
              </span>
              <span className="text-xs text-ink-soft">Learn &amp; practice the script</span>
            </span>
            <span className="text-xl text-peacock" aria-hidden="true">
              ›
            </span>
          </Link>
          <Link
            href="/vyakaran"
            className="flex items-center gap-4 rounded-2xl border border-marigold/40 bg-marigold/10 p-4 transition-colors hover:bg-marigold/15 active:scale-[.99]"
          >
            <span className="text-3xl" aria-hidden="true">
              🧩
            </span>
            <span className="flex flex-1 flex-col">
              <span className="flex items-baseline gap-2">
                <span className="guj text-base font-semibold text-ink">વ્યાકરણ</span>
                <span className="text-sm font-semibold text-ink">Vyakaran</span>
              </span>
              <span className="text-xs text-ink-soft">Learn the grammar properly</span>
            </span>
            <span className="text-xl text-marigold" aria-hidden="true">
              ›
            </span>
          </Link>
          <Link
            href="/vaat"
            className="flex items-center gap-4 rounded-2xl border border-magenta/40 bg-magenta/10 p-4 transition-colors hover:bg-magenta/15 active:scale-[.99]"
          >
            <span className="text-3xl" aria-hidden="true">
              💬
            </span>
            <span className="flex flex-1 flex-col">
              <span className="flex items-baseline gap-2">
                <span className="guj text-base font-semibold text-ink">વાત</span>
                <span className="text-sm font-semibold text-ink">Vaat Mode</span>
              </span>
              <span className="text-xs text-ink-soft">Have a real conversation</span>
            </span>
            <span className="text-xl text-magenta" aria-hidden="true">
              ›
            </span>
          </Link>
        </div>
      </section>

      {/* ── REWARDS: quiet, clearly non-interactive shelf ── */}
      <section className="flex flex-col gap-3">
        <Eyebrow>Rewards</Eyebrow>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {REWARDS.map((reward) => {
            const unlocked = progress.xp >= reward.xpNeeded;
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
                <span className={`text-[11px] font-semibold leading-tight ${unlocked ? "text-ink" : "text-ink-soft"}`}>
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
