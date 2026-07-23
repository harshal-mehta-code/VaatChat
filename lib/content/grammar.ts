// ─────────────────────────────────────────────────────────────────────────
// Vyakaran (grammar) content — Module 1: Foundations.
//
// ⚠️ DRAFT CONTENT — pending native-speaker verification.
// Every sentence, gloss, romanization, and grammar explanation needs a native
// + light pedagogy review before this ships. Romanization uses the app's
// friendly scheme (not strict IAST). Example audio flows through the same
// generator as the rest of the app (scripts/generate-audio.ts); until those
// files exist, playback falls back to browser TTS.
//
// Design: guided discovery → tiny explicit rule → production drills, all
// SRS-tracked. See docs/VYAKARAN.md.
// ─────────────────────────────────────────────────────────────────────────

import type { GrammarModule } from "../core/types";

/** Canonical audio path for a grammar discovery example. */
export function grammarAudioPath(conceptId: string, i: number): string {
  return `/audio/grammar/${conceptId}-${i}.mp3`;
}

export const GRAMMAR_MODULES: GrammarModule[] = [
  {
    id: "g-foundations",
    title: "Foundations",
    gujaratiTitle: "પાયો",
    blurb: "The four ideas that make Gujarati sentences click into place.",
    accent: "peacock",
    order: 1,
    concepts: [
      // ── Concept 1: gender ────────────────────────────────────────────────
      {
        id: "gender",
        moduleId: "g-foundations",
        order: 1,
        title: "Words have a gender",
        blurb: "Masculine, feminine, or neuter — you can often hear it in the ending.",
        discovery: {
          intro: "Three closely-related words. Listen, and notice how only the ending changes.",
          examples: [
            { gujarati: "છોકરો", roman: "chhokro", english: "boy", highlight: "રો", note: "masculine", audio: grammarAudioPath("gender", 0) },
            { gujarati: "છોકરી", roman: "chhokri", english: "girl", highlight: "રી", note: "feminine", audio: grammarAudioPath("gender", 1) },
            { gujarati: "છોકરું", roman: "chhokru", english: "child", highlight: "રું", note: "neuter", audio: grammarAudioPath("gender", 2) },
          ],
          rule:
            "Every Gujarati noun has a gender. You can often hear it in the ending: ‑ો is usually masculine, ‑ી feminine, and ‑ું neuter. Gender isn't only about male vs. female — objects have a gender too — but it quietly decides how the words around a noun change.",
        },
        contrast:
          "English gave up grammatical gender centuries ago. Gujarati kept all three — including a neuter that many Indian languages lost. Here, it's something you'll actually hear.",
        exercises: [
          {
            id: "gender-e1",
            kind: "choose",
            prompt: "Which word is masculine?",
            options: [
              { text: "છોકરો", roman: "chhokro", correct: true },
              { text: "છોકરી", roman: "chhokri", correct: false },
              { text: "છોકરું", roman: "chhokru", correct: false },
            ],
            explain: "‑ો (chhokro) is the masculine ending.",
          },
          {
            id: "gender-e2",
            kind: "choose",
            prompt: "Which word is neuter?",
            options: [
              { text: "છોકરો", roman: "chhokro", correct: false },
              { text: "છોકરી", roman: "chhokri", correct: false },
              { text: "છોકરું", roman: "chhokru", correct: true },
            ],
            explain: "‑ું (chhokru) is the neuter ending.",
          },
          {
            id: "gender-e3",
            kind: "cloze",
            prompt: "Complete the feminine word for \"girl\".",
            frame: "છોકર___",
            frameRoman: "chhokr___",
            english: "girl (feminine)",
            options: [
              { text: "ો", roman: "‑o", correct: false },
              { text: "ી", roman: "‑i", correct: true },
              { text: "ું", roman: "‑u", correct: false },
            ],
            explain: "‑ી makes છોકરી — feminine.",
          },
        ],
      },

      // ── Concept 2: possessive agreement ──────────────────────────────────
      {
        id: "my-agrees",
        moduleId: "g-foundations",
        order: 2,
        title: "\"My\" changes shape",
        blurb: "The word for \"my\" dresses to match what you own.",
        discovery: {
          intro: "The same \"my\", three times. Notice how its ending copies the noun's gender.",
          examples: [
            { gujarati: "મારો ભાઈ", roman: "maaro bhai", english: "my brother", highlight: "મારો", note: "brother — masculine", audio: grammarAudioPath("my-agrees", 0) },
            { gujarati: "મારી બહેન", roman: "maari bahen", english: "my sister", highlight: "મારી", note: "sister — feminine", audio: grammarAudioPath("my-agrees", 1) },
            { gujarati: "મારું નામ", roman: "maaru naam", english: "my name", highlight: "મારું", note: "name — neuter", audio: grammarAudioPath("my-agrees", 2) },
          ],
          rule:
            "\"My\" isn't a single word in Gujarati — it changes to match the gender of what you own: મારો before a masculine word, મારી before a feminine word, મારું before a neuter word. It's the same ‑ો / ‑ી / ‑ું pattern you just met.",
        },
        contrast:
          "In English, \"my\" never changes — my brother, my sister, my name. In Gujarati it dresses to match the noun. Get the ending right and you instantly sound like you belong.",
        exercises: [
          {
            id: "my-agrees-e1",
            kind: "choose",
            prompt: "\"My sister\" — બહેન (sister) is feminine. Which \"my\"?",
            options: [
              { text: "મારો", roman: "maaro", correct: false },
              { text: "મારી", roman: "maari", correct: true },
              { text: "મારું", roman: "maaru", correct: false },
            ],
            explain: "Feminine noun → મારી. મારી બહેન.",
          },
          {
            id: "my-agrees-e2",
            kind: "cloze",
            prompt: "Fill the blank: \"my name\" (નામ is neuter).",
            frame: "___ નામ",
            frameRoman: "___ naam",
            english: "my name",
            options: [
              { text: "મારો", roman: "maaro", correct: false },
              { text: "મારી", roman: "maari", correct: false },
              { text: "મારું", roman: "maaru", correct: true },
            ],
            explain: "Neuter noun → મારું. મારું નામ — you already know this one!",
          },
          {
            id: "my-agrees-e3",
            kind: "choose",
            prompt: "\"My brother\" — ભાઈ (brother) is masculine. Which \"my\"?",
            options: [
              { text: "મારો", roman: "maaro", correct: true },
              { text: "મારી", roman: "maari", correct: false },
              { text: "મારું", roman: "maaru", correct: false },
            ],
            explain: "Masculine noun → મારો. મારો ભાઈ.",
          },
        ],
      },

      // ── Concept 3: word order (SOV) ──────────────────────────────────────
      {
        id: "verb-last",
        moduleId: "g-foundations",
        order: 3,
        title: "The verb goes last",
        blurb: "Gujarati saves the action for the end of the sentence.",
        discovery: {
          intro: "Read each with its literal, word-for-word English. Notice where the action word lands.",
          examples: [
            { gujarati: "હું પાણી પીઉં છું", roman: "hu paani piu chhu", english: "I drink water  (lit. I water drink)", highlight: "પીઉં છું", audio: grammarAudioPath("verb-last", 0) },
            { gujarati: "મને ચા ભાવે છે", roman: "mane chaa bhaave chhe", english: "I like tea  (lit. to-me tea is-pleasing)", highlight: "ભાવે છે", audio: grammarAudioPath("verb-last", 1) },
            { gujarati: "તે રોટલી ખાય છે", roman: "te rotli khaay chhe", english: "She eats roti  (lit. she roti eats)", highlight: "ખાય છે", audio: grammarAudioPath("verb-last", 2) },
          ],
          rule:
            "Gujarati saves the verb for the end. Where English says \"I drink water,\" Gujarati says \"I water drink\" — હું પાણી પીઉં છું. The doer comes first, then the thing, and the action lands last.",
        },
        contrast:
          "English order: I — drink — water. Gujarati order: I — water — drink. Once your ear expects the verb last, whole sentences fall into place.",
        exercises: [
          {
            id: "verb-last-e1",
            kind: "build",
            prompt: "Build: \"I drink water.\"",
            english: "I drink water",
            answer: ["હું", "પાણી", "પીઉં છું"],
            answerRoman: ["hu", "paani", "piu chhu"],
            explain: "Subject → object → verb: હું પાણી પીઉં છું.",
          },
          {
            id: "verb-last-e2",
            kind: "build",
            prompt: "Build: \"I like tea.\"",
            english: "I like tea",
            answer: ["મને", "ચા", "ભાવે છે"],
            answerRoman: ["mane", "chaa", "bhaave chhe"],
            explain: "The verb ભાવે છે comes last — મને ચા ભાવે છે.",
          },
          {
            id: "verb-last-e3",
            kind: "choose",
            prompt: "In a Gujarati sentence, where does the verb usually go?",
            options: [
              { text: "First", correct: false },
              { text: "In the middle, like English", correct: false },
              { text: "Last", correct: true },
            ],
            explain: "Gujarati is verb-final — the action lands at the end.",
          },
        ],
      },

      // ── Concept 4: register (તું vs તમે) ─────────────────────────────────
      {
        id: "tu-tame",
        moduleId: "g-foundations",
        order: 4,
        title: "Two ways to say \"you\"",
        blurb: "તું for warmth, તમે for respect — it matters with family.",
        discovery: {
          intro: "The same question — \"How are you?\" — to two different people. Notice the \"you\" and the verb.",
          examples: [
            { gujarati: "તું કેમ છે?", roman: "tu kem chhe?", english: "How are you? (to a close friend or child)", highlight: "તું", note: "casual, warm", audio: grammarAudioPath("tu-tame", 0) },
            { gujarati: "તમે કેમ છો?", roman: "tame kem cho?", english: "How are you? (to an elder)", highlight: "તમે", note: "respectful", audio: grammarAudioPath("tu-tame", 1) },
          ],
          rule:
            "Gujarati has two words for \"you.\" તું is warm and casual — for close friends, siblings, and children. તમે is respectful — for elders, in-laws, and people you don't know well. The verb even shifts with it: છે becomes છો.",
        },
        contrast:
          "English lost this — everyone is just \"you.\" In a Gujarati family it matters: તમે to Ba is basic good manners, and getting it right is how you win the in-laws over.",
        exercises: [
          {
            id: "tu-tame-e1",
            kind: "choose",
            prompt: "You're greeting Ba (grandmother). Which \"you\" shows respect?",
            options: [
              { text: "તું", roman: "tu", correct: false },
              { text: "તમે", roman: "tame", correct: true },
            ],
            explain: "Elders get તમે — respectful. તમે કેમ છો?",
          },
          {
            id: "tu-tame-e2",
            kind: "choose",
            prompt: "Chatting with your little cousin. Which \"you\" fits?",
            options: [
              { text: "તું", roman: "tu", correct: true },
              { text: "તમે", roman: "tame", correct: false },
            ],
            explain: "Close and casual → તું.",
          },
          {
            id: "tu-tame-e3",
            kind: "cloze",
            prompt: "Complete the respectful \"How are you?\"",
            frame: "___ કેમ છો?",
            frameRoman: "___ kem cho?",
            english: "How are you? (respectful)",
            options: [
              { text: "તું", roman: "tu", correct: false },
              { text: "તમે", roman: "tame", correct: true },
            ],
            explain: "તમે pairs with છો — તમે કેમ છો?",
          },
        ],
      },
    ],
  },
];

export const GRAMMAR_MODULES_BY_ID: Record<string, GrammarModule> = Object.fromEntries(
  GRAMMAR_MODULES.map((m) => [m.id, m]),
);

export function allConcepts() {
  return GRAMMAR_MODULES.flatMap((m) => m.concepts);
}

export function conceptById(id: string) {
  return allConcepts().find((c) => c.id === id);
}
