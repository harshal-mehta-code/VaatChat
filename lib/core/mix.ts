// ─────────────────────────────────────────────────────────────────────────
// The daily mix — five minutes that touch every pillar.
//
// The app's core loop was ~80% recognition: tap the right option out of four,
// over and over. Recognition is the cheapest thing to build and the least
// transferable — it's why people finish a language tree and freeze in a real
// conversation. Meanwhile the parts of this app that *aren't* multiple choice
// (the stroke pad, the typing ladder, the grammar builds) sat in separate
// corners, each behind its own button, each its own decision to make.
//
// The mix is the fix, and it costs almost no new machinery: every leg is a
// session component that already exists. What it adds is variation at the level
// of *format* rather than order. We shipped seeded shuffling so the questions
// stop coming in the same sequence; this is the next thing up — so the session
// itself stops having the same shape.
//
// Two rules hold it together:
//
//   Review always leads, when there's a deck. Due cards are the one thing with
//   a real cost to skipping, and burying them behind a novelty leg would make
//   the mix worse than the Review tab it's meant to complement.
//
//   Everything after that is drawn from what's *available*. A learner three
//   minutes into day one has no grammar concept behind them and nothing to
//   review; they get letters and typing, and the mix grows into itself.
//
// Pure and content-free like the rest of lib/core. `npm run check:variation`
// covers it.
// ─────────────────────────────────────────────────────────────────────────

import { shuffled, type Rng } from "./variation.ts";

export type MixLegKind = "review" | "letters" | "write" | "type" | "grammar";

export interface MixLeg {
  kind: MixLegKind;
  /** Questions in this leg. Short — the point is that the shape keeps changing. */
  size: number;
}

/** What the learner's progress actually supports right now. */
export interface MixAvailability {
  /** Vocabulary cards in the deck. */
  deck: number;
  /** Letters with stroke data that they've started. */
  writable: number;
  /** Grammar concepts they've worked through. */
  concepts: number;
}

/** Legs after the opener. Four total is about five minutes. */
const LEGS = 4;

const SIZE: Record<MixLegKind, number> = {
  review: 4,
  letters: 4,
  write: 2,
  type: 3,
  grammar: 2,
};

/** Enough of a deck that a review leg isn't the same four cards every day. */
const DECK_FLOOR = 4;

/**
 * One sitting's worth of mixed practice.
 *
 * Deterministic given the rng, so the same seed replays the same mix — which is
 * what stops it reshuffling under the learner mid-session.
 */
export function planMix(available: MixAvailability, rng: Rng): MixLeg[] {
  const legs: MixLeg[] = [];

  if (available.deck >= DECK_FLOOR) legs.push({ kind: "review", size: SIZE.review });

  // Letters and typing need nothing but the alphabet, which always exists.
  const optional: MixLegKind[] = ["letters", "type"];
  if (available.writable > 0) optional.push("write");
  if (available.concepts > 0) optional.push("grammar");

  for (const kind of shuffled(optional, rng)) {
    if (legs.length >= LEGS) break;
    legs.push({ kind, size: SIZE[kind] });
  }

  return legs;
}

/** How the mix describes itself before you start it. */
export const LEG_LABEL: Record<MixLegKind, string> = {
  review: "words you know",
  letters: "letters",
  write: "by hand",
  type: "typing",
  grammar: "grammar",
};
