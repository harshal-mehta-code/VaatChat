// ─────────────────────────────────────────────────────────────────────────
// Planning one sitting.
//
// The shift this file represents: content stops declaring *the* exercise
// sequence and starts declaring *what could be practised*. A lesson lists every
// item it teaches and every way it could drill them; a session picks from that.
//
// The pedagogy is in the phase order and it does not move — you meet a word
// before you're asked to recall it, and you recall it before you're asked to
// produce it. What varies is everything inside a phase: which words open as a
// guess, which get a listening drill, and what order any of it comes in.
//
// That buys two things at once. Replaying a lesson stops being a rerun, and the
// same 130 items go a lot further — which matters, because content is the thing
// we'll always have least of (docs/PLAN.md §7).
// ─────────────────────────────────────────────────────────────────────────

import type { Exercise, ExerciseKind } from "./types.ts";
import { shuffled, type Rng } from "./variation.ts";

/**
 * How much of a lesson's full grid one sitting actually draws.
 *
 * `predict` — the meet phase opens with a few guess-first beats rather than all
 * of them, so a lesson starts on curiosity and not a wall of coin flips.
 * `listen`/`speak` — capped so a session stays in the 2–7 minute band
 * (docs/PLAN.md §4.5). Which items fill the slots is the session's choice.
 */
export const SESSION_SHAPE: Partial<Record<ExerciseKind, number>> = {
  predict: 3,
  listen: 3,
  speak: 3,
};

/**
 * Turn a lesson's full exercise grid into one sitting's sequence.
 *
 * Phases keep the order the content declared them in; within a phase, order and
 * selection are the session's. The meet phase additionally promotes a few
 * exercises to `predict` — guess the meaning before it's revealed, which primes
 * memory even when the guess is wrong.
 */
export function planLesson(exercises: readonly Exercise[], rng: Rng): Exercise[] {
  const groups = new Map<ExerciseKind, Exercise[]>();
  const phaseOrder: ExerciseKind[] = [];
  for (const ex of exercises) {
    if (!groups.has(ex.kind)) {
      groups.set(ex.kind, []);
      phaseOrder.push(ex.kind);
    }
    groups.get(ex.kind)!.push(ex);
  }

  const out: Exercise[] = [];
  for (const kind of phaseOrder) {
    const group = shuffled(groups.get(kind)!, rng);

    if (kind === "intro") {
      const wanted = SESSION_SHAPE.predict ?? 0;
      let promoted = 0;
      for (const ex of group) {
        // Only an exercise with somewhere to guess *among* can be a predict.
        if (promoted < wanted && (ex.distractorIds?.length ?? 0) > 0) {
          out.push({ ...ex, kind: "predict" });
          promoted++;
        } else {
          out.push(ex);
        }
      }
      continue;
    }

    const cap = SESSION_SHAPE[kind];
    out.push(...(cap === undefined ? group : group.slice(0, cap)));
  }
  return out;
}
