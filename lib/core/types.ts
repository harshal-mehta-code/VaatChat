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
 *  - predict     → pretest: guess the meaning *before* it's revealed. Even a
 *                  wrong guess primes memory (pretesting / generation effect),
 *                  so the reveal lands harder than a passive first look.
 *  - recall      → active recall (produce the meaning / the phrase)
 *  - listen      → listening comprehension (audio → pick meaning)
 *  - speak       → output practice (say it; self-compare or STT later)
 *  - assemble    → build the sentence from word tiles (structure)
 *  - dialogue    → complete a turn in a mini-conversation
 */
export type ExerciseKind =
  | "intro"
  | "predict"
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

// ── Lekhan (handwriting) ───────────────────────────────────────────────────
// Stroke data for teaching *how a letter is formed*: the order, the direction,
// and the starting point — the parts a font can never show you. See
// docs/LEKHAN.md. Authored by a native writer via /dev/stroke-lab.

/** A point in glyph space. */
export type Pt = [number, number];

/**
 * One pen-down → pen-up stroke, as a centerline polyline (not an outline):
 * centerlines are what you can animate along, trace over, and score against.
 *
 * Coordinates live in a shared 1000×1000 em-box (`GLYPH_BOX`) with the glyph
 * typeset identically for every letter — deliberately NOT normalized per-glyph,
 * so relative size and position survive. That's what lets a matra be authored
 * once and still land correctly on top of its consonant.
 */
export interface Stroke {
  points: Pt[];
  /** Optional coaching note for this stroke, e.g. "start at the top". */
  hint?: string;
}

/** The full stroke recipe for one letter or matra. */
export interface StrokeGlyph {
  /** Akshar id ("c-ka") or matra id ("m-aa"). */
  id: string;
  /** The character(s) this draws — for a matra, the bare matra. */
  char: string;
  strokes: Stroke[];
  /** Typeset advance width in em-box units, for laying letters on a baseline. */
  advance?: number;
  /** Who authored it + when — provenance matters for a source-of-truth asset. */
  by?: string;
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

// ── Vyakaran (grammar pillar) ──────────────────────────────────────────────
// A parallel, structured track for learners who want to understand *how*
// Gujarati works. Deliberately separate from the lexical Lesson/Exercise model
// so the conversation-first path is untouched. See docs/VYAKARAN.md.

/** One worked example in a concept's guided-discovery step. */
export interface GrammarExample {
  gujarati: string;
  roman: string;
  english: string;
  /** Substring of `gujarati` to visually emphasize — the pattern/morpheme. */
  highlight?: string;
  /** Native audio for the example (same pipeline as LexItem). */
  audio?: string;
  /** A tiny gloss/aside, e.g. the gender of the noun. */
  note?: string;
}

/**
 * Production drill kinds for grammar. Each asks the learner to *produce* a form,
 * not just recognize meaning:
 *  - choose → pick the correct form (agreement, register, verb form)
 *  - cloze  → fill a gap in a sentence by choosing the right form
 *  - build  → arrange word tiles into a correct sentence (word order)
 */
export type GrammarExerciseKind = "choose" | "cloze" | "build";

export interface GrammarOption {
  /** The form shown on the option (Gujarati). */
  text: string;
  roman?: string;
  correct: boolean;
}

export interface GrammarExercise {
  id: string;
  kind: GrammarExerciseKind;
  /** The instruction/question, in English. */
  prompt: string;
  /** Sentence frame; for `cloze`, "___" marks the blank. */
  frame?: string;
  frameRoman?: string;
  english?: string;
  /** For choose/cloze: the options (exactly one correct in MVP). */
  options?: GrammarOption[];
  /** For build: the correct ordered Gujarati tokens. */
  answer?: string[];
  /** For build: romanization tokens parallel to `answer` (display aid). */
  answerRoman?: string[];
  /** Shown after answering — the "why" (reinforces the rule). */
  explain?: string;
}

/**
 * A curiosity hook: pose a question and let the learner *commit a guess* before
 * teaching. Predicting first — even wrongly — opens an "information gap" and
 * primes memory (the pretesting / generation effect). Works when there's
 * something to reason from (patterns, or connecting to the already-known).
 */
export interface CuriosityHook {
  /** The curiosity question, in English. */
  question: string;
  /** Plausible answers to guess among (2–3). */
  guesses: { text: string; roman?: string }[];
  /** Index into `guesses` of the correct one. */
  answerIndex: number;
  /** One-line teaser shown after guessing, leading into the lesson. */
  reveal: string;
}

/** A single grammar pattern — taught by discovery, drilled, and SRS-tracked. */
export interface GrammarConcept {
  /** Stable slug. Used as an SRS item id with a "g-" prefix. */
  id: string;
  moduleId: string;
  order: number;
  /** English title, e.g. `"My" changes shape`. */
  title: string;
  /** One-line "what you'll get". */
  blurb: string;
  /** Optional curiosity hook shown before discovery (predict-then-reveal). */
  hook?: CuriosityHook;
  discovery: {
    /** Framing line, e.g. "Notice what changes." */
    intro: string;
    examples: GrammarExample[];
    /** The confirmed rule — kept to 2–3 sentences. */
    rule: string;
  };
  /** The "aha for an English speaker" contrast. */
  contrast?: string;
  exercises: GrammarExercise[];
}

export interface GrammarModule {
  id: string;
  title: string;
  gujaratiTitle: string;
  blurb: string;
  accent: "marigold" | "magenta" | "peacock";
  order: number;
  concepts: GrammarConcept[];
}

// ── Fun facts (the "big win" payoff — delight that also teaches) ────────────

/** A short, delightful fact shown as a completion reward. Rotated so it stays a
 *  surprise, and doubles as a bite-size extra learning moment. */
export interface FunFact {
  id: string;
  emoji: string;
  /** The delightful hook, 1–2 sentences. */
  text: string;
  /** Optional bonus language nugget tied to the fact. */
  learn?: string;
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
