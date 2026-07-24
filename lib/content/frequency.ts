// ─────────────────────────────────────────────────────────────────────────
// The "most useful words" bank — a frequency-ranked core vocabulary.
//
// ✅ Native-verified by the owner (native Gujarati speaker, raised in Gujarat) on 2026-07-24.
// These are the high-frequency function/utility words (pronouns, everyday
// verbs, connectors, quantifiers, time & place) that the themed units don't
// dwell on but that appear in almost every real sentence. Learning them pays
// outsized dividends: a small set unlocks comprehension across the board.
//
// Design: ordered by rough usefulness/frequency (index 0 = most useful) and
// grouped into tiers. Tiers unlock progressively as the learner completes
// lessons, and each unlocked word flows straight into the Review deck — the
// first review seeds its SRS card (see components/ReviewSession + app/review).
// Kept as LexItems so they share the exact same SRS/audio machinery as the
// themed vocab, and reuse the app's friendly romanization scheme (not IAST).
//
// Ids are intentionally distinct from the themed ITEMS in units.ts so nothing
// collides in the shared SRS pool.
// ─────────────────────────────────────────────────────────────────────────

import type { LexItem } from "../core/types";
import type { Progress } from "../core/progress";

/** How many words unlock per tier. One tier opens per completed lesson. */
export const FREQ_TIER_SIZE = 8;

/**
 * The bank, most-useful first. Five tiers of eight. Every word here is one a
 * beginner will hear within their first real conversations — the connective
 * tissue of the language.
 */
