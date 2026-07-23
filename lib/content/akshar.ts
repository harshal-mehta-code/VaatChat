// ─────────────────────────────────────────────────────────────────────────
// Akshar Lab data — the Gujarati script, taught shape→sound.
//
// ⚠️ DRAFT — mnemonics & romanization pending native/pedagogy review.
// MVP scope: the core vowels (swar) + a starter set of consonants (vyanjan),
// plus a generated barakshari (consonant × vowel) grid — the drill Gujarati
// kids grow up on, and our highest-leverage literacy tool.
// ─────────────────────────────────────────────────────────────────────────

import type { Akshar, BarakshariCell } from "../core/types";

/** Core vowels. `matra` is the diacritic form that attaches to a consonant. */
export const VOWELS: Akshar[] = [
  { id: "v-a", char: "અ", roman: "a", sound: "a as in 'about'", type: "vowel", matra: "", mnemonic: "The base sound — every consonant already hums an 'a'.", audio: "/audio/akshar/a.mp3" },
  { id: "v-aa", char: "આ", roman: "aa", sound: "aa as in 'father'", type: "vowel", matra: "ા", mnemonic: "અ grows a tall arm 'ા' — stretch the sound: aaah.", audio: "/audio/akshar/aa.mp3" },
  { id: "v-i", char: "ઇ", roman: "i", sound: "i as in 'sit'", type: "vowel", matra: "િ", mnemonic: "A little hook 'િ' sits *before* its consonant — short and quick.", audio: "/audio/akshar/i.mp3" },
  { id: "v-ii", char: "ઈ", roman: "ee", sound: "ee as in 'see'", type: "vowel", matra: "ી", mnemonic: "The long cousin — the tail 'ી' leans right for a long 'eee'.", audio: "/audio/akshar/ii.mp3" },
  { id: "v-u", char: "ઉ", roman: "u", sound: "u as in 'put'", type: "vowel", matra: "ુ", mnemonic: "A curl below 'ુ' — round your lips: uh.", audio: "/audio/akshar/u.mp3" },
  { id: "v-uu", char: "ઊ", roman: "oo", sound: "oo as in 'moon'", type: "vowel", matra: "ૂ", mnemonic: "A deeper curl 'ૂ' for the longer 'ooo'.", audio: "/audio/akshar/uu.mp3" },
  { id: "v-e", char: "એ", roman: "e", sound: "e as in 'they'", type: "vowel", matra: "ે", mnemonic: "A roof-mark 'ે' floats on top — say 'ay'.", audio: "/audio/akshar/e.mp3" },
  { id: "v-ai", char: "ઐ", roman: "ai", sound: "ai as in 'aisle'", type: "vowel", matra: "ૈ", mnemonic: "Two roof-marks 'ૈ' — a wider 'ai'.", audio: "/audio/akshar/ai.mp3" },
  { id: "v-o", char: "ઓ", roman: "o", sound: "o as in 'go'", type: "vowel", matra: "ો", mnemonic: "Roof + arm 'ો' — a rounded 'oh'.", audio: "/audio/akshar/o.mp3" },
  { id: "v-au", char: "ઔ", roman: "au", sound: "au as in 'now'", type: "vowel", matra: "ૌ", mnemonic: "Roof + arm, doubled 'ૌ' — an open 'ow'.", audio: "/audio/akshar/au.mp3" },
];

