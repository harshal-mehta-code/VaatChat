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
        hook: {
          question:
            "છોકરો is \"boy\" and છોકરી is \"girl.\" So what do you think \"child\" (neither one) ends with?",
          guesses: [
            { text: "છોકરો", roman: "‑o" },
            { text: "છોકરી", roman: "‑i" },
            { text: "છોકરું", roman: "‑u" },
          ],
          answerIndex: 2,
          reveal: "Gujarati has a third gender — neuter — with its own ending. Let's see the pattern.",
        },
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
        hook: {
          question:
            "For \"my brother\" you say મારો ભાઈ. Since બહેન (\"sister\") is feminine, how do you think \"my\" changes for \"my sister\"?",
          guesses: [
            { text: "મારો", roman: "maaro" },
            { text: "મારી", roman: "maari" },
            { text: "It stays મારો", roman: "no change" },
          ],
          answerIndex: 1,
          reveal: "\"My\" actually shifts to match the noun's gender. Here's the full pattern.",
        },
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
        hook: {
          question:
            "In English you say \"I drink water\" — verb in the middle. Where do you think Gujarati puts the verb \"drink\"?",
          guesses: [
            { text: "In the middle, like English" },
            { text: "Right at the end" },
            { text: "At the very start" },
          ],
          answerIndex: 1,
          reveal: "Gujarati is verb-final — the action lands last. Let's feel it.",
        },
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
        hook: {
          question:
            "You greet a close friend with તું (\"you\"). Greeting your grandmother, do you think you'd use the same word?",
          guesses: [
            { text: "Yes — same word" },
            { text: "No — a more respectful one" },
          ],
          answerIndex: 1,
          reveal: "Elders get a respectful \"you.\" Here's how it works.",
        },
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Module 2 — Naming & having: this/that, possession, question words.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "g-naming",
    title: "Naming & having",
    gujaratiTitle: "નામ અને માલિકી",
    blurb: "Point at things, say whose they are, and ask what and who.",
    accent: "marigold",
    order: 2,
    concepts: [
      // ── Concept 1: આ / તે (this / that) ──────────────────────────────────
      {
        id: "aa-te",
        moduleId: "g-naming",
        order: 1,
        title: "This and that",
        blurb: "આ points near, તે points away — and the verb still lands last.",
        hook: {
          question:
            "You know છે means \"is\" and ચા means \"tea.\" If આ means \"this,\" how would you say \"This is tea\"?",
          guesses: [
            { text: "આ ચા છે", roman: "aa chaa chhe" },
            { text: "ચા આ છે", roman: "chaa aa chhe" },
            { text: "છે ચા આ", roman: "chhe chaa aa" },
          ],
          answerIndex: 0,
          reveal: "Pointer first, then the thing, then છે at the end. Let's see it.",
        },
        discovery: {
          intro: "Two little pointing words. Notice which one is near and which is far — and where છે sits.",
          examples: [
            { gujarati: "આ ચા છે", roman: "aa chaa chhe", english: "This is tea", highlight: "આ", note: "near — \"this\"", audio: grammarAudioPath("aa-te", 0) },
            { gujarati: "તે ઘર છે", roman: "te ghar chhe", english: "That is a house", highlight: "તે", note: "away — \"that\"", audio: grammarAudioPath("aa-te", 1) },
            { gujarati: "આ શું છે?", roman: "aa shu chhe?", english: "What is this?", highlight: "આ", audio: grammarAudioPath("aa-te", 2) },
          ],
          rule:
            "આ means \"this\" (something near) and તે means \"that\" (something further away). Both go before the noun, and the sentence still ends with છે — આ ચા છે, તે ઘર છે.",
        },
        contrast:
          "English: \"this / that\" then the noun, same as Gujarati — the surprise is that છે (\"is\") waits patiently at the very end.",
        exercises: [
          {
            id: "aa-te-e1",
            kind: "choose",
            prompt: "Which word means \"this\" (something near you)?",
            options: [
              { text: "આ", roman: "aa", correct: true },
              { text: "તે", roman: "te", correct: false },
            ],
            explain: "આ = this (near). તે = that (far).",
          },
          {
            id: "aa-te-e2",
            kind: "build",
            prompt: "Build: \"This is a house.\"",
            english: "This is a house",
            answer: ["આ", "ઘર", "છે"],
            answerRoman: ["aa", "ghar", "chhe"],
            explain: "Pointer → noun → છે: આ ઘર છે.",
          },
          {
            id: "aa-te-e3",
            kind: "cloze",
            prompt: "Complete: \"That is grandmother.\"",
            frame: "___ બા છે",
            frameRoman: "___ ba chhe",
            english: "That is grandmother",
            options: [
              { text: "આ", roman: "aa", correct: false },
              { text: "તે", roman: "te", correct: true },
            ],
            explain: "Pointing away → તે. તે બા છે.",
          },
        ],
      },

      // ── Concept 2: possession નો / ની / નું ──────────────────────────────
      {
        id: "poss-agrees",
        moduleId: "g-naming",
        order: 2,
        title: "Saying whose it is",
        blurb: "\"'s\" in Gujarati agrees with the thing owned, not the owner.",
        hook: {
          question:
            "You've met મારો ભાઈ (my brother) and મારી બહેન (my sister). To say \"grandmother's tea\" — ચા is feminine — which ending do you expect on \"grandmother's\"?",
          guesses: [
            { text: "નો", roman: "‑no" },
            { text: "ની", roman: "‑ni" },
            { text: "નું", roman: "‑nu" },
          ],
          answerIndex: 1,
          reveal: "The \"'s\" copies the gender of what's owned — exactly like મારો/મારી/મારું.",
        },
        discovery: {
          intro: "The same owner, three things. Notice how the \"'s\" ending matches the thing, not the owner.",
          examples: [
            { gujarati: "દાદાનું ઘર", roman: "daadaanu ghar", english: "grandfather's house", highlight: "નું", note: "ઘર — neuter", audio: grammarAudioPath("poss-agrees", 0) },
            { gujarati: "બાની ચા", roman: "baani chaa", english: "grandmother's tea", highlight: "ની", note: "ચા — feminine", audio: grammarAudioPath("poss-agrees", 1) },
            { gujarati: "ભાઈનો ઓરડો", roman: "bhaino ordo", english: "brother's room", highlight: "નો", note: "ઓરડો — masculine", audio: grammarAudioPath("poss-agrees", 2) },
          ],
          rule:
            "To say \"X's,\" add નો / ની / નું onto the owner — and the ending matches the gender of the thing owned, the same ‑ો/‑ી/‑ું you already know: દાદાનું ઘર, બાની ચા, ભાઈનો ઓરડો.",
        },
        contrast:
          "English adds 's to the owner and stops — \"grandmother's\" is fixed. Gujarati's \"'s\" also bends to match whatever is owned.",
        exercises: [
          {
            id: "poss-agrees-e1",
            kind: "cloze",
            prompt: "\"Grandfather's house\" — ઘર is neuter. Fill the blank.",
            frame: "દાદા___ ઘર",
            frameRoman: "daadaa___ ghar",
            english: "grandfather's house",
            options: [
              { text: "નો", roman: "‑no", correct: false },
              { text: "ની", roman: "‑ni", correct: false },
              { text: "નું", roman: "‑nu", correct: true },
            ],
            explain: "Neuter thing owned → નું. દાદાનું ઘર.",
          },
          {
            id: "poss-agrees-e2",
            kind: "choose",
            prompt: "\"Grandmother's tea\" — ચા is feminine. Which ending?",
            options: [
              { text: "બાનો", roman: "baano", correct: false },
              { text: "બાની", roman: "baani", correct: true },
              { text: "બાનું", roman: "baanu", correct: false },
            ],
            explain: "Feminine thing owned → ની. બાની ચા.",
          },
          {
            id: "poss-agrees-e3",
            kind: "cloze",
            prompt: "\"Brother's room\" — ઓરડો is masculine. Fill the blank.",
            frame: "ભાઈ___ ઓરડો",
            frameRoman: "bhai___ ordo",
            english: "brother's room",
            options: [
              { text: "નો", roman: "‑no", correct: true },
              { text: "ની", roman: "‑ni", correct: false },
              { text: "નું", roman: "‑nu", correct: false },
            ],
            explain: "Masculine thing owned → નો. ભાઈનો ઓરડો.",
          },
        ],
      },

      // ── Concept 3: question words શું / કોણ / ક્યાં ──────────────────────
      {
        id: "question-words",
        moduleId: "g-naming",
        order: 3,
        title: "What, who, where",
        blurb: "Drop the question word in — no \"do\" or \"is\" reshuffle needed.",
        hook: {
          question:
            "English turns \"That is Ba\" into \"Who is that?\" — flipping the words around. How much do you think Gujarati reshuffles?",
          guesses: [
            { text: "It flips the order too" },
            { text: "It barely moves — just swap in the question word" },
          ],
          answerIndex: 1,
          reveal: "Gujarati keeps the frame and slots the question word into place. Watch.",
        },
        discovery: {
          intro: "Three questions. Notice that each keeps છે at the end — only the question word changes.",
          examples: [
            { gujarati: "આ શું છે?", roman: "aa shu chhe?", english: "What is this?", highlight: "શું", note: "what", audio: grammarAudioPath("question-words", 0) },
            { gujarati: "તે કોણ છે?", roman: "te kon chhe?", english: "Who is that?", highlight: "કોણ", note: "who", audio: grammarAudioPath("question-words", 1) },
            { gujarati: "બા ક્યાં છે?", roman: "ba kyaa chhe?", english: "Where is grandmother?", highlight: "ક્યાં", note: "where", audio: grammarAudioPath("question-words", 2) },
          ],
          rule:
            "શું (what), કોણ (who), and ક્યાં (where) simply take the place of the answer in a normal sentence, and છે still ends it. No helper verb, no reshuffling.",
        },
        contrast:
          "English rebuilds the sentence to ask (\"Where is Ba?\"). Gujarati leaves it standing — બા ક્યાં છે? is just \"Ba where is?\"",
        exercises: [
          {
            id: "question-words-e1",
            kind: "choose",
            prompt: "Which word means \"where\"?",
            options: [
              { text: "શું", roman: "shu", correct: false },
              { text: "કોણ", roman: "kon", correct: false },
              { text: "ક્યાં", roman: "kyaa", correct: true },
            ],
            explain: "ક્યાં = where. શું = what, કોણ = who.",
          },
          {
            id: "question-words-e2",
            kind: "cloze",
            prompt: "Complete: \"What is this?\"",
            frame: "આ ___ છે?",
            frameRoman: "aa ___ chhe?",
            english: "What is this?",
            options: [
              { text: "શું", roman: "shu", correct: true },
              { text: "કોણ", roman: "kon", correct: false },
              { text: "ક્યાં", roman: "kyaa", correct: false },
            ],
            explain: "Asking about a thing → શું. આ શું છે?",
          },
          {
            id: "question-words-e3",
            kind: "build",
            prompt: "Build: \"Who is that?\"",
            english: "Who is that?",
            answer: ["તે", "કોણ", "છે"],
            answerRoman: ["te", "kon", "chhe"],
            explain: "Same frame, question word slotted in: તે કોણ છે?",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Module 3 — Doing things (present): present tense, negation, yes/no questions.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "g-present",
    title: "Doing things",
    gujaratiTitle: "ક્રિયા (વર્તમાન)",
    blurb: "Talk about what happens now — do it, deny it, and ask about it.",
    accent: "magenta",
    order: 3,
    concepts: [
      // ── Concept 1: present tense helper છું/છે/છો ────────────────────────
      {
        id: "present-be",
        moduleId: "g-present",
        order: 1,
        title: "Actions in the present",
        blurb: "A verb plus a છું/છે/છો helper that matches who's doing it.",
        hook: {
          question:
            "કેમ છો? uses છો — a respectful \"you.\" For \"I\" (હું), which helper do you expect?",
          guesses: [
            { text: "છું", roman: "chhu" },
            { text: "છે", roman: "chhe" },
            { text: "છો", roman: "cho" },
          ],
          answerIndex: 0,
          reveal: "The little helper changes with the doer — and it's the same છું/છે/છો family.",
        },
        discovery: {
          intro: "\"Eat\" for three different people. Notice the helper word at the end shift with who's doing it.",
          examples: [
            { gujarati: "હું ખાઉં છું", roman: "hu khau chhu", english: "I eat", highlight: "છું", note: "I → છું", audio: grammarAudioPath("present-be", 0) },
            { gujarati: "તે ખાય છે", roman: "te khaay chhe", english: "He/she eats", highlight: "છે", note: "he/she → છે", audio: grammarAudioPath("present-be", 1) },
            { gujarati: "તમે ખાવ છો", roman: "tame khaav cho", english: "You eat (respectful)", highlight: "છો", note: "you (resp.) → છો", audio: grammarAudioPath("present-be", 2) },
          ],
          rule:
            "The present tense is a verb form plus a \"to be\" helper — છું for હું (I), છે for તે (he/she), છો for તમે (you, respectful). It's the very same છું/છે/છો you met in કેમ છો?",
        },
        contrast:
          "English barely marks the person (I eat, he eats). Gujarati changes the verb and adds a matching helper — but you already know the helper from \"how are you?\"",
        exercises: [
          {
            id: "present-be-e1",
            kind: "cloze",
            prompt: "Complete: \"I eat.\"",
            frame: "હું ખાઉં ___",
            frameRoman: "hu khau ___",
            english: "I eat",
            options: [
              { text: "છું", roman: "chhu", correct: true },
              { text: "છે", roman: "chhe", correct: false },
              { text: "છો", roman: "cho", correct: false },
            ],
            explain: "હું → છું. હું ખાઉં છું.",
          },
          {
            id: "present-be-e2",
            kind: "choose",
            prompt: "For તે (he/she), which helper is right?",
            options: [
              { text: "છું", roman: "chhu", correct: false },
              { text: "છે", roman: "chhe", correct: true },
              { text: "છો", roman: "cho", correct: false },
            ],
            explain: "તે → છે. તે ખાય છે.",
          },
          {
            id: "present-be-e3",
            kind: "cloze",
            prompt: "Respectful \"you eat\" — which helper?",
            frame: "તમે ખાવ ___",
            frameRoman: "tame khaav ___",
            english: "You eat (respectful)",
            options: [
              { text: "છું", roman: "chhu", correct: false },
              { text: "છે", roman: "chhe", correct: false },
              { text: "છો", roman: "cho", correct: true },
            ],
            explain: "તમે → છો, just like કેમ છો?",
          },
        ],
      },

      // ── Concept 2: negation નથી ──────────────────────────────────────────
      {
        id: "nathi",
        moduleId: "g-present",
        order: 2,
        title: "Saying \"not\"",
        blurb: "One tidy word — નથી — covers am not, is not, are not.",
        hook: {
          question:
            "English needs a whole crew to say no: \"is not,\" \"am not,\" \"are not.\" How many words do you think Gujarati uses for all of them?",
          guesses: [
            { text: "One word for all" },
            { text: "A different word for each" },
          ],
          answerIndex: 0,
          reveal: "Just one — નથી. It quietly replaces the છે/છું helper.",
        },
        discovery: {
          intro: "Three negatives, three subjects — but watch the same word do all the work.",
          examples: [
            { gujarati: "આ પાણી નથી", roman: "aa paani nathi", english: "This is not water", highlight: "નથી", audio: grammarAudioPath("nathi", 0) },
            { gujarati: "મને ભૂખ નથી", roman: "mane bhookh nathi", english: "I'm not hungry", highlight: "નથી", note: "lit. to-me hunger is-not", audio: grammarAudioPath("nathi", 1) },
            { gujarati: "તે ઘરે નથી", roman: "te ghare nathi", english: "He/she isn't home", highlight: "નથી", audio: grammarAudioPath("nathi", 2) },
          ],
          rule:
            "To make a present sentence negative, use નથી — a single word covering \"am not / is not / are not.\" It simply takes the place of the છે/છું helper: આ પાણી છે → આ પાણી નથી.",
        },
        contrast:
          "English juggles \"is not / am not / are not.\" Gujarati keeps one calm નથી for every one of them.",
        exercises: [
          {
            id: "nathi-e1",
            kind: "choose",
            prompt: "Which word makes a present sentence negative?",
            options: [
              { text: "નથી", roman: "nathi", correct: true },
              { text: "છે", roman: "chhe", correct: false },
              { text: "ના", roman: "na", correct: false },
            ],
            explain: "નથी = is/am/are not. (ના is just \"no\" as an answer.)",
          },
          {
            id: "nathi-e2",
            kind: "build",
            prompt: "Build: \"This is not water.\"",
            english: "This is not water",
            answer: ["આ", "પાણી", "નથી"],
            answerRoman: ["aa", "paani", "nathi"],
            explain: "Swap છે for નથી: આ પાણી નથી.",
          },
          {
            id: "nathi-e3",
            kind: "cloze",
            prompt: "Complete: \"I'm not hungry.\"",
            frame: "મને ભૂખ ___",
            frameRoman: "mane bhookh ___",
            english: "I'm not hungry",
            options: [
              { text: "છે", roman: "chhe", correct: false },
              { text: "નથી", roman: "nathi", correct: true },
            ],
            explain: "મને ભૂખ નથી — hunger is-not to-me.",
          },
        ],
      },

      // ── Concept 3: yes/no questions ──────────────────────────────────────
      {
        id: "yesno-q",
        moduleId: "g-present",
        order: 3,
        title: "Asking yes-or-no",
        blurb: "Keep the words as they are — your voice does the asking.",
        hook: {
          question:
            "\"You eat\" → \"Do you eat?\" — English adds \"do\" and flips it. What do you think Gujarati changes?",
          guesses: [
            { text: "It adds a helper and reorders" },
            { text: "Nothing — just the tone of voice" },
          ],
          answerIndex: 1,
          reveal: "A statement becomes a question with a rising voice — the words stay put.",
        },
        discovery: {
          intro: "Each of these is a statement said as a question. Notice: nothing moves — only the \"?\" (a rising tone).",
          examples: [
            { gujarati: "તમે ગુજરાતી બોલો છો?", roman: "tame gujarati bolo cho?", english: "Do you speak Gujarati?", audio: grammarAudioPath("yesno-q", 0) },
            { gujarati: "આ તમારું ઘર છે?", roman: "aa tamaru ghar chhe?", english: "Is this your house?", audio: grammarAudioPath("yesno-q", 1) },
            { gujarati: "જમ્યા?", roman: "jamya?", english: "Have you eaten?", note: "you already know this one!", audio: grammarAudioPath("yesno-q", 2) },
          ],
          rule:
            "To ask a yes/no question, leave the sentence exactly as it is and just raise your voice at the end. No \"do,\" no reordering — તમે ગુજરાતી બોલો છો? is the statement said as a question.",
        },
        contrast:
          "English rebuilds: \"You speak\" → \"Do you speak?\" Gujarati keeps the words still and lets your tone ask.",
        exercises: [
          {
            id: "yesno-q-e1",
            kind: "choose",
            prompt: "How do you turn a Gujarati statement into a yes/no question?",
            options: [
              { text: "Keep the words, raise your voice", correct: true },
              { text: "Add a \"do\" word at the front", correct: false },
              { text: "Move the verb to the front", correct: false },
            ],
            explain: "Same words, rising intonation — that's the whole trick.",
          },
          {
            id: "yesno-q-e2",
            kind: "build",
            prompt: "Build the question: \"Is this your house?\"",
            english: "Is this your house?",
            answer: ["આ", "તમારું", "ઘર", "છે"],
            answerRoman: ["aa", "tamaru", "ghar", "chhe"],
            explain: "Statement order stays — just ask it: આ તમારું ઘર છે?",
          },
          {
            id: "yesno-q-e3",
            kind: "choose",
            prompt: "Which of these is already a yes/no question you know?",
            options: [
              { text: "જમ્યા?", roman: "jamya?", correct: true },
              { text: "આભાર", roman: "aabhaar", correct: false },
              { text: "મજામાં", roman: "majaama", correct: false },
            ],
            explain: "જમ્યા? — \"have you eaten?\" — a yes/no question by tone alone.",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Module 4 — Where & how: postpositions માં / ને / થી (they ride *after*).
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "g-postpositions",
    title: "Where & how",
    gujaratiTitle: "નામયોગી (પછી આવે)",
    blurb: "The little words English puts before a noun — Gujarati hangs after it.",
    accent: "peacock",
    order: 4,
    concepts: [
      // ── Concept 1: માં (in) ──────────────────────────────────────────────
      {
        id: "maa-in",
        moduleId: "g-postpositions",
        order: 1,
        title: "\"In\" comes after",
        blurb: "ઘર + માં = ઘરમાં — the \"in\" attaches to the end of the noun.",
        hook: {
          question:
            "English says \"in the market\" — \"in\" first. Gujarati has બજાર (market) and માં (in). What order do you expect?",
          guesses: [
            { text: "માં બજાર", roman: "maa bajaar" },
            { text: "બજારમાં", roman: "bajaarmaa" },
          ],
          answerIndex: 1,
          reveal: "It rides after the noun — a postposition, not a preposition.",
        },
        discovery: {
          intro: "Watch માં latch onto the end of each noun to mean \"in\" or \"on.\"",
          examples: [
            { gujarati: "ઘરમાં", roman: "gharmaa", english: "in the house", highlight: "માં", audio: grammarAudioPath("maa-in", 0) },
            { gujarati: "થાળીમાં", roman: "thaalimaa", english: "on the thali", highlight: "માં", audio: grammarAudioPath("maa-in", 1) },
            { gujarati: "બજારમાં", roman: "bajaarmaa", english: "in the market", highlight: "માં", audio: grammarAudioPath("maa-in", 2) },
          ],
          rule:
            "Where English puts \"in\" before the noun, Gujarati attaches માં after it: ઘર + માં = ઘરમાં. These little words come after, so they're called postpositions.",
        },
        contrast:
          "English: in the house. Gujarati: house-in (ઘરમાં). The idea is the same; it just hangs off the back of the word.",
        exercises: [
          {
            id: "maa-in-e1",
            kind: "choose",
            prompt: "How do you say \"in the house\"?",
            options: [
              { text: "ઘરમાં", roman: "gharmaa", correct: true },
              { text: "માંઘર", roman: "maaghar", correct: false },
            ],
            explain: "માં comes after: ઘર + માં = ઘરમાં.",
          },
          {
            id: "maa-in-e2",
            kind: "cloze",
            prompt: "Complete \"in the market\" (બજાર = market).",
            frame: "બજાર___",
            frameRoman: "bajaar___",
            english: "in the market",
            options: [
              { text: "માં", roman: "‑maa", correct: true },
              { text: "થી", roman: "‑thi", correct: false },
            ],
            explain: "બજારમાં — in the market.",
          },
          {
            id: "maa-in-e3",
            kind: "choose",
            prompt: "Gujarati's માં, ને, થી come ___ the noun.",
            options: [
              { text: "after", correct: true },
              { text: "before", correct: false },
            ],
            explain: "They're postpositions — they follow the noun.",
          },
        ],
      },

      // ── Concept 2: ને (to) ───────────────────────────────────────────────
      {
        id: "ne-to",
        moduleId: "g-postpositions",
        order: 2,
        title: "\"To\" someone",
        blurb: "ને marks the receiver — and fuses onto pronouns (હું → મને).",
        hook: {
          question:
            "You already say મને ચા ભાવે છે (\"I like tea,\" lit. to-me tea is-pleasing). That મ‑ને hides a \"to.\" Which little word do you think means \"to\"?",
          guesses: [
            { text: "ને", roman: "ne" },
            { text: "માં", roman: "maa" },
            { text: "થી", roman: "thi" },
          ],
          answerIndex: 0,
          reveal: "ને is \"to\" — and with pronouns it squeezes right in.",
        },
        discovery: {
          intro: "ને tags onto whoever receives the action — \"to\" that person.",
          examples: [
            { gujarati: "બાને આપો", roman: "baane aapo", english: "Give (it) to grandmother", highlight: "ને", audio: grammarAudioPath("ne-to", 0) },
            { gujarati: "ભાઈને કહો", roman: "bhaine kaho", english: "Tell (it) to brother", highlight: "ને", audio: grammarAudioPath("ne-to", 1) },
            { gujarati: "મને", roman: "mane", english: "to me", highlight: "ને", note: "હું + ને, fused", audio: grammarAudioPath("ne-to", 2) },
          ],
          rule:
            "ને after a person means \"to\" them — the receiver of an action: બાને આપો (give to grandmother). With pronouns it fuses: હું + ને becomes મને (\"to me\"), which you already know.",
        },
        contrast:
          "English keeps \"to\" as a separate word out front (\"to me,\" \"to Ba\"). Gujarati tacks ને on the back — and with \"I\" it merges into મને.",
        exercises: [
          {
            id: "ne-to-e1",
            kind: "cloze",
            prompt: "Complete \"to grandmother\" (બા = grandmother).",
            frame: "બા___",
            frameRoman: "baa___",
            english: "to grandmother",
            options: [
              { text: "ને", roman: "‑ne", correct: true },
              { text: "માં", roman: "‑maa", correct: false },
            ],
            explain: "બાને — to grandmother.",
          },
          {
            id: "ne-to-e2",
            kind: "choose",
            prompt: "\"To me\" fuses હું + ને into which word?",
            options: [
              { text: "મને", roman: "mane", correct: true },
              { text: "હુંને", roman: "hune", correct: false },
            ],
            explain: "હું + ને → મને, as in મને ચા ભાવે છે.",
          },
          {
            id: "ne-to-e3",
            kind: "build",
            prompt: "Build: \"Give (it) to grandmother.\"",
            english: "Give it to grandmother",
            answer: ["બાને", "આપો"],
            answerRoman: ["baane", "aapo"],
            explain: "Receiver + ને, then the verb last: બાને આપો.",
          },
        ],
      },

      // ── Concept 3: થી (from / by) ────────────────────────────────────────
      {
        id: "thi-from",
        moduleId: "g-postpositions",
        order: 3,
        title: "\"From\" and \"by\"",
        blurb: "One થી covers a starting point and a means — even on ક્યાં.",
        hook: {
          question:
            "માં means \"in\" and rides after the noun. English \"from home\" — where do you think Gujarati's \"from\" (થી) goes?",
          guesses: [
            { text: "થી ઘર", roman: "thi ghar" },
            { text: "ઘરથી", roman: "gharthi" },
          ],
          answerIndex: 1,
          reveal: "After the noun, like its siblings — ઘરથી. And it clings to question words too.",
        },
        discovery: {
          intro: "થી after a noun means \"from\" (a starting point) or \"by\" (a means). Notice it works on ક્યાં too.",
          examples: [
            { gujarati: "ઘરથી", roman: "gharthi", english: "from home", highlight: "થી", audio: grammarAudioPath("thi-from", 0) },
            { gujarati: "બજારથી", roman: "bajaarthi", english: "from the market", highlight: "થી", audio: grammarAudioPath("thi-from", 1) },
            { gujarati: "ક્યાંથી?", roman: "kyaanthi?", english: "from where?", highlight: "થી", audio: grammarAudioPath("thi-from", 2) },
          ],
          rule:
            "થી after a noun means \"from\" (a starting point) or \"by\" (a means): ઘર + થી = ઘરથી. It even attaches to question words — ક્યાં + થી = ક્યાંથી? (\"from where?\").",
        },
        contrast:
          "One little થી does the job of English \"from\" and \"by\" — and it stacks onto ક્યાં to ask \"from where?\" in a single word.",
        exercises: [
          {
            id: "thi-from-e1",
            kind: "choose",
            prompt: "How do you say \"from home\"?",
            options: [
              { text: "ઘરથી", roman: "gharthi", correct: true },
              { text: "ઘરમાં", roman: "gharmaa", correct: false },
            ],
            explain: "થી = from. ઘરથી — from home. (ઘરમાં = in the house.)",
          },
          {
            id: "thi-from-e2",
            kind: "cloze",
            prompt: "Complete \"from the market\" (બજાર = market).",
            frame: "બજાર___",
            frameRoman: "bajaar___",
            english: "from the market",
            options: [
              { text: "થી", roman: "‑thi", correct: true },
              { text: "ને", roman: "‑ne", correct: false },
            ],
            explain: "બજારથી — from the market.",
          },
          {
            id: "thi-from-e3",
            kind: "cloze",
            prompt: "Complete the question \"from where?\"",
            frame: "ક્યાં___?",
            frameRoman: "kyaa___?",
            english: "from where?",
            options: [
              { text: "થી", roman: "‑thi", correct: true },
              { text: "માં", roman: "‑maa", correct: false },
            ],
            explain: "ક્યાં + થી = ક્યાંથી? — from where?",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Module 5 — The past: "was/were" agreement, then the split-ergative milestone.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "g-past",
    title: "The past",
    gujaratiTitle: "ભૂતકાળ",
    blurb: "Talk about what was — and meet Gujarati's most famous twist.",
    accent: "marigold",
    order: 5,
    concepts: [
      // ── Concept 1: was/were — હતો/હતી/હતું/હતા ───────────────────────────
      {
        id: "was-were",
        moduleId: "g-past",
        order: 1,
        title: "\"Was\" has a gender",
        blurb: "હતો / હતી / હતું — \"was\" bends to match the subject.",
        hook: {
          question:
            "English \"was\" never changes — he was, she was. In Gujarati, do you think \"was\" stays the same for a brother and a grandmother?",
          guesses: [
            { text: "Yes — same word" },
            { text: "No — it changes with gender" },
          ],
          answerIndex: 1,
          reveal: "The ‑ો/‑ી/‑ું pattern strikes again — even on \"was.\"",
        },
        discovery: {
          intro: "\"Was/were\" for three subjects. Notice the ending copy the subject's gender and number.",
          examples: [
            { gujarati: "ભાઈ ઘરે હતો", roman: "bhai ghare hato", english: "Brother was home", highlight: "હતો", note: "masculine", audio: grammarAudioPath("was-were", 0) },
            { gujarati: "બા ઘરે હતી", roman: "ba ghare hati", english: "Grandmother was home", highlight: "હતી", note: "feminine", audio: grammarAudioPath("was-were", 1) },
            { gujarati: "અમે બજારમાં હતા", roman: "ame bajaarmaa hataa", english: "We were at the market", highlight: "હતા", note: "plural", audio: grammarAudioPath("was-were", 2) },
          ],
          rule:
            "\"Was/were\" is હતો (m) / હતી (f) / હતું (n) / હતા (plural), agreeing with the subject — the same ‑ો/‑ી/‑ું/‑ા endings you keep meeting. ભાઈ હતો, બા હતી.",
        },
        contrast:
          "English \"was\" is one fixed word for everyone. Gujarati's \"was\" dresses to match the subject's gender and number.",
        exercises: [
          {
            id: "was-were-e1",
            kind: "choose",
            prompt: "\"Grandmother was home\" — બા is feminine. Which \"was\"?",
            options: [
              { text: "હતો", roman: "hato", correct: false },
              { text: "હતી", roman: "hati", correct: true },
              { text: "હતું", roman: "hatu", correct: false },
            ],
            explain: "Feminine subject → હતી. બા ઘરે હતી.",
          },
          {
            id: "was-were-e2",
            kind: "cloze",
            prompt: "\"Brother was home\" — ભાઈ is masculine. Fill the blank.",
            frame: "ભાઈ ઘરે ___",
            frameRoman: "bhai ghare ___",
            english: "Brother was home",
            options: [
              { text: "હતો", roman: "hato", correct: true },
              { text: "હતી", roman: "hati", correct: false },
              { text: "હતું", roman: "hatu", correct: false },
            ],
            explain: "Masculine subject → હતો. ભાઈ ઘરે હતો.",
          },
          {
            id: "was-were-e3",
            kind: "choose",
            prompt: "Does Gujarati's \"was\" change with the subject's gender?",
            options: [
              { text: "Yes — હતો / હતી / હતું", correct: true },
              { text: "No — it's always one word", correct: false },
            ],
            explain: "It agrees, using the same ‑ો/‑ી/‑ું pattern.",
          },
        ],
      },

      // ── Concept 2: the split-ergative past (the milestone) ───────────────
      {
        id: "split-ergative",
        moduleId: "g-past",
        order: 2,
        title: "The past's famous twist",
        blurb: "In the past, the verb agrees with the thing done — not the doer.",
        hook: {
          question:
            "\"I ate roti.\" રોટલી (roti) is feminine. In the Gujarati past, does the verb \"ate\" match the eater (I) or the food (roti)?",
          guesses: [
            { text: "The eater — \"I\"" },
            { text: "The food — roti" },
          ],
          answerIndex: 1,
          reveal: "Here's Gujarati's big twist: in the past, the verb bends to the object.",
        },
        discovery: {
          intro: "Same eater (\"I\"), three foods. Notice the verb ending change to match the food — and \"I\" becomes મેં.",
          examples: [
            { gujarati: "મેં રોટલી ખાધી", roman: "me rotli khaadhi", english: "I ate roti", highlight: "ખાધી", note: "રોટલી feminine → ‑ી", audio: grammarAudioPath("split-ergative", 0) },
            { gujarati: "મેં ભાત ખાધો", roman: "me bhaat khaadho", english: "I ate rice", highlight: "ખાધો", note: "ભાત masculine → ‑ો", audio: grammarAudioPath("split-ergative", 1) },
            { gujarati: "મેં પાણી પીધું", roman: "me paani peedhu", english: "I drank water", highlight: "પીધું", note: "પાણી neuter → ‑ું", audio: grammarAudioPath("split-ergative", 2) },
          ],
          rule:
            "In the past of a \"doing-to\" verb, the verb agrees with the thing done to, not the doer — and the doer takes a special form (હું → મેં). So મેં રોટલી ખાધી (‑ી, feminine roti) but મેં ભાત ખાધો (‑ો, masculine rice). The food drives the ending.",
        },
        contrast:
          "English \"I ate\" never changes, whatever you ate. Gujarati flips the logic in the past: the verb bends to the object. Nail this and you've cracked the sentence learners find hardest — the real \"I understand Gujarati\" moment.",
        exercises: [
          {
            id: "split-ergative-e1",
            kind: "choose",
            prompt: "In the Gujarati past, the verb agrees with…",
            options: [
              { text: "the thing done to (the object)", correct: true },
              { text: "the doer (the subject)", correct: false },
            ],
            explain: "That's the split-ergative twist — the verb matches the object.",
          },
          {
            id: "split-ergative-e2",
            kind: "cloze",
            prompt: "\"I ate roti\" — રોટલી is feminine. Fill the verb.",
            frame: "મેં રોટલી ___",
            frameRoman: "me rotli ___",
            english: "I ate roti",
            options: [
              { text: "ખાધી", roman: "khaadhi", correct: true },
              { text: "ખાધો", roman: "khaadho", correct: false },
              { text: "ખાધું", roman: "khaadhu", correct: false },
            ],
            explain: "Feminine object → ‑ી. મેં રોટલી ખાધી.",
          },
          {
            id: "split-ergative-e3",
            kind: "cloze",
            prompt: "\"I ate rice\" — ભાત is masculine. Fill the verb.",
            frame: "મેં ભાત ___",
            frameRoman: "me bhaat ___",
            english: "I ate rice",
            options: [
              { text: "ખાધી", roman: "khaadhi", correct: false },
              { text: "ખાધો", roman: "khaadho", correct: true },
              { text: "ખાધું", roman: "khaadhu", correct: false },
            ],
            explain: "Masculine object → ‑ો. મેં ભાત ખાધો.",
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
