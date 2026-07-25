"use client";

// One milestone, as a row. Shared by the home card and the journey page so an
// achievement looks the same wherever you meet it.

import type { MilestoneState } from "@/lib/core/milestones";

const PILLAR_TINT: Record<string, string> = {
  path: "text-marigold",
  script: "text-peacock",
  hand: "text-magenta",
  keys: "text-marigold",
  grammar: "text-peacock",
  talk: "text-magenta",
};
const PILLAR_FILL: Record<string, string> = {
  path: "bg-marigold",
  script: "bg-peacock",
  hand: "bg-magenta",
  keys: "bg-marigold",
  grammar: "bg-peacock",
  talk: "bg-magenta",
};

export default function MilestoneRow({ state }: { state: MilestoneState }) {
  const { milestone, have, need, earned, blocked } = state;
  const pct = need > 0 ? Math.min(100, (have / need) * 100) : 0;
  const tint = PILLAR_TINT[milestone.pillar] ?? "text-ink";
  const fill = PILLAR_FILL[milestone.pillar] ?? "bg-ink";

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
        earned ? "border-line bg-surface" : "border-line bg-surface-2"
      }`}
    >
      <span
        className={`mt-0.5 text-2xl ${earned ? "" : "opacity-45 grayscale"}`}
        aria-hidden="true"
      >
        {milestone.emoji}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`text-sm font-semibold ${earned ? "text-ink" : "text-ink-soft"}`}>
            {milestone.title}
          </span>
          {earned ? (
            <span className="shrink-0 text-xs font-medium text-good">Earned</span>
          ) : !blocked ? (
            <span className={`shrink-0 text-xs font-medium tabular-nums ${tint}`}>
              {have}/{need}
            </span>
          ) : null}
        </div>
        <span className="text-xs text-ink-soft">{blocked ?? milestone.requirement}</span>
        {!earned && !blocked && (
          <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div className={`h-full ${fill} transition-[width]`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
