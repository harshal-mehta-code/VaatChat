// ─────────────────────────────────────────────────────────────────────────
// Seeded content — Units 1 & 2 (A1, conversation-first).
//
// ⚠️ DRAFT CONTENT — pending native-speaker verification.
// Gujarati script + romanization + audio all need a native review pass before
// this ships. Romanization here is a friendly, readable scheme (not strict
// IAST). Audio paths point at /public/audio/* placeholders until recordings
// from the content team land.
// ─────────────────────────────────────────────────────────────────────────

import type { Exercise, LexItem, Lesson, Unit } from "../core/types";

// ── Item bank ───────────────────────────────────────────────────────────────
// Kept flat so exercises + dialogues can reference by id, and the SRS pool is
// a single set. Ids are stable, human-readable slugs.

export const ITEMS: LexItem[] = [
  // Unit 1 — Greetings & Family
  { id: "kem-cho", gujarati: "કેમ છો?", roman: "Kem cho?", english: "How are you?", register: "formal", audio: "/audio/kem-cho.mp3", tags: ["greeting", "u1"] },
  { id: "majama", gujarati: "મજામાં", roman: "Majaamã", english: "I'm well / Great", literal: "in-fun", audio: "/audio/majama.mp3", tags: ["greeting", "u1"] },
  { id: "namaste", gujarati: "નમસ્તે", roman: "Namaste", english: "Hello / greetings", audio: "/audio/namaste.mp3", tags: ["greeting", "u1"] },
  { id: "jay-shri-krishna", gujarati: "જય શ્રી કૃષ્ણ", roman: "Jay Shri Krishna", english: "Traditional Gujarati greeting", note: "Warm, common among family & community.", audio: "/audio/jay-shri-krishna.mp3", tags: ["greeting", "u1"] },
  { id: "aabhaar", gujarati: "આભાર", roman: "Aabhaar", english: "Thank you", audio: "/audio/aabhaar.mp3", tags: ["greeting", "u1"] },
  { id: "ha", gujarati: "હા", roman: "Ha", english: "Yes", audio: "/audio/ha.mp3", tags: ["core", "u1"] },
  { id: "na", gujarati: "ના", roman: "Na", english: "No", audio: "/audio/na.mp3", tags: ["core", "u1"] },
  { id: "maru-naam", gujarati: "મારું નામ ... છે", roman: "Maaru naam ... chhe", english: "My name is ...", literal: "my name ... is", audio: "/audio/maru-naam.mp3", tags: ["intro", "u1"] },
  { id: "tamaru-naam", gujarati: "તમારું નામ શું છે?", roman: "Tamaaru naam shu chhe?", english: "What's your name?", register: "formal", audio: "/audio/tamaru-naam.mp3", tags: ["intro", "u1"] },
  { id: "maline-anand", gujarati: "મળીને આનંદ થયો", roman: "Malīne aanand thayo", english: "Nice to meet you", audio: "/audio/maline-anand.mp3", tags: ["intro", "u1"] },
  { id: "parivaar", gujarati: "પરિવાર", roman: "Parivaar", english: "family", audio: "/audio/parivaar.mp3", tags: ["family", "u1"] },
  { id: "ba", gujarati: "બા", roman: "Ba", english: "grandmother", note: "An affectionate word for grandmother.", audio: "/audio/ba.mp3", tags: ["family", "u1"] },
  { id: "dada", gujarati: "દાદા", roman: "Dada", english: "grandfather", audio: "/audio/dada.mp3", tags: ["family", "u1"] },
  { id: "mummy", gujarati: "મમ્મી", roman: "Mummy", english: "mom", audio: "/audio/mummy.mp3", tags: ["family", "u1"] },
  { id: "pappa", gujarati: "પપ્પા", roman: "Pappa", english: "dad", audio: "/audio/pappa.mp3", tags: ["family", "u1"] },
  { id: "bhai", gujarati: "ભાઈ", roman: "Bhai", english: "brother", audio: "/audio/bhai.mp3", tags: ["family", "u1"] },
  { id: "ben", gujarati: "બહેન", roman: "Bahen", english: "sister", audio: "/audio/ben.mp3", tags: ["family", "u1"] },

  // Unit 2 — Food & the Thali
  { id: "paani", gujarati: "પાણી", roman: "Paani", english: "water", audio: "/audio/paani.mp3", tags: ["food", "u2"] },
  { id: "cha", gujarati: "ચા", roman: "Chaa", english: "tea", audio: "/audio/cha.mp3", tags: ["food", "u2"] },
  { id: "rotli", gujarati: "રોટલી", roman: "Rotli", english: "flatbread (roti)", audio: "/audio/rotli.mp3", tags: ["food", "u2"] },
  { id: "shaak", gujarati: "શાક", roman: "Shaak", english: "vegetable dish", audio: "/audio/shaak.mp3", tags: ["food", "u2"] },
  { id: "daal", gujarati: "દાળ", roman: "Daal", english: "lentils", audio: "/audio/daal.mp3", tags: ["food", "u2"] },
  { id: "bhaat", gujarati: "ભાત", roman: "Bhaat", english: "rice", audio: "/audio/bhaat.mp3", tags: ["food", "u2"] },
  { id: "thaali", gujarati: "થાળી", roman: "Thaali", english: "platter (thali)", note: "The classic full Gujarati meal on one plate.", audio: "/audio/thaali.mp3", tags: ["food", "u2"] },
  { id: "swaadisht", gujarati: "સ્વાદિષ્ટ", roman: "Swaadisht", english: "delicious", audio: "/audio/swaadisht.mp3", tags: ["food", "u2"] },
  { id: "bhookh-lagi", gujarati: "ભૂખ લાગી છે", roman: "Bhookh laagi chhe", english: "I'm hungry", literal: "hunger has-struck is", audio: "/audio/bhookh-lagi.mp3", tags: ["food", "u2"] },
  { id: "mane-bhaave", gujarati: "મને ભાવે છે", roman: "Mane bhaave chhe", english: "I like it (food)", audio: "/audio/mane-bhaave.mp3", tags: ["food", "u2"] },
  { id: "jamya", gujarati: "જમ્યા?", roman: "Jamya?", english: "Have you eaten?", note: "A warm everyday greeting in itself.", audio: "/audio/jamya.mp3", tags: ["food", "u2"] },
  { id: "cha-joie", gujarati: "મને ચા જોઈએ છે", roman: "Mane chaa joie chhe", english: "I would like some tea", literal: "to-me tea is-wanted", audio: "/audio/cha-joie.mp3", tags: ["food", "u2"] },
  { id: "thodu", gujarati: "થોડું", roman: "Thodu", english: "a little", audio: "/audio/thodu.mp3", tags: ["food", "u2"] },
  { id: "vadhaare", gujarati: "વધારે", roman: "Vadhaare", english: "more", audio: "/audio/vadhaare.mp3", tags: ["food", "u2"] },
];