/** Starter consonants. `roman` includes the inherent 'a'. */
export const CONSONANTS: Akshar[] = [
  { id: "c-ka", char: "ક", roman: "ka", sound: "k as in 'skip'", type: "consonant", mnemonic: "A key 'ક' — Ka opens the alphabet.", audio: "/audio/akshar/ka.mp3" },
  { id: "c-kha", char: "ખ", roman: "kha", sound: "k with a breath, 'kha'", type: "consonant", mnemonic: "ક with a loop — add a puff of air: kha.", audio: "/audio/akshar/kha.mp3" },
  { id: "c-ga", char: "ગ", roman: "ga", sound: "g as in 'go'", type: "consonant", mnemonic: "A round belly 'ગ' — a hard g.", audio: "/audio/akshar/ga.mp3" },
  { id: "c-cha", char: "ચ", roman: "cha", sound: "ch as in 'church'", type: "consonant", mnemonic: "A chair 'ચ' — sit and say cha.", audio: "/audio/akshar/cha.mp3" },
  { id: "c-ja", char: "જ", roman: "ja", sound: "j as in 'jam'", type: "consonant", mnemonic: "A hook and dot 'જ' — a jumping ja.", audio: "/audio/akshar/ja.mp3" },
  { id: "c-ta-retro", char: "ટ", roman: "ṭa", sound: "hard 't', tongue curled back", type: "consonant", mnemonic: "Retroflex 'ટ' — curl your tongue to the roof: ṭa.", audio: "/audio/akshar/ta-retro.mp3" },
  { id: "c-da-retro", char: "ડ", roman: "ḍa", sound: "hard 'd', tongue curled back", type: "consonant", mnemonic: "Retroflex 'ડ' — same curl, voiced: ḍa.", audio: "/audio/akshar/da-retro.mp3" },
  { id: "c-ta", char: "ત", roman: "ta", sound: "soft 't', tongue on teeth", type: "consonant", mnemonic: "Dental 'ત' — tongue on the teeth: ta.", audio: "/audio/akshar/ta.mp3" },
  { id: "c-da", char: "દ", roman: "da", sound: "soft 'd', tongue on teeth", type: "consonant", mnemonic: "Dental 'દ' — soft da, like Spanish 'd'.", audio: "/audio/akshar/da.mp3" },
  { id: "c-na", char: "ન", roman: "na", sound: "n as in 'net'", type: "consonant", mnemonic: "A simple 'ન' — na.", audio: "/audio/akshar/na.mp3" },
  { id: "c-pa", char: "પ", roman: "pa", sound: "p as in 'spin'", type: "consonant", mnemonic: "An open cup 'પ' — pa.", audio: "/audio/akshar/pa.mp3" },
  { id: "c-ba", char: "બ", roman: "ba", sound: "b as in 'bat'", type: "consonant", mnemonic: "A closed cup 'બ' — ba.", audio: "/audio/akshar/ba.mp3" },
  { id: "c-ma", char: "મ", roman: "ma", sound: "m as in 'mom'", type: "consonant", mnemonic: "A loop 'મ' — ma, as in mummy.", audio: "/audio/akshar/ma.mp3" },
  { id: "c-ra", char: "ર", roman: "ra", sound: "rolled 'r'", type: "consonant", mnemonic: "A single stroke 'ર' — a light rolled ra.", audio: "/audio/akshar/ra.mp3" },
  { id: "c-la", char: "લ", roman: "la", sound: "l as in 'love'", type: "consonant", mnemonic: "A curl 'લ' — la.", audio: "/audio/akshar/la.mp3" },
  { id: "c-va", char: "વ", roman: "va", sound: "v/w between 'v' and 'w'", type: "consonant", mnemonic: "A loop with a tail 'વ' — va, softer than English v.", audio: "/audio/akshar/va.mp3" },
  { id: "c-sa", char: "સ", roman: "sa", sound: "s as in 'sun'", type: "consonant", mnemonic: "A comb 'સ' — sa.", audio: "/audio/akshar/sa.mp3" },
  { id: "c-ha", char: "હ", roman: "ha", sound: "h as in 'hat'", type: "consonant", mnemonic: "A breath 'હ' — ha.", audio: "/audio/akshar/ha.mp3" },
];

export const ALL_AKSHAR: Akshar[] = [...VOWELS, ...CONSONANTS];
export const AKSHAR_BY_ID: Record<string, Akshar> = Object.fromEntries(
  ALL_AKSHAR.map((a) => [a.id, a]),
);

/**
 * Generate a barakshari row for one consonant across all core vowels.
 * The combined glyph is the consonant + the vowel's matra; the inherent-'a'
 * vowel (matra "") yields the bare consonant.
 */
export function barakshariRow(consonant: Akshar): BarakshariCell[] {
  const stem = consonant.roman.replace(/a$/, ""); // "ka" → "k"
  return VOWELS.map((v) => ({
    consonantId: consonant.id,
    vowelId: v.id,
    combined: consonant.char + (v.matra ?? ""),
    roman: stem + v.roman,
  }));
}

/** The full barakshari grid (rows = consonants, cols = vowels). */
export function barakshariGrid(): { consonant: Akshar; cells: BarakshariCell[] }[] {
  return CONSONANTS.map((c) => ({ consonant: c, cells: barakshariRow(c) }));
}
