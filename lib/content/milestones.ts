// ─────────────────────────────────────────────────────────────────────────
// Wiring the journey to the content that exists.
//
// lib/core/milestones.ts holds the criteria and knows nothing about our
// curriculum — it takes a catalog. This builds that catalog, which is the only
// place the two need to meet.
// ─────────────────────────────────────────────────────────────────────────

import type { Progress } from "../core/progress.ts";
import type { MilestoneCatalog } from "../core/milestones.ts";
import { segmentGujarati } from "../core/translit.ts";
import { VOWELS, TEACHABLE_CONSONANTS } from "./akshar.ts";
import { hasStrokes } from "./strokes.ts";
import { UNITS } from "./units.ts";
import { SCENARIOS } from "./scenarios.ts";
import { GRAMMAR_MODULES } from "./grammar.ts";

/** Letters that appear in drills — ઙ and ઞ never stand alone, so they're out. */
const PRACTICE_LETTERS = [...VOWELS, ...TEACHABLE_CONSONANTS];
const LETTER_IDS = PRACTICE_LETTERS.map((a) => a.id);
const WRITABLE_LETTER_IDS = LETTER_IDS.filter(hasStrokes);

/** char → akshar id, for reading a name back into letters we can teach. */
const ID_BY_CHAR: Record<string, string> = Object.fromEntries(
  PRACTICE_LETTERS.map((a) => [a.char, a.id]),
);

const LESSON_COUNT = UNITS.reduce((n, u) => n + u.lessons.length, 0);
const CONCEPT_COUNT = GRAMMAR_MODULES.reduce((n, m) => n + m.concepts.length, 0);

/**
 * The letters of a name, as writable akshar ids.
 *
 * Matras are dropped: they're never practised alone (you first draw ો inside a
 * word), so requiring one would make the milestone unreachable. Letters we have
 * no stroke data for are dropped for the same reason — but if that empties the
 * list entirely, we return nothing rather than a name we can't actually teach,
 * and the milestone reports itself as pending instead of instantly earned.
 */
export function nameLetterIds(nameGujarati: string | undefined): string[] {
  if (!nameGujarati) return [];
  const ids = new Set<string>();
  for (const cluster of segmentGujarati(nameGujarati)) {
    if (cluster.literal) continue;
    for (const part of cluster.parts) {
      const id = ID_BY_CHAR[part];
      if (id && WRITABLE_LETTER_IDS.includes(id)) ids.add(id);
    }
  }
  return [...ids];
}

export function milestoneCatalog(progress: Progress): MilestoneCatalog {
  return {
    letterIds: LETTER_IDS,
    writableLetterIds: WRITABLE_LETTER_IDS,
    lessonCount: LESSON_COUNT,
    scenarioCount: SCENARIOS.length,
    conceptCount: CONCEPT_COUNT,
    nameLetterIds: nameLetterIds(progress.nameGujarati),
  };
}
