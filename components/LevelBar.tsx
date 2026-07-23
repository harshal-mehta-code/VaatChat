// A simple level progress bar (not a literal ring, but reads as one at a
// glance): level badge + a filled bar showing progress toward the next level.

import type { LevelInfo } from "@/lib/core/gamification";

export default function LevelBar({ level }: { level: LevelInfo }) {
  const pct = Math.round(level.pct * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-marigold text-on-accent font-serif text-lg font-semibold">
        {level.level}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between text-xs text-ink-soft">
          <span>Level {level.level}</span>
          <span>
            {level.intoLevel} / {level.span} XP
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-marigold transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
