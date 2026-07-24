// ─────────────────────────────────────────────────────────────────────────
// Word-composition check — does a word built from our letters hold together?
//
//   npm run check:compose
//
// Word handwriting is *derived* data (docs/LEKHAN.md §3.7): nobody authored
// કેમ, it's ક + ે + મ placed on a line. Derived data needs a guard, because a
// bad placement rule produces something that still looks like strokes and
// still animates — it just teaches the wrong shape.
//
// Three tiers:
//
//   BEHAVIOUR — the handful of placements the whole idea rests on: િ to the
//               left of its consonant though written after it, ે above, ુ
//               below, ા to the right, and writing order intact.
//   HARD      — every consonant × every matra (306 combinations). These are
//               fully systematic, so a mark landing in the wrong quadrant or
//               outside the box is a bug in the anchor rules. Non-zero exit.
//   SOFT      — vocabulary coverage. Conjuncts and nasal marks are deliberately
//               out of reach, so a word sitting out is expected, not a failure.
//               Reported, with a floor to catch a real regression.
// ─────────────────────────────────────────────────────────────────────────

import { GLYPH_BOX } from "../lib/core/strokes.ts";
import { segmentGujarati } from "../lib/core/translit.ts";
import {
  composeSegmented,
  inkBox,
  matraAnchor,
  LETTER_GAP,
  type ComposedWord,
} from "../lib/core/compose.ts";
import { STROKE_GLYPHS } from "../lib/content/stroke-data.ts";
import { VOWELS, CONSONANTS } from "../lib/content/akshar.ts";
import { ITEMS } from "../lib/content/units.ts";
import { FREQUENCY_ITEMS } from "../lib/content/frequency.ts";

/** Below this share of vocabulary composable, something has regressed. */
const WORD_COVERAGE_FLOOR = 0.55;

// The char → glyph map, rebuilt from data-only modules. (lib/content/strokes.ts
// derives the same thing for the app, but this loader can't follow its imports
// — same arrangement as check:strokes.)
const BY_ID = Object.fromEntries(STROKE_GLYPHS.map((g) => [g.id, g]));
const GLYPH_BY_CHAR = Object.fromEntries(
  [
    ...VOWELS.map((v) => [v.char, BY_ID[v.id]] as const),
    ...CONSONANTS.map((c) => [c.char, BY_ID[c.id]] as const),
    ...VOWELS.filter((v) => v.matra).map(
      (v) => [v.matra as string, BY_ID[v.id.replace(/^v-/, "m-")]] as const,
    ),
  ].filter(([, g]) => g && g.strokes.length > 0),
);

const BASE = GLYPH_BY_CHAR["ક"];
if (!BASE) {
  console.error("✗ ક has no stroke data — every matra is authored against it.");
  process.exit(1);
}

function compose(text: string): ComposedWord | null {
  const word = text.normalize("NFC");
  return composeSegmented(
    word,
    segmentGujarati(word),
    (char) => GLYPH_BY_CHAR[char],
    BASE,
    GLYPH_BOX,
  );
}

const failures: string[] = [];
function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) failures.push(`${label}: expected ${e}, got ${a}`);
}
function expect(label: string, ok: boolean) {
  if (!ok) failures.push(label);
}

// ── Tier 0: the placements the feature rests on ───────────────────────────

