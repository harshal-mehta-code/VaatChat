// ─────────────────────────────────────────────────────────────────────────
// Soft progression — what's unlocked, and what's next.
//
// Philosophy (see docs/PLAN.md + the "learn it properly" discussion): we guide
// with a clear linear path and *discourage* aimless wandering, but we don't
// slam an iron gate. Locks here are advisory — the UI greys and de-emphasizes
// locked items rather than forbidding the route — so a heritage learner with a
// placement bypass (future) is never trapped.
//
// Pure + framework-agnostic: content is passed in, never imported, so the core
// stays portable to iOS.
// ─────────────────────────────────────────────────────────────────────────

import type { Unit, Lesson, GrammarModule, GrammarConcept } from "./types.ts";
import type { Progress } from "./progress.ts";

/** All lessons across all units, in path order (unit.order, then lesson index). */
export function orderedLessons(units: Unit[]): Lesson[] {
  return [...units].sort((a, b) => a.order - b.order).flatMap((u) => u.lessons);
}

/** All grammar concepts across modules, in order. */
export function orderedConcepts(modules: GrammarModule[]): GrammarConcept[] {
  return [...modules].sort((a, b) => a.order - b.order).flatMap((m) => m.concepts);
}

/**
 * A lesson is unlocked if it's the very first on the path, or the lesson
 * immediately before it has been completed. Linear, Duolingo-style, but soft.
 */
export function lessonUnlocked(units: Unit[], progress: Progress, lessonId: string): boolean {
  const path = orderedLessons(units);
  const i = path.findIndex((l) => l.id === lessonId);
  if (i <= 0) return true; // first lesson (or unknown → don't lock)
  return progress.completedLessons.includes(path[i - 1].id);
}

/** The single next thing to do: the first not-yet-completed lesson on the path. */
export function nextLesson(units: Unit[], progress: Progress): Lesson | undefined {
  return orderedLessons(units).find((l) => !progress.completedLessons.includes(l.id));
}

/** Whether every lesson in a unit is complete (for collapsing finished units). */
export function unitComplete(progress: Progress, unit: Unit): boolean {
  return unit.lessons.every((l) => progress.completedLessons.includes(l.id));
}

/** A unit is unlocked if it's first, or the previous unit is fully complete. */
export function unitUnlocked(units: Unit[], progress: Progress, unitId: string): boolean {
  const ordered = [...units].sort((a, b) => a.order - b.order);
  const i = ordered.findIndex((u) => u.id === unitId);
  if (i <= 0) return true;
  return unitComplete(progress, ordered[i - 1]);
}

/** Grammar concept unlocked if first, or the previous concept was completed. */
export function conceptUnlocked(
  modules: GrammarModule[],
  progress: Progress,
  conceptId: string,
): boolean {
  const path = orderedConcepts(modules);
  const i = path.findIndex((c) => c.id === conceptId);
  if (i <= 0) return true;
  return progress.completedGrammar.includes(path[i - 1].id);
}

// ── Akshar Lab: which script skill to put in front of them ────────────────

/** Reading, forming by hand, typing. Three skills over one alphabet. */
export type ScriptSkill = "read" | "write" | "type";

export interface ScriptCounts {
  /** Letters recognised on sight. */
  read: number;
  /** Letters they can form by hand. */
  write: number;
  /** Letters that exist to be read. */
  total: number;
}

/** Letters to recognise before forming one by hand is worth the effort. */
const READ_BEFORE_WRITE = 5;
/** How far writing may trail reading before it's the thing to do next. */
const WRITE_LAG = 6;

/**
 * The one script skill to recommend right now.
 *
 * Akshar Lab used to present all three as equal, saturated, side-by-side
 * choices — and for someone who knows zero letters, "learn to write" and "learn
 * to type" aren't choices, they're noise. They're also genuinely sequential:
 * you can't form a letter you can't recognise, and typing is a harder direction
 * on the same knowledge (docs/LEKHAN.md §4).
 *
 * So: read until there's something to work with, then whichever of writing and
 * typing has fallen behind. Advisory, like everything in this file — all three
 * stay one tap away.
 */
export function nextScriptSkill(counts: ScriptCounts): ScriptSkill {
  if (counts.read < READ_BEFORE_WRITE) return "read";
  if (counts.write + WRITE_LAG < counts.read) return "write";
  if (counts.read < counts.total) return "read";
  return "type";
}

/** The next grammar concept to work through. */
export function nextConcept(
  modules: GrammarModule[],
  progress: Progress,
): GrammarConcept | undefined {
  return orderedConcepts(modules).find((c) => !progress.completedGrammar.includes(c.id));
}
