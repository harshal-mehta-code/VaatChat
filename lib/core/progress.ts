// ─────────────────────────────────────────────────────────────────────────
// Learner progress — the single source of truth for what someone has learned.
//
// MVP persistence is localStorage (no accounts, zero friction). The shape is
// deliberately serializable and portable so a future backend / iOS store can
// adopt it verbatim. All mutators are pure-ish: they take progress + input and
// return new progress; the storage adapter at the bottom handles I/O.
// ─────────────────────────────────────────────────────────────────────────

import type { CardState } from "./srs.ts";
import { newCard, reviewCard, isDue, type Grade3 } from "./srs.ts";
import {
  type Streak,
  registerActivity,
  XP,
  levelFromXp,
  type LevelInfo,
} from "./gamification.ts";

export interface Progress {
  version: 1;
  createdAt: string;
  /** Last local write (ISO). Used to settle scalar fields when merging two
   *  devices — see lib/core/sync.ts. Absent on profiles saved before sync. */
  updatedAt?: string;
  /** The learner's personal "why", e.g. "Hold a 2-min chat with Ba". */
  goal?: string;
  /** Chosen motivation bucket from onboarding. */
  motivation?: string;
  /**
   * Whether the home screen offers the next Vyakaran concept. A *preference*
   * now, living in Account where preferences belong and defaulting to on —
   * it used to be a one-shot question in onboarding, which asked people to
   * decide about Gujarati grammar before they'd seen any. See the note in
   * lib/core/personalize.ts.
   */
  wantsGrammar?: boolean;
  /** What they'd like to be called, as they typed it. */
  name?: string;
  /** ...and in Gujarati, which they confirmed. The one string in the app we
   *  render rather than author — it's theirs, so they're the authority. */
  nameGujarati?: string;
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
  /**
   * Word ids typed correctly into Gujarati script. A plain tally, deliberately
   * *not* an SRS namespace — typing grades the letter's own card, and that
   * decision (docs/LEKHAN.md §4) is what keeps the Review deck legible. This
   * just counts, so "text the family group" has something to measure.
   */
  typedWords: string[];
  /** Milestones we've already made a fuss about, so we don't do it twice. */
  celebratedMilestones: string[];
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
    typedWords: [],
    celebratedMilestones: [],
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

export interface StatusCounts {
  new: number;
  learning: number;
  known: number;
}

/**
 * How a set of items breaks down across the three states.
 *
 * "Known" is a real bar — two correct sightings on separate occasions — which is
 * the right meaning for the word, but it makes for a terrible *only* progress
 * indicator: a drill session shows each letter once, so a learner can answer
 * everything correctly and watch a "known" counter sit at zero. Surfacing
 * `learning` alongside it is what lets effort show up immediately without
 * cheapening what mastery means.
 */
export function statusCounts(p: Progress, ids: string[]): StatusCounts {
  const counts: StatusCounts = { new: 0, learning: 0, known: 0 };
  for (const id of ids) counts[itemStatus(p, id)]++;
  return counts;
}

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

export interface OnboardingAnswers {
  goal: string;
  motivation: string;
  name?: string;
  nameGujarati?: string;
}

export function setOnboarding(p: Progress, answers: OnboardingAnswers): Progress {
  return { ...p, onboarded: true, wantsGrammar: p.wantsGrammar ?? true, ...answers };
}

/** Change what we call them — and what we'll teach them to write. */
export function setName(p: Progress, name: string, nameGujarati: string): Progress {
  return { ...p, name, nameGujarati };
}

export function setWantsGrammar(p: Progress, wantsGrammar: boolean): Progress {
  return { ...p, wantsGrammar };
}

/** One more word typed into Gujarati script. Idempotent per word: the milestone
 *  counts distinct words, so re-typing મમ્મી ten times isn't ten words. */
export function recordTypedWord(p: Progress, wordId: string): Progress {
  if (p.typedWords.includes(wordId)) return p;
  return { ...p, typedWords: [...p.typedWords, wordId] };
}

/** Mark milestones as celebrated, and pay out for the ones that are new. */
export function celebrateMilestones(
  p: Progress,
  ids: string[],
  now: Date = new Date(),
): Progress {
  const fresh = ids.filter((id) => !p.celebratedMilestones.includes(id));
  if (fresh.length === 0) return p;
  const next = award(p, XP.milestone * fresh.length, now);
  return { ...next, celebratedMilestones: [...next.celebratedMilestones, ...fresh] };
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

/** Stamp a write time. Kept separate from saving so the value that goes into
 *  memory and the value that goes to disk are the same object — the merge in
 *  lib/core/sync.ts settles scalar fields on it, and a stale copy in memory
 *  would quietly lose those tie-breaks. */
export function touchProgress(p: Progress, now: Date = new Date()): Progress {
  return { ...p, updatedAt: now.toISOString() };
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