{
  const divas = compose("દિવસ");
  expect("દિવસ composes", divas !== null);
  if (divas) {
    check("દિવસ is three letters", divas.clusters.map((c) => c.guj), ["દિ", "વ", "સ"]);

    // The teaching moment: િ appears to the left, but the hand draws it second.
    // Both halves of that have to be true in the composed data at once.
    const first = divas.clusters[0];
    const body = inkBox(divas.strokes.slice(first.from, first.from + first.count - 1));
    const matra = inkBox(divas.strokes.slice(first.from + first.count - 1, first.from + first.count));
    expect("દિ draws દ before િ", first.count === 2);
    expect("દિ's િ reaches left of દ", matra.minX < body.minX);
    expect("દિ's િ arcs over દ", matra.minY < body.minY);

    // Letters march left to right and never sit on top of one another.
    for (let i = 1; i < divas.clusters.length; i++) {
      expect(
        `દિવસ letter ${i + 1} follows letter ${i}`,
        divas.clusters[i].centerX > divas.clusters[i - 1].centerX,
      );
    }
  }

  const kem = compose("કેમ છો");
  expect("કેમ છો composes", kem !== null);
  if (kem) {
    check("કેમ છો is four letters", kem.clusters.map((c) => c.guj), ["કે", "મ", "છો"]);
    expect("કેમ છો is wider than it is tall", kem.width > kem.height);
    const [ke, ma, chho] = kem.clusters;
    // The space between words must read as wider than the space between letters.
    const gapInWord = ma.centerX - ke.centerX;
    const gapAtBreak = chho.centerX - ma.centerX;
    expect("the word break is wider than a letter gap", gapAtBreak > gapInWord);
  }

  // Everything a word can contain that we can't draw.
  check("a conjunct sits out", compose("કૃષ્ણ"), null);
  check("an anusvara sits out", compose("શું"), null);
  check("punctuation sits out", compose("કેમ?"), null);
  check("empty text sits out", compose(""), null);

  // A single letter still gets a square pad rather than a sliver.
  const ka = compose("ક");
  expect("a one-letter word gets a square box", ka !== null && ka.width === GLYPH_BOX);
}

// ── Tier 1: every consonant × every matra ─────────────────────────────────
// Systematic, so a mark in the wrong quadrant is a bug in the anchor rules.

const hardFailures: string[] = [];
const matras = VOWELS.filter((v) => v.matra).map((v) => v.matra as string);
let combos = 0;

/** Combinations we knowingly can't draw — pinned so the list can't grow quietly. */
const UNCOMPOSABLE = new Set(["ફૂ"]);

for (const consonant of CONSONANTS) {
  for (const matra of matras) {
    const word = compose(consonant.char + matra);
    combos++;
    const label = `${consonant.char}${matra}`;
    if (!word) {
      // ફૂ is the one combination the box genuinely can't hold: ફ's tail hangs
      // so low that a ૂ clear of it would fall out the bottom. Refusing to draw
      // it is the intended answer, so it's listed rather than failed.
      if (!UNCOMPOSABLE.has(label)) {
        hardFailures.push(`${label}: doesn't compose at all`);
      }
      continue;
    }
    if (UNCOMPOSABLE.has(label)) {
      hardFailures.push(`${label}: expected to be out of reach, but it composed`);
      continue;
    }
    const cluster = word.clusters[0];
    if (!cluster || word.clusters.length !== 1) {
      hardFailures.push(`${label}: expected one cluster, got ${word.clusters.length}`);
      continue;
    }
    const bodyStrokes = word.strokes.slice(cluster.from, cluster.from + BY_ID[consonant.id].strokes.length);
    const markStrokes = word.strokes.slice(cluster.from + BY_ID[consonant.id].strokes.length, cluster.from + cluster.count);
    if (markStrokes.length === 0) {
      hardFailures.push(`${label}: the matra produced no strokes`);
      continue;
    }
    const body = inkBox(bodyStrokes);
    const mark = inkBox(markStrokes);

    // Nothing may leave the em box.
    const all = inkBox(word.strokes);
    if (all.minX < 0 || all.maxX > word.width || all.minY < 0 || all.maxY > word.height) {
      hardFailures.push(
        `${label}: ink escapes the box — x[${r(all.minX)},${r(all.maxX)}] y[${r(all.minY)},${r(all.maxY)}] in ${r(word.width)}×${r(word.height)}`,
      );
    }

    switch (matraAnchor(matra)) {
      case "right":
        if (mark.maxX <= body.maxX) {
          hardFailures.push(`${label}: ${matra} should reach past ${consonant.char}'s right edge`);
        }
        break;
      case "wrap":
        // િ has to span the letter: down its left side, over its top.
        if (mark.minX > body.minX) {
          hardFailures.push(`${label}: ${matra} should come down left of ${consonant.char}`);
        }
        if (mark.maxX < body.maxX - 40) {
          hardFailures.push(`${label}: ${matra} should arc across the top of ${consonant.char}`);
        }
        break;
      case "above":
      case "below": {
        // Over or under the letter, never off to one side...
        const centred = mark.minX > body.minX - 130 && mark.maxX < body.maxX + 130;
        if (!centred) {
          hardFailures.push(
            `${label}: ${matra} drifted off ${consonant.char} — x[${r(mark.minX)},${r(mark.maxX)}] vs body x[${r(body.minX)},${r(body.maxX)}]`,
          );
        }
        // ...and never drawn *through* it. This is the one ક couldn't teach us:
        // it has no descender, so a ુ carried across unchanged used to run
        // straight through ફ's tail.
        const clear = matraAnchor(matra) === "above" ? mark.maxY < body.minY : mark.minY > body.maxY;
        if (!clear) {
          hardFailures.push(
            `${label}: ${matra} overlaps ${consonant.char} — mark y[${r(mark.minY)},${r(mark.maxY)}], body y[${r(body.minY)},${r(body.maxY)}]`,
          );
        }
        break;
      }
      default:
        hardFailures.push(`${label}: ${matra} has no anchor rule`);
    }
  }
}

