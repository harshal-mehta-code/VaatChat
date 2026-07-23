"use client";

import Link from "next/link";
import { useProgress } from "@/lib/client/useProgress";
import { getLevel, dueItemIds } from "@/lib/core/progress";
import { UNITS, REWARDS } from "@/lib/content";
import Onboarding from "@/components/Onboarding";
import TopBar from "@/components/TopBar";
import LevelBar from "@/components/LevelBar";
import { ACCENT_BG, ACCENT_TEXT, ACCENT_BORDER } from "@/components/accent";

export default function Home() {
  const { progress, hydrated, finishOnboarding } = useProgress();

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="guj text-lg text-ink-soft">કેમ છો...</div>
      </div>
    );
  }

  if (!progress.onboarded) {
    return <Onboarding onFinish={finishOnboarding} />;
  }

  const level = getLevel(progress);
  const due = dueItemIds(progress);

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6 pb-16">
      <TopBar progress={progress} />

      {/* Goal + level */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-soft">
          Your goal
        </div>
        <div className="mb-4 text-lg font-serif font-semibold text-ink">
          {progress.goal ?? "Learn Gujarati"}
        </div>
        <LevelBar level={level} />
      </div>

      {/* Due reviews callout */}
      {due.length > 0 && (
        <a
          href="#units"
          className="flex items-center justify-between gap-3 rounded-2xl border border-peacock bg-peacock/10 p-4 transition-colors hover:bg-peacock/15"
        >
          <div>
            <div className="text-sm font-semibold text-ink">
              Continue — {due.length} review{due.length === 1 ? "" : "s"} due
            </div>
            <div className="text-xs text-ink-soft">
              A quick lesson will refresh them. Keep your memory warm!
            </div>
          </div>
          <span className="text-2xl" aria-hidden="true">
            🔁
          </span>
        </a>
      )}

      {/* Units */}
      <div id="units" className="flex flex-col gap-4">
        {UNITS.slice()
          .sort((a, b) => a.order - b.order)
          .map((unit) => (
            <div
              key={unit.id}
              className={`rounded-2xl border bg-surface p-4 shadow-[var(--shadow)] ${ACCENT_BORDER[unit.accent]}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className={`guj text-lg font-semibold ${ACCENT_TEXT[unit.accent]}`}>
                  {unit.gujaratiTitle}
                </span>
              </div>
              <h3 className="mb-0.5 text-lg font-semibold text-ink">{unit.title}</h3>
              <p className="mb-3 text-sm text-ink-soft">{unit.blurb}</p>
              <div className="flex flex-wrap gap-2">
                {unit.lessons.map((lesson) => {
                  const done = progress.completedLessons.includes(lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      href={`/lesson/${lesson.id}`}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                        done
                          ? `${ACCENT_BG[unit.accent]} border-transparent text-on-accent`
                          : "border-line bg-surface-2 text-ink hover:opacity-80"
                      }`}
                    >
                      {done && <span aria-hidden="true">✓</span>}
                      {lesson.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Akshar Lab + Vaat Mode entries */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/akshar"
          className="flex flex-col items-start gap-1 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)] hover:bg-surface-2"
        >
          <span className="text-2xl" aria-hidden="true">
            📝
          </span>
          <span className="guj text-base font-semibold text-ink">અક્ષર</span>
          <span className="text-xs text-ink-soft">Learn the script</span>
        </Link>
        <Link
          href="/vaat"
          className="flex flex-col items-start gap-1 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)] hover:bg-surface-2"
        >
          <span className="text-2xl" aria-hidden="true">
            💬
          </span>
          <span className="guj text-base font-semibold text-ink">વાત</span>
          <span className="text-xs text-ink-soft">Have a conversation</span>
        </Link>
      </div>

      {/* Rewards shelf */}
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Rewards
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {REWARDS.map((reward) => {
            const unlocked = progress.xp >= reward.xpNeeded;
            return (
              <div
                key={reward.id}
                className={`flex w-24 shrink-0 flex-col items-center gap-1 rounded-2xl border p-3 text-center ${
                  unlocked
                    ? "border-marigold bg-marigold/10"
                    : "border-line bg-surface-2 opacity-60"
                }`}
              >
                <span className={`text-2xl ${unlocked ? "" : "grayscale"}`} aria-hidden="true">
                  {reward.emoji}
                </span>
                <span className="text-[11px] font-semibold leading-tight text-ink">
                  {reward.title}
                </span>
                {!unlocked && (
                  <span className="text-[10px] leading-tight text-ink-soft">
                    {reward.xpNeeded} XP
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
