// ─────────────────────────────────────────────────────────────────────────
// More drills per grammar concept — without inventing a word of Gujarati.
//
// Every Vyakaran concept ships three authored drills, which is one sitting's
// worth: do a concept twice and you've seen everything it has. The obvious fix
// is to generate more, and the obvious way to generate them — substitute the
// learner's vocabulary into a sentence frame — is the wrong one. Gujarati
// inflects. ઘર becomes ઘરમાં but રસોડું becomes રસોડામાં, and a generator that
// doesn't know that teaches a form nobody writes. This project's rule holds
// here as it did for stroke order (docs/LEKHAN.md §3.2): where the answer needs
// a native speaker, we don't guess.
//
// So we generate by *recombination*, not by construction. A concept already
// carries two or three discovery examples that are native-verified sentences,
// each with the morpheme it's teaching marked up in `highlight`. That is drill
// material sitting in plain sight:
//
//   gap    blank out the highlighted morpheme; the distractors are the sibling
//          examples' highlights — which is exactly the contrast being taught
//   order  scramble a multi-word example into tiles
//   mean   given the English, pick the sentence out of its own siblings
//
// Every Gujarati string that reaches the learner is one that was already
// authored and reviewed. Nothing is composed, nothing is inflected, nothing is
// guessed — `npm run check:drills` asserts exactly that.
//
// Where this doesn't reach: it multiplies practice on the three sentences a
// concept teaches, and can't introduce a fourth. Generating genuinely new
// sentences needs grammatical features on the item bank (gender at minimum) and
// a native pass to confirm them — see docs/PLAN.md §7.1.
// ─────────────────────────────────────────────────────────────────────────

import type {
  GrammarConcept,
  GrammarExample,
  GrammarExercise,
  GrammarModule,
  GrammarOption,
} from "./types.ts";

/** The gap marker `cloze` frames use. */
export const BLANK = "___";

/** Minimum options for a multiple choice worth making. */
const MIN_OPTIONS = 3;
/** Below this, a "sentence" is too short for word order to be a puzzle. */
const MIN_TOKENS = 3;

const tokens = (s: string) => s.trim().split(/\s+/).filter(Boolean);

/** How many times `needle` occurs in `haystack`. */
function occurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

/**
 * Morphemes from the *other* concepts in a module.
 *
 * Some concepts teach one form with no internal contrast — all three of
 * `maa-in`'s examples highlight માં, so blanking it would offer a choice of one.
 * The contrast a learner actually needs there isn't inside the concept, it's
 * next to it: માં vs ને vs થી is the confusion, and those three sit in the same
 * module precisely because they belong together. Same for નથી against છું/છે/છો.
 *
 * These are still verified strings — just verified one concept over.
 */
export function siblingHighlights(module: GrammarModule, conceptId: string): Morpheme[] {
  const seen = new Set<string>();
  const out: Morpheme[] = [];
  for (const c of module.concepts) {
    if (c.id === conceptId) continue;
    for (const e of c.discovery.examples) {
      if (!e.highlight || seen.has(e.highlight)) continue;
      seen.add(e.highlight);
      out.push({ text: e.highlight, standalone: isStandalone(e) });
    }
  }
  return out;
}

/** A highlighted morpheme, and whether it stands as its own word. */
export interface Morpheme {
  text: string;
  standalone: boolean;
}

/**
 * Is the highlight a whole word (છે, તું) rather than an ending (નું, રો)?
 *
 * It decides what makes a fair distractor. Offering the suffix નું as an
 * alternative to the pronoun આ isn't a choice anyone has to think about — it's
 * the wrong *shape*, and the learner rules it out without engaging with the
 * grammar. Matching shape keeps the question about meaning.
 */
function isStandalone(example: GrammarExample): boolean {
  if (!example.highlight) return false;
  return tokens(example.gujarati).includes(example.highlight.trim().split(/\s+/)[0]);
}

/**
 * Extra drills for a concept, derived from its own verified examples.
 *
 * Deterministic and side-effect free: the same concept always yields the same
 * set, with stable ids. Which of them a given sitting uses is the session's
 * business (components/GrammarRunner.tsx), not this function's.
 */
