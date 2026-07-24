// ─────────────────────────────────────────────────────────────────────────
// Kind gamification — XP, levels, and a *gentle* streak with built-in grace.
//
// Design stance (see docs/PLAN.md §6): habits without anxiety. A missed day is
// forgiven once per cycle instead of shaming the learner and nuking progress.
// Pure functions only; no storage, no DOM.
// ─────────────────────────────────────────────────────────────────────────

export interface Streak {
  count: number;
  /** Local day key (YYYY-MM-DD) of the last active day, or null if never. */
  lastActiveDay: string | null;
  /** Whether the one free "grace" forgiveness has been used this cycle. */
  graceUsed: boolean;
}

export const XP = {
  exercise: 5,
  lessonComplete: 20,
  scenarioComplete: 40,
  aksharMastered: 10,
  letterWritten: 8, // formed a letter by hand, cleanly
  wordWritten: 14, // wrote a whole word by hand — letters, matras, spacing
  wordTyped: 10, // typed a whole word into Gujarati script
  grammarConcept: 25, // a grammar concept mastered end-to-end
  perfectLesson: 10, // bonus
} as const;

/** Local day key, e.g. "2026-07-23". */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function daysBetween(aKey: string, bKey: string): number {
  const a = new Date(aKey + "T00:00:00");
  const b = new Date(bKey + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export interface StreakUpdate {
  streak: Streak;
  /** True if this activity advanced the streak (for celebratory UI). */
  advanced: boolean;
  /** True if the gap was forgiven by grace this time. */
  forgiven: boolean;
}

/**
 * Register activity for "now" and return the updated streak.
 * Rules (kind):
 *  - same day again        → no change
 *  - consecutive day       → +1, grace refreshed
 *  - missed exactly one day → forgiven once: +1 and grace consumed
 *  - longer gap / grace gone → reset to 1
 */
export function registerActivity(streak: Streak, now: Date = new Date()): StreakUpdate {
  const today = dayKey(now);

  if (streak.lastActiveDay === null) {
    return { streak: { count: 1, lastActiveDay: today, graceUsed: false }, advanced: true, forgiven: false };
  }
  if (streak.lastActiveDay === today) {
    return { streak, advanced: false, forgiven: false };
  }

  const gap = daysBetween(streak.lastActiveDay, today);

  if (gap === 1) {
    return {
      streak: { count: streak.count + 1, lastActiveDay: today, graceUsed: false },
      advanced: true,
      forgiven: false,
    };
  }

  if (gap === 2 && !streak.graceUsed) {
    // Missed a single day — forgive it, keep the momentum.
    return {
      streak: { count: streak.count + 1, lastActiveDay: today, graceUsed: true },
      advanced: true,
      forgiven: true,
    };
  }

  // Longer break — a fresh, guilt-free start.
  return { streak: { count: 1, lastActiveDay: today, graceUsed: false }, advanced: true, forgiven: false };
}

/** Whether the streak is still "alive" as of now (for display only). */
export function streakAlive(streak: Streak, now: Date = new Date()): boolean {
  if (!streak.lastActiveDay) return false;
  const gap = daysBetween(streak.lastActiveDay, dayKey(now));
  return gap === 0 || gap === 1 || (gap === 2 && !streak.graceUsed);
}

// ── Levels (mastery framing — the headline is progress, not a raw number) ───

/** XP needed to *reach* a given level (1-indexed). Gentle quadratic curve. */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level; // L1:0, L2:100, L3:300, L4:600 ...
}

export interface LevelInfo {
  level: number;
  intoLevel: number; // xp earned into current level
  span: number; // xp span of current level
  pct: number; // 0..1 progress through current level
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  const span = xpForLevel(level + 1) - base;
  const intoLevel = xp - base;
  return { level, intoLevel, span, pct: span === 0 ? 0 : intoLevel / span };
}
