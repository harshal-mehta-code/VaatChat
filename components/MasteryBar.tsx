"use client";

// A progress bar that shows work in flight, not just work finished.
//
// Mastery here means two correct sightings on separate occasions — a real bar,
// and worth keeping. But a bar that only fills on mastery reads as broken: a
// learner answers twelve questions correctly, finishes the session, and watches
// it sit at zero, because a drill shows each letter once. So "learning" gets its
// own lighter segment ahead of the solid one. Effort shows up straight away;
// "known" still means known.

import type { StatusCounts } from "@/lib/core/progress";

type Accent = "peacock" | "magenta" | "marigold";

const FILL: Record<Accent, string> = {
  peacock: "bg-peacock",
  magenta: "bg-magenta",
  marigold: "bg-marigold",
};
const TEXT: Record<Accent, string> = {
  peacock: "text-peacock",
  magenta: "text-magenta",
  marigold: "text-marigold",
};

export default function MasteryBar({
  counts,
  total,
  accent,
  noun,
}: {
  counts: StatusCounts;
  total: number;
  accent: Accent;
  /** What's being counted, e.g. "letters known". */
  noun: string;
}) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-ink">
          {counts.known} of {total} {noun}
        </span>
        {counts.learning > 0 && (
          <span className={`text-xs font-medium ${TEXT[accent]}`}>
            +{counts.learning} in progress
          </span>
        )}
      </div>
      <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full ${FILL[accent]} transition-[width]`}
          style={{ width: `${pct(counts.known)}%` }}
        />
        {/* Same hue, half-strength: visibly progress, visibly not finished. */}
        <div
          className={`h-full ${FILL[accent]} opacity-40 transition-[width]`}
          style={{ width: `${pct(counts.learning)}%` }}
        />
      </div>
    </>
  );
}
