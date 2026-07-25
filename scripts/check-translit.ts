// ─────────────────────────────────────────────────────────────────────────
// Transliteration check — does the typing engine agree with our content?
//
//   npm run check:translit
//
// Every one of the ~450 items in lib/content already carries a hand-written
// romanization. That makes the content a free test set for lib/core/translit.ts:
// if a learner types the roman we show them, the app had better accept it.
//
// Two tiers, deliberately:
//
//   HARD  — the alphabet and the barakshari grid. These are fully systematic,
//           so a mismatch is a bug in the tables. Non-zero exit.
//   SOFT  — vocabulary. Some of our romans are friendly-English rather than
//           keyboard-phonetic ("Mummy" for મમ્મી, which really is typed
//           `mammi`), and that's the right call for a reading aid. Those words
//           simply stay out of the typing drill — the app filters on
//           acceptsTyped() at runtime, so nothing broken ever gets shown.
//           Reported, with a coverage floor to catch a real regression.
// ─────────────────────────────────────────────────────────────────────────

import {
  segmentGujarati,
  matchTyped,
  normalizeTyped,
  typedCanonical,
  typedRivals,
  acceptsTyped,
  isTypable,
  transliterateRoman,
} from "../lib/core/translit.ts";
import { ITEMS } from "../lib/content/units.ts";
import { FREQUENCY_ITEMS } from "../lib/content/frequency.ts";
import { SCENARIOS } from "../lib/content/scenarios.ts";
import { VOWELS, CONSONANTS, barakshariGrid } from "../lib/content/akshar.ts";

/** Below this share of vocabulary accepted, something has regressed. */
const WORD_COVERAGE_FLOOR = 0.7;

// ── Tier 0: the behaviours the drill depends on ───────────────────────────
// Small, hand-picked, and the first thing to break if the engine drifts.

const failures: string[] = [];
function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) failures.push(`${label}: expected ${e}, got ${a}`);
}

{
  const kem = segmentGujarati("કેમ છો");
  check("કેમ છો splits into 4 clusters", kem.map((c) => c.guj), ["કે", "મ", " ", "છો"]);
  check("કેમ છો reads as", kem.map((c) => c.roman).join(""), "kema chho");

  // The progressive reveal: how much script is standing once you've typed this.
  check("'k' builds nothing yet", matchTyped(kem, "k").matched, 0);
  check("'k' is still on track", matchTyped(kem, "k").prefix, true);
  check("'ke' builds કે", matchTyped(kem, "ke").matched, 1);
  check("'kem ' builds કેમ␣", matchTyped(kem, "kem ").matched, 3);
  check("'kem c' keeps કેમ␣ up", matchTyped(kem, "kem c").matched, 3);
  check("a typo doesn't blank the reveal", matchTyped(kem, "kem chha").matched, 3);
  check("'kem cho' is complete", matchTyped(kem, "kem cho").complete, true);
  check("'kem chho' is complete too", matchTyped(kem, "kem chho").complete, true);
  check("'kx' is a dead end", matchTyped(kem, "kx").prefix, false);
  check("'kemcho' needs the space", matchTyped(kem, "kemcho").complete, false);

  // Retroflex vs dental: identical lowercase, distinguished by the capital.
  check("ટ and ત both take 'ta'", [acceptsTyped("ટ", "ta"), acceptsTyped("ત", "ta")], [true, true]);
  check("ટ is taught as", typedCanonical("ટ"), "Ta");
  check("ત is taught as", typedCanonical("ત"), "ta");
  check("ટ's rival is ત", typedRivals("ટ"), ["ત"]);
  check("ક has no rival", typedRivals("ક"), []);

  // The nasal mark is invisible on a keyboard, so both spellings land.
  check("શું from 'shu'", acceptsTyped("શું", "shu"), true);
  check("શું from 'shun'", acceptsTyped("શું", "shun"), true);

  // િ renders left of its consonant but is written (and typed) after it.
  const divas = segmentGujarati("દિવસ");
  check("દિવસ clusters", divas.map((c) => c.guj), ["દિ", "વ", "સ"]);
  check("દિ is written દ then િ", divas[0].parts, ["દ", "િ"]);
  check("દિવસ typed", typedCanonical("દિવસ"), "divas");

  // Conjuncts fall out of stem concatenation.
  check("સ્વાદિષ્ટ typed", typedCanonical("સ્વાદિષ્ટ"), "svaadiSht");
  check("barakshari કી", typedCanonical("કી"), "kee");

  // A retroflex keeps its capital wherever it falls, not just at the front —
  // `rotalee` would give you રોતલી, the dental, on a real phone.
  check("રોટલી typed", typedCanonical("રોટલી"), "roTalee");
  check("ઘડિયાળ typed", typedCanonical("ઘડિયાળ"), "ghaDiyaaL");
  // ...and schwa deletion is a *word*-final rule, not an end-of-string one.
  check("કેમ છો? typed", typedCanonical("કેમ છો?"), "kem chho?");
}

