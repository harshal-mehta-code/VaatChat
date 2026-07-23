"use client";

import { useState } from "react";
import type { Akshar } from "@/lib/core/types";
import type { ItemStatus } from "@/lib/core/progress";
import AudioButton from "./AudioButton";

interface AksharCardProps {
  akshar: Akshar;
  status: ItemStatus;
}

const STATUS_STYLE: Record<ItemStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "text-ink-soft border-line" },
  learning: { label: "Learning", cls: "text-marigold border-marigold/50" },
  known: { label: "Known ✓", cls: "text-good border-good/60" },
};

export default function AksharCard({ akshar, status }: AksharCardProps) {
  const [revealed, setRevealed] = useState(false);
  const s = STATUS_STYLE[status];

  return (
    <div
      className={`flex flex-col rounded-2xl border p-4 text-center shadow-[var(--shadow)] transition-colors ${
        status === "known" ? "border-good/60 bg-good/5" : "border-line bg-surface"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>
          {s.label}
        </span>
        <AudioButton src={akshar.audio} gujarati={akshar.char} size="sm" />
      </div>

      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        aria-expanded={revealed}
        className="w-full"
      >
        <div className="guj text-5xl font-medium text-ink">{akshar.char}</div>
        <div className="mt-1 text-sm font-medium text-ink-soft">{akshar.roman}</div>
        <div className="text-xs text-ink-soft">{akshar.sound}</div>
        <div className="mt-2 text-[11px] text-peacock">{revealed ? "Hide hint" : "Show hint 💡"}</div>
      </button>

      {revealed && (
        <div className="mt-3 border-t border-line pt-3 text-left text-xs text-ink-soft">
          <p>{akshar.mnemonic}</p>
          {akshar.type === "vowel" && akshar.matra && (
            <p className="mt-1">
              matra: <span className="guj text-base text-ink">{akshar.matra}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
