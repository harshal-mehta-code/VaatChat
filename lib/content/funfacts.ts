// ─────────────────────────────────────────────────────────────────────────
// Fun facts — the "big win" payoff after a lesson or concept. Each is a small
// hit of delight that *also* teaches something extra about the language or
// culture. Rotated (not random) so every completion feels fresh, and shown at
// milestones rather than every single time so the reward never goes stale.
//
// ✅ Native/cultural-reviewed by the owner (raised in Gujarat) on 2026-07-24;
// kept to safe, well-known facts (no invented statistics).
// ─────────────────────────────────────────────────────────────────────────

import type { FunFact } from "../core/types.ts";

export const FUN_FACTS: FunFact[] = [
  {
    id: "abugida",
    emoji: "🔤",
    text: "The Gujarati script is an \"abugida\" — every consonant already carries a built-in \"a\" sound. So ક is \"ka,\" not just \"k.\"",
    learn: "That's exactly why the barakshari grid exists: to swap in every other vowel.",
  },
  {
    id: "aspiration",
    emoji: "💨",
    text: "ક (ka) and ખ (kha) are different letters — the only difference is a tiny puff of air, and it changes the meaning.",
    learn: "Hold your hand to your mouth on ખ — you'll feel the breath.",
  },
  {
    id: "namaste",
    emoji: "🙏",
    text: "\"Namaste\" literally means \"I bow to you\" — respect is built right into the greeting.",
  },
  {
    id: "no-case",
    emoji: "🅰️",
    text: "Gujarati has no capital or lowercase letters — just one form per letter. One less thing to memorize!",
  },
  {
    id: "no-headline",
    emoji: "✍️",
    text: "Unlike Hindi's Devanagari, Gujarati letters have no horizontal line across the top — that's the quickest way to tell the two scripts apart.",
    learn: "It gives Gujarati its clean, rounded look.",
  },
  {
    id: "kem-cho",
    emoji: "💬",
    text: "\"Kem cho?\" literally means just \"How are?\" — the \"you\" is understood, not spoken.",
    learn: "Gujarati often drops words that English insists on keeping.",
  },
  {
    id: "thali",
    emoji: "🍽️",
    text: "A \"thali\" (થાળી) simply means \"plate\" — but it's come to mean a whole meal of many small dishes served together.",
    learn: "You already know this word!",
  },
  {
    id: "diwali",
    emoji: "🪔",
    text: "\"Diwali\" comes from deep-avali — a row (avali) of lamps (deep). The festival is literally \"a row of lights.\"",
    learn: "દીવો (divo) means \"lamp.\"",
  },
  {
    id: "tame",
    emoji: "👵",
    text: "Gujarati keeps two words for \"you\": તમે for respect, તું for closeness. Choosing the right one is a small act of care.",
  },
  {
    id: "diaspora",
    emoji: "🌏",
    text: "Gujarati travelled far — it's spoken across a huge global community, from East Africa to the UK, US, and Canada.",
    learn: "Learning it connects you to people on nearly every continent.",
  },
];

/** Pick a fun fact deterministically so it rotates (not repeats) across
 *  completions. Pass a value that grows over time, e.g. lessons completed. */
export function funFactFor(n: number): FunFact {
  const i = ((n % FUN_FACTS.length) + FUN_FACTS.length) % FUN_FACTS.length;
  return FUN_FACTS[i];
}
