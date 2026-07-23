"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { VOWELS, CONSONANTS } from "@/lib/content";
import { useProgress } from "@/lib/client/useProgress";
import { itemStatus } from "@/lib/core/progress";
import AksharCard from "@/components/AksharCard";
import BarakshariGrid from "@/components/BarakshariGrid";
import AksharPractice from "@/components/AksharPractice";

type Tab = "vowels" | "consonants" | "barakshari";

const ALL_LETTERS = [...VOWELS, ...CONSONANTS];

export default function AksharLabPage() {
  const { progress, hydrated } = useProgress();
  const [tab, setTab] = useState<Tab>("vowels");
  const [practicing, setPracticing] = useState(false);

  const knownCount = useMemo(
    () => (hydrated ? ALL_LETTERS.filter((a) => itemStatus(progress, a.id) === "known").length : 0),
    [progress, hydrated],
  );

  if (practicing) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 py-6">
        <AksharPractice pool={ALL_LETTERS} onExit={() => setPracticing(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6 pb-16">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back home" className="text-ink-soft">
          <span aria-hidden="true">←</span>
        </Link>
        <h1 className="guj text-2xl">અક્ષર Lab</h1>
      </div>

      {/* Practice CTA + mastery summary */}
      <div className="rounded-2xl border border-peacock/40 bg-peacock/10 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink">
            {knownCount} of {ALL_LETTERS.length} letters known
          </span>
          <span className="text-xs text-ink-soft">practice to master</span>
        </div>
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-peacock transition-[width]"
            style={{ width: `${(knownCount / ALL_LETTERS.length) * 100}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => setPracticing(true)}
          className="w-full rounded-full bg-peacock px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
        >
          Practice letters →
        </button>
      </div>

      <p className="text-sm text-ink-soft">
        Browse the script below — tap any letter for its shape→sound hint — then hit{" "}
        <span className="font-medium text-ink">Practice</span> to lock it into memory.
      </p>

      <div className="flex gap-2 rounded-full border border-line bg-surface-2 p-1">
        {(
          [
            ["vowels", "Vowels"],
            ["consonants", "Consonants"],
            ["barakshari", "Barakshari"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              tab === id ? "bg-peacock text-on-accent" : "text-ink-soft hover:bg-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "vowels" && (
        <div className="grid grid-cols-2 gap-3">
          {VOWELS.map((v) => (
            <AksharCard key={v.id} akshar={v} status={hydrated ? itemStatus(progress, v.id) : "new"} />
          ))}
        </div>
      )}

      {tab === "consonants" && (
        <div className="grid grid-cols-2 gap-3">
          {CONSONANTS.map((c) => (
            <AksharCard key={c.id} akshar={c} status={hydrated ? itemStatus(progress, c.id) : "new"} />
          ))}
        </div>
      )}

      {tab === "barakshari" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-soft">
            Tap any cell to hear it. Scroll sideways to see every vowel form.
          </p>
          <BarakshariGrid />
        </div>
      )}
    </div>
  );
}
