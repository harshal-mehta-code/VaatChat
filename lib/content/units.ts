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

  // Unit 3 — Home & Kitchen
  { id: "ghar", gujarati: "ઘર", roman: "Ghar", english: "home / house", audio: "/audio/ghar.mp3", tags: ["home", "u3"] },
  { id: "ordo", gujarati: "ઓરડો", roman: "Ordo", english: "room", audio: "/audio/ordo.mp3", tags: ["home", "u3"] },
  { id: "rasodu", gujarati: "રસોડું", roman: "Rasodu", english: "kitchen", audio: "/audio/rasodu.mp3", tags: ["home", "u3"] },
  { id: "baari", gujarati: "બારી", roman: "Baari", english: "window", audio: "/audio/baari.mp3", tags: ["home", "u3"] },
  { id: "barnu", gujarati: "બારણું", roman: "Baarnu", english: "door", audio: "/audio/barnu.mp3", tags: ["home", "u3"] },
  { id: "chulo", gujarati: "ચૂલો", roman: "Chulo", english: "stove", audio: "/audio/chulo.mp3", tags: ["home", "u3"] },
  { id: "tapeli", gujarati: "તપેલી", roman: "Tapeli", english: "cooking pot", audio: "/audio/tapeli.mp3", tags: ["home", "u3"] },
  { id: "chamchi", gujarati: "ચમચી", roman: "Chamchi", english: "spoon", audio: "/audio/chamchi.mp3", tags: ["home", "u3"] },
  { id: "glass", gujarati: "ગ્લાસ", roman: "Glass", english: "glass (of water)", audio: "/audio/glass.mp3", tags: ["home", "u3"] },
  { id: "vaasan", gujarati: "વાસણ", roman: "Vaasan", english: "dishes / utensils", audio: "/audio/vaasan.mp3", tags: ["home", "u3"] },
  { id: "khurshi", gujarati: "ખુરશી", roman: "Khurshi", english: "chair", audio: "/audio/khurshi.mp3", tags: ["home", "u3"] },
  { id: "table", gujarati: "ટેબલ", roman: "Table", english: "table", audio: "/audio/table.mp3", tags: ["home", "u3"] },
  { id: "palang", gujarati: "પલંગ", roman: "Palang", english: "bed", audio: "/audio/palang.mp3", tags: ["home", "u3"] },
  { id: "ghadiyaal", gujarati: "ઘડિયાળ", roman: "Ghadiyaal", english: "clock / watch", audio: "/audio/ghadiyaal.mp3", tags: ["home", "u3"] },
  { id: "diwo", gujarati: "દીવો", roman: "Diwo", english: "lamp / oil lamp", note: "The little oil lamp lit at prayers and on Diwali.", audio: "/audio/diwo.mp3", tags: ["home", "u3"] },

  // Unit 4 — Festivals
  { id: "tehvaar", gujarati: "તહેવાર", roman: "Tehvaar", english: "festival", audio: "/audio/tehvaar.mp3", tags: ["festival", "u4"] },
  { id: "navratri", gujarati: "નવરાત્રી", roman: "Navraatri", english: "Navratri", note: "The nine nights of dance honoring the goddess.", audio: "/audio/navratri.mp3", tags: ["festival", "u4"] },
  { id: "garba", gujarati: "ગરબા", roman: "Garba", english: "garba (folk dance)", audio: "/audio/garba.mp3", tags: ["festival", "u4"] },
  { id: "dandiya", gujarati: "દાંડિયા", roman: "Dandiya", english: "dance sticks", note: "The paired sticks tapped in raas-garba.", audio: "/audio/dandiya.mp3", tags: ["festival", "u4"] },
  { id: "diwali", gujarati: "દિવાળી", roman: "Diwaali", english: "Diwali", note: "The festival of lights.", audio: "/audio/diwali.mp3", tags: ["festival", "u4"] },
  { id: "rangoli", gujarati: "રંગોળી", roman: "Rangoli", english: "rangoli", note: "Colorful patterns drawn on the floor to welcome guests.", audio: "/audio/rangoli.mp3", tags: ["festival", "u4"] },
  { id: "fataka", gujarati: "ફટાકા", roman: "Fataakaa", english: "firecrackers", audio: "/audio/fataka.mp3", tags: ["festival", "u4"] },
  { id: "mithai", gujarati: "મીઠાઈ", roman: "Mithaai", english: "sweets", audio: "/audio/mithai.mp3", tags: ["festival", "u4"] },
  { id: "saal-mubarak", gujarati: "સાલ મુબારક", roman: "Saal Mubaarak", english: "Happy New Year", note: "The Gujarati New Year greeting, the day after Diwali.", audio: "/audio/saal-mubarak.mp3", tags: ["festival", "u4"] },
  { id: "uttarayan", gujarati: "ઉત્તરાયણ", roman: "Uttaraayan", english: "Uttarayan (kite festival)", audio: "/audio/uttarayan.mp3", tags: ["festival", "u4"] },
  { id: "patang", gujarati: "પતંગ", roman: "Patang", english: "kite", audio: "/audio/patang.mp3", tags: ["festival", "u4"] },
  { id: "holi", gujarati: "હોળી", roman: "Holi", english: "Holi (festival of colors)", audio: "/audio/holi.mp3", tags: ["festival", "u4"] },
  { id: "rang", gujarati: "રંગ", roman: "Rang", english: "color", audio: "/audio/rang.mp3", tags: ["festival", "u4"] },
  { id: "shubh", gujarati: "શુભ", roman: "Shubh", english: "auspicious / blessed", note: "Said to wish someone well — Shubh Diwali!", audio: "/audio/shubh.mp3", tags: ["festival", "u4"] },

  // Unit 5 — The Market & Money
  { id: "bajaar", gujarati: "બજાર", roman: "Bajaar", english: "market", audio: "/audio/bajaar.mp3", tags: ["market", "u5"] },
  { id: "dukaan", gujarati: "દુકાન", roman: "Dukaan", english: "shop", audio: "/audio/dukaan.mp3", tags: ["market", "u5"] },
  { id: "shaakbhaji", gujarati: "શાકભાજી", roman: "Shaakbhaaji", english: "vegetables", audio: "/audio/shaakbhaji.mp3", tags: ["market", "u5"] },
  { id: "fal", gujarati: "ફળ", roman: "Fal", english: "fruit", audio: "/audio/fal.mp3", tags: ["market", "u5"] },
  { id: "kariyanu", gujarati: "કરિયાણું", roman: "Kariyaanu", english: "groceries", audio: "/audio/kariyanu.mp3", tags: ["market", "u5"] },
  { id: "paisa", gujarati: "પૈસા", roman: "Paisaa", english: "money", audio: "/audio/paisa.mp3", tags: ["market", "u5"] },
  { id: "rupiya", gujarati: "રૂપિયા", roman: "Rupiyaa", english: "rupees", audio: "/audio/rupiya.mp3", tags: ["market", "u5"] },
  { id: "ketlu-thayu", gujarati: "કેટલું થયું?", roman: "Ketlu thayu?", english: "How much is it?", literal: "how-much became", audio: "/audio/ketlu-thayu.mp3", tags: ["market", "u5"] },
  { id: "bhaav", gujarati: "ભાવ", roman: "Bhaav", english: "price", audio: "/audio/bhaav.mp3", tags: ["market", "u5"] },
  { id: "mongu", gujarati: "મોંઘું", roman: "Monghu", english: "expensive", audio: "/audio/mongu.mp3", tags: ["market", "u5"] },
  { id: "sastu", gujarati: "સસ્તું", roman: "Sastu", english: "cheap", audio: "/audio/sastu.mp3", tags: ["market", "u5"] },
  { id: "aapo", gujarati: "આપો", roman: "Aapo", english: "please give", register: "formal", audio: "/audio/aapo.mp3", tags: ["market", "u5"] },
  { id: "ketla", gujarati: "કેટલા", roman: "Ketlaa", english: "how many", audio: "/audio/ketla.mp3", tags: ["market", "u5"] },
  { id: "ek", gujarati: "એક", roman: "Ek", english: "one", audio: "/audio/ek.mp3", tags: ["market", "u5", "number"] },
  { id: "be", gujarati: "બે", roman: "Be", english: "two", audio: "/audio/be.mp3", tags: ["market", "u5", "number"] },
  { id: "tran", gujarati: "ત્રણ", roman: "Tran", english: "three", audio: "/audio/tran.mp3", tags: ["market", "u5", "number"] },
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
  {
    id: "u3",
    title: "Home & Kitchen",
    gujaratiTitle: "ઘર અને રસોડું",
    blurb: "Name the rooms, the kitchen, and the things around the house.",
    accent: "peacock",
    order: 3,
    lessons: [
      buildLesson("u3", "u3-l1", "Around the home", ["ghar", "ordo", "rasodu", "baari", "barnu"]),
      buildLesson("u3", "u3-l2", "In the kitchen", ["chulo", "tapeli", "chamchi", "glass", "vaasan"]),
      buildLesson("u3", "u3-l3", "Furniture & comfort", ["khurshi", "table", "palang", "ghadiyaal", "diwo"]),
    ],
  },
  {
    id: "u4",
    title: "Festivals",
    gujaratiTitle: "તહેવારો",
    blurb: "Dance at Navratri, light up Diwali, and fly kites at Uttarayan.",
    accent: "marigold",
    order: 4,
    lessons: [
      buildLesson("u4", "u4-l1", "Navratri nights", ["tehvaar", "navratri", "garba", "dandiya"]),
      buildLesson("u4", "u4-l2", "Diwali lights", ["diwali", "rangoli", "fataka", "mithai", "saal-mubarak"]),
      buildLesson("u4", "u4-l3", "Kites & colors", ["uttarayan", "patang", "holi", "rang", "shubh"]),
    ],
  },
  {
    id: "u5",
    title: "The Market & Money",
    gujaratiTitle: "બજાર અને પૈસા",
    blurb: "Shop at the bajaar, ask the price, and count what you buy.",
    accent: "magenta",
    order: 5,
    lessons: [
      buildLesson("u5", "u5-l1", "At the market", ["bajaar", "dukaan", "shaakbhaji", "fal", "kariyanu"]),
      buildLesson("u5", "u5-l2", "How much?", ["paisa", "rupiya", "ketlu-thayu", "bhaav", "mongu", "sastu"]),
      buildLesson("u5", "u5-l3", "Buying it", ["aapo", "ketla", "ek", "be", "tran"]),
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
