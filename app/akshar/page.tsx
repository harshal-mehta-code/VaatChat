"use client";

import { useState } from "react";
import Link from "next/link";
import { VOWELS, CONSONANTS } from "@/lib/content";
import { useProgress } from "@/lib/client/useProgress";
import AksharCard from "@/components/AksharCard";
import BarakshariGrid from "@/components/BarakshariGrid";

type Tab = "vowels" | "consonants" | "barakshari";

export default function AksharLabPage() {
  const { progress, hydrated, markAkshar } = useProgress();
  const [tab, setTab] = useState<Tab>("vowels");

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6 pb-16">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back home" className="text-ink-soft">
          <span aria-hidden="true">←</span>
        </Link>
        <h1 className="guj text-2xl">અક્ષર Lab</h1>
      </div>
      <p className="text-sm text-ink-soft">
        Learn the Gujarati script, shape by shape. Tap a letter to reveal its mnemonic.
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
            <AksharCard
              key={v.id}
              akshar={v}
              known={hydrated && progress.aksharMastered.includes(v.id)}
              onMarkKnown={() => markAkshar(v.id)}
            />
          ))}
        </div>
      )}

      {tab === "consonants" && (
        <div className="grid grid-cols-2 gap-3">
          {CONSONANTS.map((c) => (
            <AksharCard
              key={c.id}
              akshar={c}
              known={hydrated && progress.aksharMastered.includes(c.id)}
              onMarkKnown={() => markAkshar(c.id)}
            />
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
