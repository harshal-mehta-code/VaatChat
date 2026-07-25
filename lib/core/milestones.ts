// ─────────────────────────────────────────────────────────────────────────
// The journey — what you can actually do, stated as things you'd say out loud.
//
// Before this, progress lived in four disconnected places: XP and a level on
// home, letters-known and letters-you-can-write in Akshar Lab, deck counts in
// Review, and grammar nowhere at all. None of them answered the only question a
// learner really has, which is *how far am I, and what am I working toward*.
//
// The obvious fix is a bigger number — more XP, a percentage, a longer bar.
// That's the wrong instrument. XP measures activity; this app's whole argument
// is that it teaches something real, and the honest unit of that is a
// capability. "Reach 500 XP" is not a thing anyone wants. "Write your own name
// in Gujarati" is.
//
// So: named milestones that cut *across* the pillars, each with criteria you
// can read off the learner's progress. They deliberately mix — reading a letter,
// forming one by hand, typing one, and understanding why a word changes shape
// are four different skills, and a journey that only counted one of them would
// quietly tell the learner the other three don't matter.
//
// Content comes in through `MilestoneCatalog` rather than being imported, so
// this stays portable to iOS like the rest of lib/core. `npm run
// check:milestones` proves every one of them is reachable.
// ─────────────────────────────────────────────────────────────────────────

import type { Progress } from "./progress.ts";
import { itemStatus, writingCardId } from "./progress.ts";

/** What the criteria need to know about the content that exists. */
export interface MilestoneCatalog {
  /** Every letter that appears in drills (rare ones excluded). */
  letterIds: readonly string[];
  /** Letters we have stroke data for — the ceiling on anything handwritten. */
  writableLetterIds: readonly string[];
  lessonCount: number;
  scenarioCount: number;
  conceptCount: number;
  /**
   * The letters of the learner's own name, as akshar ids — empty until they've
   * told us. Filtered to letters we can actually teach the writing of, because
   * a milestone that can't be reached isn't a milestone.
   */
  nameLetterIds: readonly string[];
}

export type Pillar = "path" | "script" | "hand" | "keys" | "grammar" | "talk";

export interface Milestone {
  id: string;
  emoji: string;
  /** The capability, in the learner's words. */
  title: string;
  /** What it takes, plainly. */
  requirement: string;
  pillar: Pillar;
  /** Progress toward it. `need` is never 0 — see `pending` for the exception. */
  measure(p: Progress, cat: MilestoneCatalog): { have: number; need: number };
  /** Set when the milestone can't be measured yet (we don't know their name). */
  pending?(p: Progress, cat: MilestoneCatalog): string | undefined;
}

const knownAmong = (p: Progress, ids: readonly string[]) =>
  ids.filter((id) => itemStatus(p, id) === "known").length;

/** Vocabulary only — grammar and writing keep their own namespaces, and folding
 *  them into a word count would inflate it with things that aren't words. */
function knownWords(p: Progress): number {
  return Object.keys(p.cards).filter(
    (id) => !id.startsWith("g-") && !id.startsWith("w-") && itemStatus(p, id) === "known",
  ).length;
}

/** Capped so a milestone reads as done rather than overshooting. */
const upTo = (have: number, need: number) => ({ have: Math.min(have, need), need });

/**
 * The journey, in order.
 *
 * Ordering is roughly by reach, not by pillar — the point is that the next thing
 * to aim for is usually in a different part of the app from the last one, which
 * is what stops a learner grinding one drill and calling it progress.
 */
