// ─────────────────────────────────────────────────────────────────────────
// Spaced-repetition engine — a thin, portable wrapper over ts-fsrs (FSRS).
//
// The rest of the app never touches ts-fsrs directly; it speaks in our own
// CardState + Grade vocabulary. That keeps the algorithm swappable and the
// storage format stable across web ↔ iOS.
// ─────────────────────────────────────────────────────────────────────────

import {
  fsrs,
  createEmptyCard,
  generatorParameters,
  Rating,
  type Card,
  type Grade,
} from "ts-fsrs";

/** Our serialized per-item memory state. Structurally a ts-fsrs Card, but we
 *  own the type so persistence doesn't couple to the library's internals. */
export interface CardState {
  due: string; // ISO date
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number; // 0 New, 1 Learning, 2 Review, 3 Relearning
  last_review?: string; // ISO date
  learning_steps?: number;
}

/** Learner-facing grades. We keep it to three buttons for a gentle UX. */
export type Grade3 = "again" | "good" | "easy";

const scheduler = fsrs(
  generatorParameters({
    enable_fuzz: true,
    // Slightly higher retention target — beginners benefit from more repetition.
    request_retention: 0.9,
  }),
);

function toCard(s: CardState): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    last_review: s.last_review ? new Date(s.last_review) : undefined,
    learning_steps: s.learning_steps ?? 0,
  } as Card;
}

function fromCard(c: Card): CardState {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? new Date(c.last_review).toISOString() : undefined,
    learning_steps: (c as Card & { learning_steps?: number }).learning_steps ?? 0,
  };
}

const GRADE_TO_RATING: Record<Grade3, Grade> = {
  again: Rating.Again,
  good: Rating.Good,
  easy: Rating.Easy,
};

/** A brand-new, never-seen card, due immediately. */
export function newCard(now: Date = new Date()): CardState {
  return fromCard(createEmptyCard(now));
}

/** Apply a review grade and return the updated card state. */
export function reviewCard(
  state: CardState,
  grade: Grade3,
  now: Date = new Date(),
): CardState {
  const { card } = scheduler.next(toCard(state), now, GRADE_TO_RATING[grade]);
  return fromCard(card);
}

/** Is this card due for review at `now`? */
export function isDue(state: CardState, now: Date = new Date()): boolean {
  return new Date(state.due).getTime() <= now.getTime();
}

/** Human-friendly "next review" label, e.g. "in 3 days". */
export function nextReviewLabel(state: CardState, now: Date = new Date()): string {
  const ms = new Date(state.due).getTime() - now.getTime();
  if (ms <= 0) return "now";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs} hr`;
  const days = Math.round(hrs / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}