export const FREQUENCY_ITEMS: LexItem[] = [
  // ── Tier 1 — the words in almost every sentence ──────────────────────────
  { id: "f-hu", gujarati: "હું", roman: "Hu", english: "I", audio: "/audio/freq/hu.mp3", tags: ["freq", "t1", "pronoun"] },
  { id: "f-tu", gujarati: "તું", roman: "Tu", english: "you (informal)", register: "informal", audio: "/audio/freq/tu.mp3", tags: ["freq", "t1", "pronoun"] },
  { id: "f-te", gujarati: "તે", roman: "Te", english: "he / she / that", audio: "/audio/freq/te.mp3", tags: ["freq", "t1", "pronoun"] },
  { id: "f-ame", gujarati: "અમે", roman: "Ame", english: "we", audio: "/audio/freq/ame.mp3", tags: ["freq", "t1", "pronoun"] },
  { id: "f-aa", gujarati: "આ", roman: "Aa", english: "this", audio: "/audio/freq/aa.mp3", tags: ["freq", "t1"] },
  { id: "f-chhe", gujarati: "છે", roman: "Chhe", english: "is / are", audio: "/audio/freq/chhe.mp3", tags: ["freq", "t1", "verb"] },
  { id: "f-shu", gujarati: "શું", roman: "Shu", english: "what", audio: "/audio/freq/shu.mp3", tags: ["freq", "t1", "question"] },
  { id: "f-ane", gujarati: "અને", roman: "Ane", english: "and", audio: "/audio/freq/ane.mp3", tags: ["freq", "t1", "connector"] },

  // ── Tier 2 — everyday verbs (the base form) ──────────────────────────────
  { id: "f-karvu", gujarati: "કરવું", roman: "Karvu", english: "to do", audio: "/audio/freq/karvu.mp3", tags: ["freq", "t2", "verb"] },
  { id: "f-javu", gujarati: "જવું", roman: "Javu", english: "to go", audio: "/audio/freq/javu.mp3", tags: ["freq", "t2", "verb"] },
  { id: "f-aavvu", gujarati: "આવવું", roman: "Aavvu", english: "to come", audio: "/audio/freq/aavvu.mp3", tags: ["freq", "t2", "verb"] },
  { id: "f-khavu", gujarati: "ખાવું", roman: "Khavu", english: "to eat", audio: "/audio/freq/khavu.mp3", tags: ["freq", "t2", "verb"] },
  { id: "f-pivu", gujarati: "પીવું", roman: "Pivu", english: "to drink", audio: "/audio/freq/pivu.mp3", tags: ["freq", "t2", "verb"] },
  { id: "f-bolvu", gujarati: "બોલવું", roman: "Bolvu", english: "to speak", audio: "/audio/freq/bolvu.mp3", tags: ["freq", "t2", "verb"] },
  { id: "f-jovu", gujarati: "જોવું", roman: "Jovu", english: "to see / look", audio: "/audio/freq/jovu.mp3", tags: ["freq", "t2", "verb"] },
  { id: "f-joie", gujarati: "જોઈએ", roman: "Joie", english: "want / is needed", audio: "/audio/freq/joie.mp3", tags: ["freq", "t2", "verb"] },

  // ── Tier 3 — asking & joining ideas ──────────────────────────────────────
  { id: "f-kem", gujarati: "કેમ", roman: "Kem", english: "why / how", audio: "/audio/freq/kem.mp3", tags: ["freq", "t3", "question"] },
  { id: "f-kyare", gujarati: "ક્યારે", roman: "Kyare", english: "when", audio: "/audio/freq/kyare.mp3", tags: ["freq", "t3", "question"] },
  { id: "f-kon", gujarati: "કોણ", roman: "Kon", english: "who", audio: "/audio/freq/kon.mp3", tags: ["freq", "t3", "question"] },
  { id: "f-kyaa", gujarati: "ક્યાં", roman: "Kyaa", english: "where", audio: "/audio/freq/kyaa.mp3", tags: ["freq", "t3", "question"] },
  { id: "f-pan", gujarati: "પણ", roman: "Pan", english: "but / also", audio: "/audio/freq/pan.mp3", tags: ["freq", "t3", "connector"] },
  { id: "f-kemke", gujarati: "કેમકે", roman: "Kemke", english: "because", audio: "/audio/freq/kemke.mp3", tags: ["freq", "t3", "connector"] },
  { id: "f-etle", gujarati: "એટલે", roman: "Etle", english: "so / therefore", audio: "/audio/freq/etle.mp3", tags: ["freq", "t3", "connector"] },
  { id: "f-have", gujarati: "હવે", roman: "Have", english: "now", audio: "/audio/freq/have.mp3", tags: ["freq", "t3", "time"] },

  // ── Tier 4 — describing things ───────────────────────────────────────────
  { id: "f-ghanu", gujarati: "ઘણું", roman: "Ghanu", english: "a lot / very", audio: "/audio/freq/ghanu.mp3", tags: ["freq", "t4"] },
  { id: "f-badhu", gujarati: "બધું", roman: "Badhu", english: "all / everything", audio: "/audio/freq/badhu.mp3", tags: ["freq", "t4"] },
  { id: "f-saru", gujarati: "સારું", roman: "Saaru", english: "good", audio: "/audio/freq/saru.mp3", tags: ["freq", "t4", "adjective"] },
  { id: "f-kharab", gujarati: "ખરાબ", roman: "Kharaab", english: "bad", audio: "/audio/freq/kharab.mp3", tags: ["freq", "t4", "adjective"] },
  { id: "f-moto", gujarati: "મોટો", roman: "Moto", english: "big", audio: "/audio/freq/moto.mp3", tags: ["freq", "t4", "adjective"] },
  { id: "f-naano", gujarati: "નાનો", roman: "Naano", english: "small", audio: "/audio/freq/naano.mp3", tags: ["freq", "t4", "adjective"] },
  { id: "f-navu", gujarati: "નવું", roman: "Navu", english: "new", audio: "/audio/freq/navu.mp3", tags: ["freq", "t4", "adjective"] },
  { id: "f-junu", gujarati: "જૂનું", roman: "Junu", english: "old", audio: "/audio/freq/junu.mp3", tags: ["freq", "t4", "adjective"] },

  // ── Tier 5 — time & place ────────────────────────────────────────────────
  { id: "f-aje", gujarati: "આજે", roman: "Aaje", english: "today", audio: "/audio/freq/aje.mp3", tags: ["freq", "t5", "time"] },
  { id: "f-kaale", gujarati: "કાલે", roman: "Kaale", english: "tomorrow / yesterday", note: "Context tells you which — the day next to today.", audio: "/audio/freq/kaale.mp3", tags: ["freq", "t5", "time"] },
  { id: "f-roj", gujarati: "રોજ", roman: "Roj", english: "every day", audio: "/audio/freq/roj.mp3", tags: ["freq", "t5", "time"] },
  { id: "f-ahiya", gujarati: "અહીં", roman: "Ahiya", english: "here", audio: "/audio/freq/ahiya.mp3", tags: ["freq", "t5", "place"] },
  { id: "f-tyaa", gujarati: "ત્યાં", roman: "Tyaa", english: "there", audio: "/audio/freq/tyaa.mp3", tags: ["freq", "t5", "place"] },
  { id: "f-jaldi", gujarati: "જલદી", roman: "Jaldi", english: "soon / quickly", audio: "/audio/freq/jaldi.mp3", tags: ["freq", "t5"] },
  { id: "f-dhime", gujarati: "ધીમે", roman: "Dhime", english: "slowly", audio: "/audio/freq/dhime.mp3", tags: ["freq", "t5"] },
  { id: "f-fari", gujarati: "ફરી", roman: "Fari", english: "again", audio: "/audio/freq/fari.mp3", tags: ["freq", "t5"] },
];

export const FREQUENCY_BY_ID: Record<string, LexItem> = Object.fromEntries(
  FREQUENCY_ITEMS.map((i) => [i.id, i]),
);

/** Total tiers in the bank (for progress display). */
export function freqTierCount(): number {
  return Math.ceil(FREQUENCY_ITEMS.length / FREQ_TIER_SIZE);
}

/**
 * How many tiers the learner has unlocked — one per completed lesson, so the
 * bank grows in step with the themed path. Soft/advisory, like the rest of our
 * progression: nothing is ever gated behind it.
 */
export function unlockedFreqTiers(progress: Progress): number {
  return Math.min(freqTierCount(), progress.completedLessons.length);
}

/**
 * The frequency words unlocked so far. These are injected into the Review deck;
 * a word that has no SRS card yet is simply "new" and gets one the first time
 * it's reviewed (gradeItem creates cards on first sight).
 */
export function unlockedFrequency(progress: Progress): LexItem[] {
  return FREQUENCY_ITEMS.slice(0, unlockedFreqTiers(progress) * FREQ_TIER_SIZE);
}