export const MILESTONES: Milestone[] = [
  {
    id: "first-lesson",
    emoji: "🌱",
    title: "Your first Gujarati",
    requirement: "Finish a lesson",
    pillar: "path",
    measure: (p) => upTo(p.completedLessons.length, 1),
  },
  {
    id: "first-word",
    emoji: "📖",
    title: "Read your first word",
    requirement: "Recognise 6 letters on sight",
    pillar: "script",
    measure: (p, cat) => upTo(knownAmong(p, cat.letterIds), 6),
  },
  {
    id: "hello",
    emoji: "🙏",
    title: "Say hello and mean it",
    requirement: "Get through a conversation in Vaat",
    pillar: "talk",
    measure: (p) => upTo(p.completedScenarios.length, 1),
  },
  {
    id: "by-hand",
    emoji: "✍️",
    title: "Form letters by hand",
    requirement: "Write 5 letters from memory",
    pillar: "hand",
    measure: (p, cat) =>
      upTo(knownAmong(p, cat.writableLetterIds.map(writingCardId)), 5),
  },
  {
    id: "why-not-what",
    emoji: "🧩",
    title: "Know why, not just what",
    requirement: "Work through 3 grammar concepts",
    pillar: "grammar",
    measure: (p) => upTo(p.completedGrammar.length, 3),
  },
  {
    id: "your-name",
    emoji: "🪔",
    title: "Write your own name",
    requirement: "Write every letter of your name by hand",
    pillar: "hand",
    // The emotional peak of the whole writing track (docs/LEKHAN.md §5), and the
    // one milestone that's different for every learner.
    measure: (p, cat) =>
      upTo(knownAmong(p, cat.nameLetterIds.map(writingCardId)), Math.max(1, cat.nameLetterIds.length)),
    pending: (p, cat) =>
      cat.nameLetterIds.length === 0
        ? "Tell us your name and we'll show you how to write it"
        : undefined,
  },
  {
    id: "family-group",
    emoji: "⌨️",
    title: "Text the family group",
    requirement: "Type 10 words in Gujarati script",
    pillar: "keys",
    measure: (p) => upTo(p.typedWords?.length ?? 0, 10),
  },
  {
    id: "whole-alphabet",
    emoji: "🔤",
    title: "Read the whole alphabet",
    requirement: "Every letter, known",
    pillar: "script",
    measure: (p, cat) => upTo(knownAmong(p, cat.letterIds), cat.letterIds.length),
  },
  {
    id: "hundred-words",
    emoji: "🍽️",
    title: "A hundred words",
    requirement: "100 words you know for good",
    pillar: "path",
    measure: (p) => upTo(knownWords(p), 100),
  },
  // There's no "finish every conversation" milestone, and there shouldn't be
  // until Vaat has more than one scenario — with one, its bar is identical to
  // "say hello and mean it" and the journey would show the same achievement
  // twice under different names. check:milestones asserts no two bars collide.
  {
    id: "grammar-through",
    emoji: "🪁",
    title: "The grammar, all of it",
    requirement: "Every concept in Vyakaran",
    pillar: "grammar",
    measure: (p, cat) => upTo(p.completedGrammar.length, Math.max(1, cat.conceptCount)),
  },
];

export interface MilestoneState {
  milestone: Milestone;
  have: number;
  need: number;
  earned: boolean;
  /** Why it can't be measured yet, if it can't. */
  blocked?: string;
}

export function milestoneStates(p: Progress, cat: MilestoneCatalog): MilestoneState[] {
  return MILESTONES.map((milestone) => {
    const blocked = milestone.pending?.(p, cat);
    const { have, need } = milestone.measure(p, cat);
    return { milestone, have, need, earned: !blocked && have >= need, blocked };
  });
}

/**
 * The one to put in front of them.
 *
 * Not simply the first unearned: a milestone they can't measure yet (no name on
 * file) shouldn't sit at the top of the app blocking the view, and neither
 * should one they've barely started when something else is nearly done. So:
 * closest to completion among those actually under way, else the first one left.
 */
export function nextMilestone(p: Progress, cat: MilestoneCatalog): MilestoneState | undefined {
  const open = milestoneStates(p, cat).filter((s) => !s.earned && !s.blocked);
  if (open.length === 0) return milestoneStates(p, cat).find((s) => !s.earned);
  const started = open.filter((s) => s.have > 0);
  const pool = started.length ? started : open;
  return pool.reduce((best, s) => (s.need - s.have < best.need - best.have ? s : best));
}

export function earnedMilestoneIds(p: Progress, cat: MilestoneCatalog): string[] {
  return milestoneStates(p, cat)
    .filter((s) => s.earned)
    .map((s) => s.milestone.id);
}

/** Earned since we last made a fuss — the app owes them a moment for these. */
export function uncelebrated(p: Progress, cat: MilestoneCatalog): Milestone[] {
  const seen = new Set(p.celebratedMilestones ?? []);
  return milestoneStates(p, cat)
    .filter((s) => s.earned && !seen.has(s.milestone.id))
    .map((s) => s.milestone);
}
