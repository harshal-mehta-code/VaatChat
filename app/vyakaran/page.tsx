"use client";

import { useMemo } from "react";
import Link from "next/link";
import { GRAMMAR_MODULES } from "@/lib/content";
import { useProgress } from "@/lib/client/useProgress";
import { itemStatus, grammarCardId, type ItemStatus } from "@/lib/core/progress";

const ORDERED = [...GRAMMAR_MODULES].sort((a, b) => a.order - b.order);
const ALL_CONCEPTS = ORDERED.flatMap((m) => m.concepts);

const STATUS_STYLE: Record<ItemStatus, string> = {
  new: "border-line bg-surface-2 text-ink-soft",
  learning: "border-marigold/40 bg-marigold/10 text-marigold",
  known: "border-good/40 bg-good/10 text-good",
};
const STATUS_LABEL: Record<ItemStatus, string> = {
  new: "New",
  learning: "Learning",
  known: "Known",
};

export default function VyakaranPage() {
  const { progress, hydrated } = useProgress();

  const knownCount = useMemo(
    () =>
      hydrated
        ? ALL_CONCEPTS.filter((c) => itemStatus(progress, grammarCardId(c.id)) === "known").length
        : 0,
    [progress, hydrated],
  );

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6 pb-16">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back home" className="text-ink-soft">
          <span aria-hidden="true">←</span>
        </Link>
        <h1 className="guj text-2xl">વ્યાકરણ</h1>
        <span className="text-sm font-semibold text-ink-soft">Grammar</span>
      </div>

      {/* Mastery summary */}
      <div className="rounded-2xl border border-peacock/40 bg-peacock/10 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink">
            {knownCount} of {ALL_CONCEPTS.length} concepts known
          </span>
          <span className="text-xs text-ink-soft">learn it properly</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-peacock transition-[width]"
            style={{ width: `${(knownCount / ALL_CONCEPTS.length) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-ink-soft">
        Short concepts that show you <span className="font-medium text-ink">how</span> Gujarati fits
        together. Discover the pattern, then practice it — each one comes back for review to stick.
      </p>

      {ORDERED.map((mod) => (
        <section key={mod.id} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2 px-1">
            <span className="guj text-base font-semibold text-peacock">{mod.gujaratiTitle}</span>
            <h2 className="text-sm font-semibold text-ink">{mod.title}</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
            <ul>
              {mod.concepts.map((concept, i) => {
                const status = hydrated ? itemStatus(progress, grammarCardId(concept.id)) : "new";
                return (
                  <li key={concept.id} className="border-t border-line first:border-t-0">
                    <Link
                      href={`/vyakaran/${concept.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 active:bg-surface-2"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink-soft">
                        {i + 1}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-ink">{concept.title}</span>
                        <span className="truncate text-xs text-ink-soft">{concept.blurb}</span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}
