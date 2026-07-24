"use client";

// Review tab — the growing deck. Every word the learner has ever practiced
// lives here as an SRS card; this page frames that collection and launches a
// ReviewSession pulling from what's due (and, once caught up, the whole deck).

import { useMemo, useState } from "react";
import Link from "next/link";
import { ITEMS } from "@/lib/content/units";
import { FREQUENCY_ITEMS, unlockedFrequency } from "@/lib/content/frequency";
import type { LexItem } from "@/lib/core/types";
import { useProgress } from "@/lib/client/useProgress";
import { dueItemIds, itemStatus } from "@/lib/core/progress";
import ReviewSession from "@/components/ReviewSession";

export default function ReviewPage() {
  const { progress, hydrated } = useProgress();
  const [reviewing, setReviewing] = useState(false);

  // The deck = every themed word you've practiced, plus the frequency-bank
  // "core words" unlocked so far. Unlocked core words with no card yet are
  // simply new: they get an SRS card the first time you review them.
  const deck = useMemo(() => {
    if (!hydrated) return [] as LexItem[];
    const carded = ITEMS.filter((item) => Boolean(progress.cards[item.id]));
    const byId = new Map<string, LexItem>();
    for (const item of [...carded, ...unlockedFrequency(progress)]) byId.set(item.id, item);
    return [...byId.values()];
  }, [progress, hydrated]);

  const freqUnlockedCount = useMemo(
    () => (hydrated ? unlockedFrequency(progress).length : 0),
    [progress, hydrated],
  );
  const known = useMemo(
    () => deck.filter((item) => itemStatus(progress, item.id) === "known").length,
    [deck, progress],
  );
  const learning = useMemo(
    () => deck.filter((item) => itemStatus(progress, item.id) === "learning").length,
    [deck, progress],
  );
  const dueIds = useMemo(
    () => (hydrated ? new Set(dueItemIds(progress)) : new Set<string>()),
    [progress, hydrated],
  );
  const due = useMemo(() => deck.filter((item) => dueIds.has(item.id)), [deck, dueIds]);

  const sessionPool: LexItem[] = useMemo(() => {
    const rest = deck.filter((item) => !dueIds.has(item.id));
    return [...due, ...rest];
  }, [deck, due, dueIds]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="guj animate-pulse text-lg text-ink-soft">કેમ છો...</div>
      </div>
    );
  }

  if (reviewing) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 py-6 pb-24">
        <ReviewSession pool={sessionPool} onExit={() => setReviewing(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-6 pb-24">
      <div className="mb-5 flex items-baseline gap-2">
        <h1 className="guj text-2xl">તમારો સંગ્રહ</h1>
        <span className="text-sm font-semibold text-ink-soft">Your deck</span>
      </div>

      {deck.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-6 text-center shadow-[var(--shadow)]">
          <div className="text-4xl" aria-hidden="true">
            🌱
          </div>
          <p className="text-sm text-ink-soft">
            Your deck is empty — finish a lesson to start collecting words 🌱
          </p>
          <Link
            href="/"
            className="w-full rounded-full bg-marigold px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
          >
            Start learning
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-peacock/40 bg-peacock/10 p-4">
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl font-semibold text-good">{known}</div>
                <div className="text-xs text-ink-soft">Known</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-marigold">{learning}</div>
                <div className="text-xs text-ink-soft">Learning</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-peacock">{due.length}</div>
                <div className="text-xs text-ink-soft">Due today</div>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-peacock transition-[width]"
                style={{ width: `${deck.length ? (known / deck.length) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-ink-soft">
              {freqUnlockedCount > 0 ? (
                <span>
                  🔑 {freqUnlockedCount}/{FREQUENCY_ITEMS.length} core words unlocked
                </span>
              ) : (
                <span />
              )}
              <span>
                {known} of {deck.length} words mastered
              </span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setReviewing(true)}
              className="w-full rounded-full bg-peacock px-6 py-3.5 text-base font-semibold text-on-accent active:scale-[.99]"
            >
              Review {sessionPool.length} word{sessionPool.length === 1 ? "" : "s"} →
            </button>
            {due.length === 0 && (
              <p className="mt-2 text-center text-xs text-ink-soft">
                You&apos;re all caught up — a quick refresh keeps them sharp.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
