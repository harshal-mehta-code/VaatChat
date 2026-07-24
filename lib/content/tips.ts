// ─────────────────────────────────────────────────────────────────────────
// Grammar tips interleaved into the vocab path — "focus on form".
//
// ✅ Native-verified by the owner (raised in Gujarat) on 2026-07-24.
//
// The research pillar (docs/VYAKARAN.md §1): grammar embedded in meaningful,
// already-understood sentences beats abstract paradigm drills. So instead of
// sending a conversation-first learner to the grammar pillar, we drop ONE
// short tip into a themed lesson at the moment its pattern actually shows up
// in the words they just met — then offer a door into the full concept.
//
// Deliberately sparse: only lessons whose own vocabulary *demonstrates* the
// pattern get a tip. A tip on every lesson would be noise, and the point is
// that it feels like a timely observation, not a syllabus.
//
// Examples reuse existing grammar-example audio (same sentence → same clip),
// so this file adds no new audio. Paths are written out literally rather than
// imported from grammar.ts: content files are loaded by the node scripts
// (check-audio, generate-audio) which need explicit .ts specifiers, so a
// runtime cross-content import would break them. `npm run check:audio` covers
// these paths, so a mismatch fails loudly instead of silently falling back.
// ─────────────────────────────────────────────────────────────────────────

export interface GrammarTip {
  id: string;
  /** The vocab lesson this tip belongs to. */
  lessonId: string;
  /** The full Vyakaran concept this previews — the "learn it properly" door. */
  conceptId: string;
  /** Short headline, e.g. `"Two ways to say \"you\""`. */
  title: string;
  /** 1–2 sentences, phrased around the words the learner just met. */
  body: string;
  /** One worked example, drawn from this lesson's own vocabulary. */
  example: { gujarati: string; roman: string; english: string; audio?: string };
}

export const GRAMMAR_TIPS: GrammarTip[] = [
  {
    id: "tip-u1-l1",
    lessonId: "u1-l1",
    conceptId: "tu-tame",
    title: 'You just used the *respectful* "you"',
    body: "કેમ છો? is the polite form — the one you use with elders, in-laws, and anyone you don't know well. With a close friend or a child you'd say કેમ છે? instead.",
    example: {
      gujarati: "તમે કેમ છો?",
      roman: "tame kem cho?",
      english: "How are you? (respectful)",
      audio: "/audio/grammar/tu-tame-1.mp3",
    },
  },
  {
    id: "tip-u1-l3",
    lessonId: "u1-l3",
    conceptId: "my-agrees",
    title: '"My" changes shape for each of them',
    body: 'Now that you can name your family, notice that "my" isn\'t one word: it copies the gender of the person. મારો ભાઈ (brother), મારી બહેન (sister), મારું નામ (name).',
    example: {
      gujarati: "મારી બહેન",
      roman: "maari bahen",
      english: "my sister",
      audio: "/audio/grammar/my-agrees-1.mp3",
    },
  },
  {
    id: "tip-u2-l2",
    lessonId: "u2-l2",
    conceptId: "verb-last",
    title: "The action word waits until the end",
    body: 'Look at મને ચા જોઈએ છે again — Gujarati saves the verb for last. Word-for-word it\'s "to-me tea is-wanted," not "I want tea."',
    example: {
      gujarati: "મને ચા ભાવે છે",
      roman: "mane chaa bhaave chhe",
      english: "I like tea  (lit. to-me tea is-pleasing)",
      audio: "/audio/grammar/verb-last-1.mp3",
    },
  },
  {
    id: "tip-u3-l1",
    lessonId: "u3-l1",
    conceptId: "maa-in",
    title: '"In" hangs off the back of the word',
    body: 'To say you\'re *in* one of these rooms, Gujarati attaches માં to the end instead of putting a word in front: ઘર becomes ઘરમાં ("in the house").',
    example: {
      gujarati: "ઘરમાં",
      roman: "gharmaa",
      english: "in the house",
      audio: "/audio/grammar/maa-in-0.mp3",
    },
  },
  {
    id: "tip-u5-l2",
    lessonId: "u5-l2",
    conceptId: "question-words",
    title: "Asking costs you nothing extra",
    body: "કેટલું થયું? works like every Gujarati question: you keep the sentence standing and just slot the question word in. No \"do,\" no reshuffling — and છે still ends it.",
    example: {
      gujarati: "આ શું છે?",
      roman: "aa shu chhe?",
      english: "What is this?",
      audio: "/audio/grammar/question-words-0.mp3",
    },
  },
  {
    id: "tip-u5-l3",
    lessonId: "u5-l3",
    conceptId: "ne-to",
    title: 'Add ને to say who gets it',
    body: 'આપો means "please give." To say who you\'re giving it *to*, tack ને onto that person — બા becomes બાને ("to grandmother").',
    example: {
      gujarati: "બાને આપો",
      roman: "baane aapo",
      english: "Give (it) to grandmother",
      audio: "/audio/grammar/ne-to-0.mp3",
    },
  },
];

/** The tip for a lesson, if it has one. Most lessons don't — that's intended. */
export function tipForLesson(lessonId: string): GrammarTip | undefined {
  return GRAMMAR_TIPS.find((t) => t.lessonId === lessonId);
}
