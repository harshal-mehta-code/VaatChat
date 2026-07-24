// A completion-screen "did you know?" — the delightful payoff that also sneaks
// in one more thing to learn. Presentational only.

import type { FunFact } from "@/lib/core/types";

export default function FunFactCard({ fact }: { fact: FunFact }) {
  return (
    <div className="w-full rounded-2xl border border-peacock/30 bg-peacock/5 p-4 text-left">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-peacock">
        <span aria-hidden="true">{fact.emoji}</span> Did you know?
      </div>
      <p className="text-sm leading-relaxed text-ink">{fact.text}</p>
      {fact.learn && (
        <p className="mt-2 border-t border-line pt-2 text-xs leading-relaxed text-ink-soft">
          <span className="font-semibold text-ink">Bonus:</span> {fact.learn}
        </p>
      )}
    </div>
  );
}
