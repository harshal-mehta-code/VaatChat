"use client";

import { useState } from "react";
import type { Akshar } from "@/lib/core/types";
import AudioButton from "./AudioButton";

interface AksharCardProps {
  akshar: Akshar;
  known: boolean;
  onMarkKnown: () => void;
}

export default function AksharCard({ akshar, known, onMarkKnown }: AksharCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={`rounded-2xl border p-4 text-center shadow-[var(--shadow)] transition-colors ${
        known ? "border-good bg-good/10" : "border-line bg-surface"
      }`}
    >
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        aria-expanded={revealed}
        className="w-full"
      >
        <div className="guj text-5xl font-medium text-ink">{akshar.char}</div>
        <div className="mt-1 text-sm font-medium text-ink-soft">{akshar.roman}</div>
        <div className="text-xs text-ink-soft">{akshar.sound}</div>
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

      <div className="mt-3 flex items-center justify-center gap-2">
        <AudioButton src={akshar.audio} gujarati={akshar.char} size="sm" />
        <button
          type="button"
          onClick={onMarkKnown}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            known
              ? "border-good bg-good/10 text-good"
              : "border-line text-ink-soft hover:bg-surface-2"
          }`}
        >
          {known ? "✓ Known" : "I know this"}
        </button>
      </div>
    </div>
  );
}
