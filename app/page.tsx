"use client";

import Link from "next/link";
import { useProgress } from "@/lib/client/useProgress";
import { getLevel, dueItemIds } from "@/lib/core/progress";
import {
  nextLesson as computeNextLesson,
  nextConcept as computeNextConcept,
  lessonUnlocked,
  unitComplete,
  unitUnlocked,
} from "@/lib/core/progression";
import { offersGrammar } from "@/lib/core/personalize";
import { UNITS, GRAMMAR_MODULES } from "@/lib/content";
import Onboarding from "@/components/Onboarding";
import TopBar from "@/components/TopBar";
import LevelBar from "@/components/LevelBar";
import JourneyCard from "@/components/JourneyCard";
import { ACCENT_BG, ACCENT_TEXT, ACCENT_SOFT_BG } from "@/components/accent";

const ORDERED_UNITS = [...UNITS].sort((a, b) => a.order - b.order);
const ORDERED_MODULES = [...GRAMMAR_MODULES].sort((a, b) => a.order - b.order);

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
  const nextLsn = computeNextLesson(ORDERED_UNITS, progress);
  const finishedAll = !nextLsn;

  // Vyakaran is promoted onto the home screen once someone has met enough
  // Gujarati for "why does that word change shape?" to be a live question —
  // see lib/core/personalize.ts. Until then it waits in Explore.
  const showGrammar = offersGrammar(progress);
  const nextCncpt = showGrammar ? computeNextConcept(ORDERED_MODULES, progress) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-7 px-4 py-6 pb-24">
      <TopBar progress={progress} />

      {/* ── HERO: goal, level, and the one clear next action ── */}
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
            href={finishedAll ? "/review" : `/lesson/${nextLsn!.id}`}
            className="flex items-center justify-between gap-3 rounded-2xl bg-marigold px-5 py-4 text-on-accent shadow-[var(--shadow)] transition-transform active:scale-[.99]"
          >
            <span className="flex flex-col text-left">
              <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                {finishedAll ? "You've finished the path — keep it sharp" : "Continue learning"}
              </span>
              <span className="text-lg font-semibold">
                {finishedAll ? "Review your words" : nextLsn!.title}
              </span>
            </span>
            <span className="text-2xl" aria-hidden="true">
              {finishedAll ? "✨" : "▶"}
            </span>
          </Link>
          {showGrammar && (
            <Link
              href={nextCncpt ? `/vyakaran/${nextCncpt.id}` : "/vyakaran"}
              className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-peacock px-5 py-3.5 text-on-accent transition-transform active:scale-[.99]"
            >
              <span className="flex flex-col text-left">
                <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                  {nextCncpt ? "Understand why · Vyakaran" : "Vyakaran — keep it sharp"}
                </span>
                <span className="text-base font-semibold">
                  {nextCncpt ? nextCncpt.title : "Review your grammar"}
                </span>
              </span>
              <span className="text-xl" aria-hidden="true">
                🧩
              </span>
            </Link>
          )}
          {/* The daily mix. Offered from the second lesson on — before that
              there's nothing to mix, and a session that's four legs of the
              same thing is worse than the lesson it interrupted. */}
          {progress.completedLessons.length >= 1 && (
            <Link
              href="/mix"
              className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-magenta/40 bg-magenta/10 px-5 py-3.5 transition-transform active:scale-[.99]"
            >
              <span className="flex flex-col text-left">
                <span className="text-[11px] font-medium uppercase tracking-wide text-magenta">
                  Five minutes · a bit of everything
                </span>
                <span className="text-base font-semibold text-ink">Today&apos;s mix</span>
              </span>
              <span className="text-xl" aria-hidden="true">
                🎲
              </span>
            </Link>
          )}
          {dueCount > 0 && (
            <Link
              href="/review"
              className="mt-2 block px-2 text-center text-xs text-ink-soft underline-offset-2 hover:underline"
            >
              🔁 {dueCount} word{dueCount === 1 ? "" : "s"} ready for review
            </Link>
          )}
        </div>
      </section>

      <JourneyCard />

      {/* ── PATH: current unit expanded; the rest collapsed (progressive disclosure) ── */}
      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Your path
        </h2>
        {ORDERED_UNITS.map((unit) => {
          const complete = unitComplete(progress, unit);
          const unlocked = unitUnlocked(ORDERED_UNITS, progress, unit.id);
          const isCurrent = unlocked && !complete;

          // Collapsed: a completed unit (done) or a locked future unit.
          if (!isCurrent) {
            return (
              <div
                key={unit.id}
                className={`flex items-center gap-3 rounded-2xl border border-line px-4 py-3 ${
                  complete ? "bg-surface" : "bg-surface-2"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                    complete ? `${ACCENT_BG[unit.accent]} text-on-accent` : "border border-line text-ink-soft"
                  }`}
                  aria-hidden="true"
                >
                  {complete ? "✓" : "🔒"}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-ink">{unit.title}</span>
                  <span className="text-xs text-ink-soft">
                    {complete ? "Complete" : "Unlocks as you progress"}
                  </span>
                </span>
              </div>
            );
          }

          // Expanded: the one active unit.
          return (
            <div
              key={unit.id}
              className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]"
            >
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
                  const isNext = nextLsn?.id === lesson.id;
                  const open = done || lessonUnlocked(ORDERED_UNITS, progress, lesson.id);
                  const rowInner = (
                    <>
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
                        {done ? "✓" : open ? i + 1 : "🔒"}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-ink">{lesson.title}</span>
                        <span className="text-xs text-ink-soft">
                          {done ? "Completed · tap to review" : isNext ? "Up next" : open ? "Ready" : "Locked"}
                        </span>
                      </span>
                      {open && (
                        <span className="text-ink-soft" aria-hidden="true">
                          ›
                        </span>
                      )}
                    </>
                  );
                  return (
                    <li key={lesson.id} className="border-t border-line first:border-t-0">
                      {open ? (
                        <Link
                          href={`/lesson/${lesson.id}`}
                          className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 active:bg-surface-2"
                        >
                          {rowInner}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3.5 opacity-55">{rowInner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