// Letters on a line must not overlap, or a word reads as a smudge.
for (const text of ["કેમ", "દિવસ", "પાણી", "ઘર", "કાલે"]) {
  const word = compose(text);
  if (!word) continue;
  for (let i = 1; i < word.clusters.length; i++) {
    const prev = word.clusters[i - 1];
    const cur = word.clusters[i];
    const a = inkBox(word.strokes.slice(prev.from, prev.from + prev.count));
    const b = inkBox(word.strokes.slice(cur.from, cur.from + cur.count));
    const gap = b.minX - a.maxX;
    if (Math.abs(gap - LETTER_GAP) > 1) {
      hardFailures.push(`${text}: letters ${i} and ${i + 1} sit ${r(gap)} apart, expected ${LETTER_GAP}`);
    }
  }
}

// ── Tier 2: how much of the vocabulary we can actually write ──────────────

interface Case {
  guj: string;
  label: string;
}
const words: Case[] = [
  ...ITEMS.map((i) => ({ guj: i.gujarati, label: `${i.gujarati} (${i.roman})` })),
  ...FREQUENCY_ITEMS.map((i) => ({ guj: i.gujarati, label: `${i.gujarati} (${i.roman})` })),
];

const composable = words.filter((w) => compose(w.guj) !== null);
const coverage = words.length ? composable.length / words.length : 1;

console.log(`Consonant × matra    : ${combos} combinations checked`);
console.log(
  `Vocabulary           : ${composable.length}/${words.length} writable (${(coverage * 100).toFixed(0)}%)`,
);

const out = words.filter((w) => compose(w.guj) === null);
if (out.length) {
  console.log(`\nNot writable yet (conjuncts and nasal marks — see docs/LEKHAN.md §3.7):`);
  const shown = out.slice(0, 12);
  for (const w of shown) console.log(`  ${w.label}`);
  if (out.length > shown.length) console.log(`  …and ${out.length - shown.length} more`);
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} behaviour check(s) failed:\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

if (hardFailures.length) {
  console.error(`\n✗ ${hardFailures.length} problem(s) placing letters:\n`);
  for (const f of hardFailures.slice(0, 40)) console.error(`  ${f}`);
  if (hardFailures.length > 40) console.error(`  …and ${hardFailures.length - 40} more`);
  process.exit(1);
}

if (coverage < WORD_COVERAGE_FLOOR) {
  console.error(
    `\n✗ Only ${(coverage * 100).toFixed(0)}% of vocabulary composes — floor is ${(
      WORD_COVERAGE_FLOOR * 100
    ).toFixed(0)}%. Something regressed in lib/core/compose.ts.`,
  );
  process.exit(1);
}

console.log(`\n✓ Words compose cleanly from the letters we've authored.`);

function r(n: number): number {
  return Math.round(n);
}