export function derivedDrills(
  concept: GrammarConcept,
  siblings: readonly Morpheme[] = [],
): GrammarExercise[] {
  const examples = concept.discovery.examples;
  const out: GrammarExercise[] = [];

  // ── gap: blank the morpheme, contrast against its siblings ──────────────
  //
  // This is the highest-value family, because the distractors aren't
  // plausible-looking noise — they're the *other* forms of the same pattern.
  // Getting it wrong means confusing masculine with neuter, which is precisely
  // the mistake the concept exists to fix.
  examples.forEach((example, i) => {
    const mark = example.highlight;
    if (!mark) return;
    // One unambiguous gap only. A morpheme appearing twice would leave the
    // learner guessing which one we meant.
    if (occurrences(example.gujarati, mark) !== 1) return;

    // Contrast from inside the concept first — those are the forms it's
    // explicitly teaching apart. Only reach next door when there aren't enough,
    // and prefer morphemes of the same shape when we do.
    const rivals = distinctHighlights(examples, mark);
    const wantStandalone = isStandalone(example);
    const nextDoor = [
      ...siblings.filter((m) => m.standalone === wantStandalone),
      ...siblings.filter((m) => m.standalone !== wantStandalone),
    ];
    for (const sibling of nextDoor) {
      if (rivals.length >= MIN_OPTIONS - 1) break;
      if (sibling.text !== mark && !rivals.includes(sibling.text)) rivals.push(sibling.text);
    }
    if (rivals.length < MIN_OPTIONS - 1) return;

    const options: GrammarOption[] = [
      { text: mark, correct: true },
      ...rivals.map((text) => ({ text, correct: false })),
    ];

    out.push({
      id: `${concept.id}-d-gap-${i}`,
      kind: "cloze",
      prompt: "Which piece completes it?",
      frame: example.gujarati.replace(mark, BLANK),
      // No `frameRoman` on purpose: blanking the Gujarati tells us nothing
      // about where the gap falls in the romanization, and a roman line that
      // didn't match the gap would be worse than none.
      english: example.english,
      options,
      explain: explainFor(example),
    });
  });

  // ── order: rebuild a sentence from tiles ────────────────────────────────
  examples.forEach((example, i) => {
    const guj = tokens(example.gujarati);
    const roman = tokens(example.roman);
    // Tiles are paired by index, so a mismatch would put the wrong roman under
    // a word. Skip rather than mislabel.
    if (guj.length < MIN_TOKENS || guj.length !== roman.length) return;
    // Repeated words make "correct order" ambiguous to grade.
    if (new Set(guj).size !== guj.length) return;

    out.push({
      id: `${concept.id}-d-order-${i}`,
      kind: "build",
      prompt: "Put it in the right order.",
      english: example.english,
      answer: guj,
      answerRoman: roman,
      explain: explainFor(example),
    });
  });

  // ── mean: which of these says it? ───────────────────────────────────────
  const distinct = examples.filter(
    (e, i) =>
      examples.findIndex((o) => o.english === e.english) === i &&
      examples.findIndex((o) => o.gujarati === e.gujarati) === i,
  );
  if (distinct.length >= MIN_OPTIONS) {
    distinct.forEach((example, i) => {
      out.push({
        id: `${concept.id}-d-mean-${i}`,
        kind: "choose",
        prompt: `Which one means “${example.english}”?`,
        options: distinct.map((o) => ({
          text: o.gujarati,
          roman: o.roman,
          correct: o.gujarati === example.gujarati,
        })),
        explain: explainFor(example),
      });
    });
  }

  return out;
}

/** Sibling highlights that actually contrast with this one. */
function distinctHighlights(examples: readonly GrammarExample[], mark: string): string[] {
  const seen = new Set<string>([mark]);
  const out: string[] = [];
  for (const e of examples) {
    if (!e.highlight || seen.has(e.highlight)) continue;
    seen.add(e.highlight);
    out.push(e.highlight);
  }
  return out;
}

/** The example itself is the explanation — it's what was verified. */
function explainFor(example: GrammarExample): string {
  const note = example.note ? ` (${example.note})` : "";
  return `${example.gujarati} — ${example.english}${note}`;
}

/**
 * Every Gujarati string a concept's derived drills are allowed to show: the
 * examples themselves, their highlighted morphemes, and their words. The guard
 * checks generated drills against this, so "we never invent Gujarati" is a
 * property the build enforces rather than a promise in a comment.
 */
export function verifiedStrings(
  concept: GrammarConcept,
  siblings: readonly Morpheme[] = [],
): Set<string> {
  const out = new Set<string>(siblings.map((m) => m.text));
  for (const e of concept.discovery.examples) {
    out.add(e.gujarati);
    if (e.highlight) out.add(e.highlight);
    for (const t of tokens(e.gujarati)) out.add(t);
  }
  return out;
}
