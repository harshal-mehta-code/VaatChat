"use client";

// The script, to look at.
//
// Split out of Akshar Lab on purpose. The lab is where you *do* things — one
// recommended drill, front and centre. This is the reference: 44 letters and a
// 320-cell grid, which on the same page as three call-to-action buttons made
// both jobs worse.

import { useState } from "react";
import Link from "next/link";
import { VOWELS, CONSONANTS } from "@/lib/content";
import { useProgress } from "@/lib/client/useProgress";
import { itemStatus } from "@/lib/core/progress";
import AksharCard from "@/components/AksharCard";
import BarakshariGrid from "@/components/BarakshariGrid";

type Tab = "vowels" | "consonants" | "barakshari";

export default function AksharChartPage() {
  const { progress, hydrated } = useProgress();
  const [tab, setTab] = useState<Tab>("vowels");

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-4 py-6 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/akshar" aria-label="Back to Akshar Lab" className="text-ink-soft">
          <span aria-hidden="true">←</span>
        </Link>
        <h1 className="text-2xl">Browse the script</h1>
      </div>

      <p className="text-sm text-ink-soft">
        Tap any letter for its shape→sound hint. Nothing here is a test — it&apos;s the map.
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

      {tab === "barakshari" && <BarakshariGrid />}
    </div>
  );
}