export const ITEMS_BY_ID: Record<string, LexItem> = Object.fromEntries(
  ITEMS.map((i) => [i.id, i]),
);

// ── Lesson builder ──────────────────────────────────────────────────────────
// Generates a sensible, interleaved exercise sequence from a list of item ids,
// so content stays declarative and we don't hand-author every exercise.

function pickDistractors(itemId: string, pool: string[], n = 3): string[] {
  const others = pool.filter((id) => id !== itemId);
  // Deterministic pseudo-shuffle by id hash → stable across renders.
  const scored = others
    .map((id) => ({ id, h: [...id].reduce((a, c) => a + c.charCodeAt(0), 0) }))
    .sort((a, b) => a.h - b.h);
  return scored.slice(0, n).map((s) => s.id);
}

function buildLesson(
  unitId: string,
  id: string,
  title: string,
  itemIds: string[],
): Lesson {
  const pool = itemIds;
  const ex: Exercise[] = [];

  // 1) Comprehensible input: meet every item gently.
  for (const itemId of itemIds) {
    ex.push({ id: `${id}-intro-${itemId}`, kind: "intro", itemId });
  }
  // 2) Active recall: pick the meaning (with distractors).
  for (const itemId of itemIds) {
    ex.push({
      id: `${id}-recall-${itemId}`,
      kind: "recall",
      itemId,
      distractorIds: pickDistractors(itemId, pool),
    });
  }
  // 3) Listening: hear it, pick it.
  for (const itemId of itemIds.slice(0, Math.min(3, itemIds.length))) {
    ex.push({
      id: `${id}-listen-${itemId}`,
      kind: "listen",
      itemId,
      distractorIds: pickDistractors(itemId, pool),
    });
  }
  // 4) Output: say it back (self-compare in MVP).
  for (const itemId of itemIds.slice(0, Math.min(3, itemIds.length))) {
    ex.push({ id: `${id}-speak-${itemId}`, kind: "speak", itemId });
  }

  return { id, unitId, title, exercises: ex };
}

// ── Units ────────────────────────────────────────────────────────────────────

export const UNITS: Unit[] = [
  {
    id: "u1",
    title: "Greetings & Family",
    gujaratiTitle: "નમસ્તે અને પરિવાર",
    blurb: "Say hello, introduce yourself, and name the people you love.",
    accent: "marigold",
    order: 1,
    lessons: [
      buildLesson("u1", "u1-l1", "Hello & how are you", ["kem-cho", "majama", "namaste", "aabhaar", "ha", "na"]),
      buildLesson("u1", "u1-l2", "Nice to meet you", ["maru-naam", "tamaru-naam", "maline-anand", "jay-shri-krishna"]),
      buildLesson("u1", "u1-l3", "My family", ["parivaar", "ba", "dada", "mummy", "pappa", "bhai", "ben"]),
    ],
  },
  {
    id: "u2",
    title: "Food & the Thali",
    gujaratiTitle: "ખાવાનું અને થાળી",
    blurb: "Order chai, name a full thali, and say what you love to eat.",
    accent: "magenta",
    order: 2,
    lessons: [
      buildLesson("u2", "u2-l1", "On the thali", ["thaali", "rotli", "shaak", "daal", "bhaat"]),
      buildLesson("u2", "u2-l2", "Chai & water", ["paani", "cha", "cha-joie", "thodu", "vadhaare"]),
      buildLesson("u2", "u2-l3", "Yum!", ["bhookh-lagi", "jamya", "mane-bhaave", "swaadisht"]),
    ],
  },
];

export const UNITS_BY_ID: Record<string, Unit> = Object.fromEntries(
  UNITS.map((u) => [u.id, u]),
);

export function allLessons(): Lesson[] {
  return UNITS.flatMap((u) => u.lessons);
}

export function lessonById(id: string): Lesson | undefined {
  return allLessons().find((l) => l.id === id);
}