// ── The other direction: roman in, script out ─────────────────────────────
// transliterateRoman() is the one function here that *produces* Gujarati, for
// the learner's own name and freeform typing (never for curriculum). These are
// the keyboard rules it stands on.
{
  const t = transliterateRoman;
  check("a bare consonant carries its own 'a'", t("ka"), "ક");
  check("'kaa' is the long one", t("kaa"), "કા");
  // Two adjacent consonants stack — the rule that makes પ્રિય possible.
  check("priya stacks", t("priya"), "પ્રિયા");
  check("dhruv stacks", t("dhruv"), "ધ્રુવ");
  check("smita stacks", t("smita"), "સ્મિતા");
  // A nasal before a stop is the anusvara, before a semivowel it's a conjunct.
  check("anand nasalizes", t("anand"), "અનંદ");
  check("palang nasalizes", t("palang"), "પલંગ");
  check("jamyaa does not", t("jamyaa"), "જમ્યા");
  // A doubled letter is a geminate, never a retroflex.
  check("mammi geminates", t("mammi"), "મમ્મિ");
  check("uttaraayaN geminates", t("uttaraayaN"), "ઉત્તરાયણ");
  // The capital is how you ask for a retroflex, same as on a real keyboard.
  check("harshal is dental", t("harshal"), "હર્શલ");
  check("harShal is retroflex", t("harShal"), "હર્ષલ");
  // A written final 'a' is ા, because the inherent one wouldn't be written.
  check("kavita ends long", t("kavita"), "કવિતા");
  check("kem does not", t("kem"), "કેમ");
  // Anything it has no letter for survives untouched.
  check("punctuation passes through", t("kem cho?"), "કેમ ચો?");
}

interface Case {
  guj: string;
  roman: string;
  label: string;
}

// ઙ and ઞ carry IAST romanizations (ṅa, ña) that no keyboard would ever take —
// which is fine, because they never stand alone and so never appear in a drill.
const letters: Case[] = [...VOWELS, ...CONSONANTS]
  .filter((a) => !a.rare)
  .map((a) => ({ guj: a.char, roman: a.roman, label: `letter ${a.char} (${a.roman})` }));

const cells: Case[] = barakshariGrid().flatMap(({ cells }) =>
  cells.map((c) => ({ guj: c.combined, roman: c.roman, label: `barakshari ${c.combined} (${c.roman})` })),
);

const words: Case[] = [
  ...ITEMS.map((i) => ({ guj: i.gujarati, roman: i.roman, label: `word ${i.gujarati} (${i.roman})` })),
  ...FREQUENCY_ITEMS.map((i) => ({ guj: i.gujarati, roman: i.roman, label: `freq ${i.gujarati} (${i.roman})` })),
  ...SCENARIOS.flatMap((s) =>
    Object.values(s.nodes).flatMap((n) => [
      ...(n.line ? [{ guj: n.line.gujarati, roman: n.line.roman, label: `vaat ${n.line.gujarati}` }] : []),
      ...n.choices.map((c) => ({
        guj: c.say.gujarati,
        roman: c.say.roman,
        label: `vaat ${c.say.gujarati}`,
      })),
    ]),
  ),
];

