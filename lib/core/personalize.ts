// ─────────────────────────────────────────────────────────────────────────
// Personalization — turning the onboarding "why are you here?" answers into
// small, advisory shaping of the experience.
//
// Pure + framework-agnostic (no React/DOM), like the rest of lib/core, so the
// web app today and an iOS client tomorrow shape their UI the same way. These
// are *hints*: nothing is ever hidden or blocked based on them — the whole app
// stays reachable regardless.
// ─────────────────────────────────────────────────────────────────────────

import type { Progress } from "./progress";

/**
 * Does this learner want the formal, grammar-first path surfaced up front?
 * Driven by the depth toggle in onboarding — the spouse/"learn it properly"
 * persona — independent of their relationship motivation. When true, the home
 * screen promotes the Vyakaran pillar (otherwise it lives quietly in Explore).
 */
export function prefersGrammarFirst(p: Progress): boolean {
  return Boolean(p.wantsGrammar);
}
