// ─────────────────────────────────────────────────────────────────────────
// Personalization — turning the onboarding "why are you here?" answers into
// small, advisory shaping of the experience.
//
// Pure + framework-agnostic (no React/DOM), like the rest of lib/core, so the
// web app today and an iOS client tomorrow shape their UI the same way. These
// are *hints*: nothing is ever hidden or blocked based on them — the whole app
// stays reachable regardless.
// ─────────────────────────────────────────────────────────────────────────

import type { Progress } from "./progress.ts";

/** Lessons under the belt before the grammar pillar is worth offering. */
const GRAMMAR_AFTER_LESSONS = 2;

/**
 * Should the home screen offer the next Vyakaran concept?
 *
 * This used to be a one-shot toggle in onboarding — "Teach me properly: grammar
 * and all" — and it was the wrong shape twice over. It asked someone to decide
 * about Gujarati grammar in their first thirty seconds, before they had seen
 * any; and it could never be changed afterwards, so the answer was frozen at
 * the moment the learner knew least. Meanwhile Vyakaran is the most carefully
 * built content in the app, and hiding it from everyone who didn't tick a box
 * on day one is backwards.
 *
 * So it's relevance, not preference: grammar shows up once someone has met
 * enough Gujarati for "why does the word change shape?" to be a question they
 * actually have. `wantsGrammar` survives as a real preference — changeable, in
 * Account, defaulting to on — for the learner who genuinely never wants it.
 */
export function offersGrammar(p: Progress): boolean {
  if (p.wantsGrammar === false) return false;
  return p.completedLessons.length >= GRAMMAR_AFTER_LESSONS;
}
