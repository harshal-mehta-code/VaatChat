// ─────────────────────────────────────────────────────────────────────────
// Learner progress — the single source of truth for what someone has learned.
//
// MVP persistence is localStorage (no accounts, zero friction). The shape is
// deliberately serializable and portable so a future backend / iOS store can
// adopt it verbatim. All mutators are pure-ish: they take progress + input and
// return new progress; the storage adapter at the bottom handles I/O.
// ─────────────────────────────────────────────────────────────────────────

import type { CardState } from "./srs";
import { newCard, reviewCard, isDue, type Grade3 } from "./srs";
import {
  type Streak,
  registerActivity,
  XP,
  levelFromXp,
  type LevelInfo,
} from "./gamification";

export interface Progress {
  version: 1;
  createdAt: string;
  /** The learner's personal "why", e.g. "Hold a 2-min chat with Ba". */
  goal?: string;
  /** Chosen motivation bucket from onboarding. */
  motivation?: string;
  /** Depth signal from onboarding: wants the formal, grammar-first path
   *  surfaced (orthogonal to motivation — you can want both). */
  wantsGrammar?: boolean;
  /** Whether onboarding is complete. */
  onboarded: boolean;
  xp: number;
  streak: Streak;
  /** itemId → SRS card state. */
  cards: Record<string, CardState>;
  completedLessons: string[];
  completedScenarios: string[];
  /** Akshar ids the learner can recognize. */
  aksharMastered: string[];
  /** Grammar concept ids the learner has worked through at least once. */
  completedGrammar: string[];
}

export function freshProgress(now: Date = new Date()): Progress {
  return {
    version: 1,
    createdAt: now.toISOString(),
    onboarded: false,
    xp: 0,
    streak: { count: 0, lastActiveDay: null, graceUsed: false },
    cards: {},
    completedLessons: [],
    completedScenarios: [],
    aksharMastered: [],
    completedGrammar: [],
  };
}

/** SRS card id for a grammar concept — a grammar pattern is a memory item too. */
export function grammarCardId(conceptId: string): string {
  return `g-${conceptId}`;
}

/**
 * SRS card id for *writing* a letter. Deliberately separate from the letter's
 * own recognition card: reading ક fluently and being able to form it by hand
 * are different memories, and anyone who's learned a script has frozen at the
 * second while breezing through the first. See docs/LEKHAN.md §1.
 */
export function writingCardId(aksharId: string): string {
  return `w-${aksharId}`;
}

// ── Derived selectors ──────────────────────────────────────────────────────

export function getLevel(p: Progress): LevelInfo {
  return levelFromXp(p.xp);
}

export function dueItemIds(p: Progress, now: Date = new Date()): string[] {
  return Object.entries(p.cards)
    .filter(([, c]) => isDue(c, now))
    .map(([id]) => id);
}

export function masteredCount(p: Progress): number {
  // "Mastered" = in Review state with meaningful stability (headline metric).
  return Object.values(p.cards).filter((c) => c.state === 2 && c.stability >= 4).length;
}

export function knownItemIds(p: Progress): string[] {
  return Object.keys(p.cards);
}

export type ItemStatus = "new" | "learning" | "known";

/** Learning status for any SRS-tracked id (vocab item or akshar). Drives the
 *  "New / Learning / Known" chips so mastery reflects real practice, not a
 *  one-way self-report toggle. */
export function itemStatus(p: Progress, id: string): ItemStatus {
  const c = p.cards[id];
  if (!c) return "new";
  if (c.state === 2 && c.stability >= 4) return "known";
  return "learning";
}

// ── Mutators (return NEW progress; never mutate in place) ───────────────────

/** Grade an item's SRS card, creating it on first sight. */
export function gradeItem(
  p: Progress,
  itemId: string,
  grade: Grade3,
  now: Date = new Date(),
): Progress {
  const existing = p.cards[itemId] ?? newCard(now);
  const updated = reviewCard(existing, grade, now);
  return { ...p, cards: { ...p.cards, [itemId]: updated } };
}

/** Award XP and register today's activity toward the streak. */
export function award(p: Progress, xp: number, now: Date = new Date()): Progress {
  const { streak } = registerActivity(p.streak, now);
  return { ...p, xp: p.xp + xp, streak };
}

export function completeLesson(p: Progress, lessonId: string, now: Date = new Date()): Progress {
  const already = p.completedLessons.includes(lessonId);
  let next = award(p, XP.lessonComplete, now);
  if (!already) next = { ...next, completedLessons: [...next.completedLessons, lessonId] };
  return next;
}

export function completeScenario(p: Progress, scenarioId: string, now: Date = new Date()): Progress {
  const already = p.completedScenarios.includes(scenarioId);
  let next = award(p, XP.scenarioComplete, now);
  if (!already) next = { ...next, completedScenarios: [...next.completedScenarios, scenarioId] };
  return next;
}

export function markAksharMastered(p: Progress, aksharId: string, now: Date = new Date()): Progress {
  if (p.aksharMastered.includes(aksharId)) return p;
  const next = award(p, XP.aksharMastered, now);
  return { ...next, aksharMastered: [...next.aksharMastered, aksharId] };
}

/** Mark a grammar concept done for this session: award XP + record completion.
 *  (The concept's SRS card is graded separately via gradeItem(grammarCardId).) */
export function completeGrammar(p: Progress, conceptId: string, now: Date = new Date()): Progress {
  const already = p.completedGrammar.includes(conceptId);
  let next = award(p, XP.grammarConcept, now);
  if (!already) next = { ...next, completedGrammar: [...next.completedGrammar, conceptId] };
  return next;
}

export function setOnboarding(
  p: Progress,
  goal: string,
  motivation: string,
  wantsGrammar = false,
): Progress {
  return { ...p, onboarded: true, goal, motivation, wantsGrammar };
}

// ── Storage adapter (localStorage; SSR-safe) ────────────────────────────────

const KEY = "vaatchat.progress.v1";

export function loadProgress(): Progress {
  if (typeof window === "undefined") return freshProgress();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return freshProgress();
    const parsed = JSON.parse(raw) as Progress;
    if (parsed.version !== 1) return freshProgress();
    // Backfill any fields added since this profile was saved (e.g. grammar),
    // so older localStorage data never crashes a new build.
    return { ...freshProgress(), ...parsed };
  } catch {
    return freshProgress();
  }
}

export function saveProgress(p: Progress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage full / disabled — non-fatal for a prototype */
  }
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
