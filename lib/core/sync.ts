// ─────────────────────────────────────────────────────────────────────────
// Merging one learner's progress across devices.
//
// The naive version of cloud sync — "upload the blob, last write wins" — throws
// away a whole session the first time someone reviews on their phone at lunch
// and their iPad at night. For an app built on spaced repetition, silently
// losing reviews isn't a rough edge; it corrupts the thing the app is for.
//
// So merging is a real operation with real rules, and every field uses one that
// is commutative, associative and idempotent (a max, a union, or a
// latest-timestamp-wins register). That buys three properties worth having:
//
//   • order doesn't matter    — merge(a, b) == merge(b, a)
//   • re-syncing is harmless  — merge(a, a) == a
//   • three devices are fine  — merge(merge(a, b), c) == merge(a, merge(b, c))
//
// Which in turn means the client can stay offline-first: each device is
// authoritative for the reviews it recorded, the server is only a meeting point,
// and a flaky connection can retry as often as it likes without inflating
// anyone's XP.
//
// Pure — no I/O, no DOM, no provider. The iOS client reuses this verbatim.
// ─────────────────────────────────────────────────────────────────────────

import type { CardState } from "./srs";
import type { Progress } from "./progress";
import type { Streak } from "./gamification";

/** Milliseconds for an ISO date, or -Infinity when absent/unparseable. */
function at(iso: string | undefined): number {
  if (!iso) return -Infinity;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? -Infinity : t;
}

/**
 * Latest-write-wins for a scalar, with a deterministic tie-break so the result
 * doesn't depend on argument order. The tie-break (lexicographically greater
 * wins) is arbitrary — but two devices writing different values in the same
 * millisecond is already a coin toss, and a stable coin is worth more than a
 * meaningful one.
 */
function pickLatest<T>(
  aVal: T | undefined,
  bVal: T | undefined,
  aTime: number,
  bTime: number,
): T | undefined {
  if (aVal === undefined) return bVal;
  if (bVal === undefined) return aVal;
  if (aTime > bTime) return aVal;
  if (bTime > aTime) return bVal;
  return String(aVal) >= String(bVal) ? aVal : bVal;
}

/** Set union that keeps first-seen order — stable regardless of merge order. */
function union(a: string[], b: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of [...a, ...b].sort()) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * Which of two states for the same card is the real one.
 *
 * The freshest *review* wins, because that's the one whose schedule reflects the
 * most recent evidence about this learner's memory. A card that's been reviewed
 * always beats one that was merely created; if neither has been reviewed, more
 * repetitions wins.
 */
function mergeCard(a: CardState, b: CardState): CardState {
  const ta = at(a.last_review);
  const tb = at(b.last_review);
  if (ta !== tb) return ta > tb ? a : b;
  if (a.reps !== b.reps) return a.reps > b.reps ? a : b;
  // Identical evidence: take the more conservative schedule, so a merge can
  // never accidentally push a review further out than either device intended.
  return at(a.due) <= at(b.due) ? a : b;
}

function mergeCards(
  a: Record<string, CardState>,
  b: Record<string, CardState>,
): Record<string, CardState> {
  const out: Record<string, CardState> = {};
  for (const id of union(Object.keys(a), Object.keys(b))) {
    const ca = a[id];
    const cb = b[id];
    out[id] = ca && cb ? mergeCard(ca, cb) : (ca ?? cb);
  }
  return out;
}

/**
 * Streaks merge on the *day*, not the clock: whichever device recorded activity
 * on the later day carries the streak, and the count takes the higher of the
 * two — practising on two devices should never cost you a day.
 */
function mergeStreak(a: Streak, b: Streak): Streak {
  const later = (a.lastActiveDay ?? "") >= (b.lastActiveDay ?? "") ? a : b;
  return {
    lastActiveDay: later.lastActiveDay,
    count: Math.max(a.count, b.count),
    // Grace is a per-cycle allowance; if either device spent it, it's spent.
    // Anything kinder would hand out one free forgiveness per device.
    graceUsed: a.graceUsed || b.graceUsed,
  };
}

/**
 * Combine two versions of one learner's progress.
 *
 * XP takes the max rather than the sum. Summing looks fairer — two devices, two
 * sessions — but without a per-sync watermark it double-counts on every
 * subsequent merge, so a learner who syncs ten times gets ten times the XP. Max
 * is idempotent, and quietly under-crediting a rare concurrent session is a much
 * smaller sin than inflating a number the whole reward system reads from.
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const ta = at(a.updatedAt);
  const tb = at(b.updatedAt);

  return {
    version: 1,
    // The account began when the first device began.
    createdAt: at(a.createdAt) <= at(b.createdAt) ? a.createdAt : b.createdAt,
    updatedAt: ta >= tb ? a.updatedAt : b.updatedAt,

    goal: pickLatest(a.goal, b.goal, ta, tb),
    motivation: pickLatest(a.motivation, b.motivation, ta, tb),
    wantsGrammar: Boolean(a.wantsGrammar || b.wantsGrammar),
    onboarded: a.onboarded || b.onboarded,

    xp: Math.max(a.xp, b.xp),
    streak: mergeStreak(a.streak, b.streak),
    cards: mergeCards(a.cards, b.cards),

    completedLessons: union(a.completedLessons, b.completedLessons),
    completedScenarios: union(a.completedScenarios, b.completedScenarios),
    aksharMastered: union(a.aksharMastered, b.aksharMastered),
    completedGrammar: union(a.completedGrammar, b.completedGrammar),
  };
}

/**
 * Whether a merged result differs from what a device already had — i.e. whether
 * this device needs to write anything back. Cheap structural compare; the shape
 * is small and fully serializable by design.
 */
export function progressDiffers(a: Progress, b: Progress): boolean {
  return JSON.stringify(normalize(a)) !== JSON.stringify(normalize(b));
}

/** Key-sorted copy, so comparison isn't fooled by property order. */
function normalize(p: Progress): unknown {
  return JSON.parse(
    JSON.stringify(p, (_k, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).sort(([x], [y]) => x.localeCompare(y)))
        : v,
    ),
  );
}