function accepted(c: Case): boolean {
  return matchTyped(segmentGujarati(c.guj), c.roman).complete;
}

const hardFailures: string[] = [];

// ── Tier 1: the alphabet must be exact, both ways ─────────────────────────
for (const c of [...letters, ...cells]) {
  if (!isTypable(c.guj)) {
    hardFailures.push(`${c.label}: no keyboard spelling at all — missing from the tables`);
    continue;
  }
  // What we'd *teach* has to work when typed.
  const canonical = typedCanonical(c.guj);
  if (!matchTyped(segmentGujarati(c.guj), canonical).complete) {
    hardFailures.push(`${c.label}: we'd teach "${canonical}", which the matcher rejects`);
  }
  // ...and so does the romanization we already show beside it.
  if (!accepted(c)) {
    hardFailures.push(
      `${c.label}: authored roman "${normalizeTyped(c.roman)}" not accepted (canonical "${canonical}")`,
    );
  }
}

// A cluster count check: segmentation should never lose or invent characters.
for (const c of [...letters, ...cells, ...words]) {
  const rebuilt = segmentGujarati(c.guj)
    .map((s) => s.guj)
    .join("");
  if (rebuilt !== c.guj.normalize("NFC")) {
    hardFailures.push(`${c.label}: segmentation doesn't round-trip → "${rebuilt}"`);
  }
}

// ── Tier 1b: the alphabet round-trips through the reverse engine ──────────
//
// Type what we teach, get back the letter we taught. Systematic, so a miss is a
// bug in the tables rather than a fact about Gujarati — this is what caught the
// mid-word retroflex and the string-final schwa in the first place.

/** ઙ and ઞ can't be reached by typing at all: they never stand alone, which is
 *  why our own alphabet data flags them `rare` and keeps them out of drills. A
 *  keyboard would give you ંગ for `nga` too. */
const UNREACHABLE = new Set(["ઙ", "ઞ"]);

for (const c of [...letters, ...cells]) {
  if (UNREACHABLE.has(c.guj)) continue;
  const back = transliterateRoman(typedCanonical(c.guj));
  if (back !== c.guj.normalize("NFC")) {
    hardFailures.push(
      `${c.label}: typing "${typedCanonical(c.guj)}" gives ${back}, not ${c.guj}`,
    );
  }
}

// ── Tier 2: vocabulary coverage ───────────────────────────────────────────
const rejected = words.filter((w) => !accepted(w));
const coverage = words.length ? (words.length - rejected.length) / words.length : 1;

console.log(`Letters + barakshari : ${letters.length + cells.length} checked`);
console.log(
  `Vocabulary           : ${words.length - rejected.length}/${words.length} typable (${(
    coverage * 100
  ).toFixed(0)}%)`,
);

if (rejected.length) {
  console.log(`\nNot typable from their authored romanization (excluded from the drill):`);
  for (const w of rejected) {
    console.log(`  ${w.guj.padEnd(18)} roman "${w.roman}"  ·  keyboard "${typedCanonical(w.guj)}"`);
  }
}

if (failures.length) {
  console.error(`\n\u2717 ${failures.length} behaviour check(s) failed:\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

if (hardFailures.length) {
  console.error(`\n✗ ${hardFailures.length} problem(s) in the script tables:\n`);
  for (const f of hardFailures) console.error(`  ${f}`);
  process.exit(1);
}

if (coverage < WORD_COVERAGE_FLOOR) {
  console.error(
    `\n✗ Only ${(coverage * 100).toFixed(0)}% of vocabulary is typable — floor is ${(
      WORD_COVERAGE_FLOOR * 100
    ).toFixed(0)}%. Something regressed in lib/core/translit.ts.`,
  );
  process.exit(1);
}

console.log(`\n✓ Script tables agree with the content.`);
