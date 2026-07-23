// ─────────────────────────────────────────────────────────────────────────
// VaatChat — portable learning core: the content model.
//
// This module is deliberately framework-agnostic (no React, no Next, no DOM).
// It is the "brain" that a web client today and an iOS client tomorrow both
// reuse. Keep it pure TypeScript.
// ─────────────────────────────────────────────────────────────────────────

/** Politeness register — critical in Gujarati so learners don't sound rude. */
export type Register = "informal" | "formal" | "neutral";

/**
 * A single learnable unit of language: a word, phrase, or sentence.
 * Every item carries the four channels a beginner needs (script, roman,
 * meaning, audio) so we can dual-code and let romanization fade over time.
 */
export interface LexItem {
  id: string;
  /** Native Gujarati script, e.g. "કેમ છો?" */
  gujarati: string;
  /** Romanized transliteration, e.g. "Kem cho?" — the beginner's training wheel. */
  roman: string;
  /** English meaning, e.g. "How are you?" */
  english: string;
  /** Path to native-recorded audio (relative to /public). Optional → TTS fallback. */
  audio?: string;
  /** Optional word-by-word gloss for sentences, to build intuition. */
  literal?: string;
  /** Politeness register, where it matters (addressing elders vs. peers). */
  register?: Register;
  /** A short usage/culture note surfaced on the item. */
  note?: string;
  /** Free-form tags for filtering / theming. */
  tags?: string[];
}

// ── Lessons & exercises ────────────────────────────────────────────────────

/**
 * Exercise kinds in the lesson loop. Each maps to a research pillar:
 *  - intro       → comprehensible input (hear + see, no pressure)
 *  - recall      → active recall (produce the meaning / the phrase)
 *  - listen      → listening comprehension (audio → pick meaning)
 *  - speak       → output practice (say it; self-compare or STT later)
 *  - assemble    → build the sentence from word tiles (structure)
 *  - dialogue    → complete a turn in a mini-conversation
 */
export type ExerciseKind =
  | "intro"
  | "recall"
  | "listen"
  | "speak"
  | "assemble"
  | "dialogue";

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  /** The primary item this exercise trains (drives SRS scheduling). */
  itemId: string;
  /**
   * Distractor item ids for multiple-choice style exercises (recall/listen).
   * The engine renders the correct answer + these as options.
   */
  distractorIds?: string[];
  /** Optional prompt override; otherwise derived from the item + kind. */
  prompt?: string;
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  /** Ordered exercises. Kept short (2–7 min) — every session ends on a win. */
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  /** English title, e.g. "Greetings & Family". */
  title: string;
  /** Gujarati title, e.g. "નમસ્તે અને પરિવાર". */
  gujaratiTitle: string;
  /** One-line description of what you'll be able to do after it. */
  blurb: string;
  /** Accent color token used for theming this unit in the UI. */
  accent: "marigold" | "magenta" | "peacock";
  order: number;
  lessons: Lesson[];
}

// ── Akshar Lab (the script) ────────────────────────────────────────────────

export type AksharType = "vowel" | "consonant";

/** A single Gujarati letter, taught with a shape→sound mnemonic. */
export interface Akshar {
  id: string;
  /** The independent letter form, e.g. "ક". */
  char: string;
  /** Romanization, e.g. "ka". */
  roman: string;
  /** Approximate English sound hint, e.g. "k as in 'skip'". */
  sound: string;
  type: AksharType;
  /** For vowels: the matra (diacritic) form, e.g. "ા" for "આ". */
  matra?: string;
  /** Shape→sound mnemonic that makes the letter memorable (dual coding). */
  mnemonic: string;
  audio?: string;
}

/** A barakshari cell: a consonant combined with a vowel matra. */
export interface BarakshariCell {
  consonantId: string;
  vowelId: string;
  /** The combined glyph, e.g. "કા". */
  combined: string;
  roman: string;
}

// ── Vaat Mode (scripted branching dialogue) ────────────────────────────────

export interface DialogueChoice {
  /** What the learner says (their turn). */
  say: LexItem;
  /** Id of the node this choice leads to. Undefined → ends the conversation. */
  next?: string;
  /** Optional short coaching note shown after choosing. */
  feedback?: string;
}

export interface DialogueNode {
  id: string;
  /** The character's line at this node. */
  line: LexItem;
  /**
   * The learner's options. If empty, this is a terminal node (the character
   * signs off) and the scenario is complete.
   */
  choices: DialogueChoice[];
}

export interface Scenario {
  id: string;
  /** Character name, e.g. "Ba". */
  character: string;
  /** Character's Gujarati name/emoji for warmth. */
  characterGuj: string;
  emoji: string;
  title: string;
  blurb: string;
  /** Id of the starting node. */
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
}

// ── Rewards (kind, culturally-themed gamification) ─────────────────────────

export interface Reward {
  id: string;
  emoji: string;
  title: string;
  /** How it's earned, shown before unlock. */
  requirement: string;
  /** XP threshold that unlocks it (MVP: simple XP gates). */
  xpNeeded: number;
}
