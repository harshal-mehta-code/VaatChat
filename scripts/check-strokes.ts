// ─────────────────────────────────────────────────────────────────────────
// Stroke-data integrity check — the handwriting equivalent of check:audio.
//
// Hand-authored data is the app's source of truth for how a letter is formed,
// so it earns the same guard rails as the audio: nothing malformed, nothing
// outside the em-box, nothing degenerate that would animate as a dot.
//
//   npm run check:strokes
//
// Also prints authoring coverage, so it doubles as the progress report.
// ─────────────────────────────────────────────────────────────────────────

import { GLYPH_BOX, pathLength } from "../lib/core/strokes.ts";
import { STROKE_GLYPHS } from "../lib/content/stroke-data.ts";
import { VOWELS, CONSONANTS } from "../lib/content/akshar.ts";

// The catalogue, rebuilt from the letter tables. (lib/content/strokes.ts derives
// the same thing for the app, but this loader can't follow its imports — so we
// keep the script's dependency on data-only modules.)
const WRITING_TARGETS = [
  ...VOWELS.map((v) => ({ id: v.id, char: v.char })),
  ...CONSONANTS.map((c) => ({ id: c.id, char: c.char })),
  ...VOWELS.filter((v) => v.matra).map((v) => ({
    id: v.id.replace(/^v-/, "m-"),
    char: v.matra as string,
  })),
];
const WRITING_TARGET_BY_ID: Record<string, { id: string; char: string }> =
  Object.fromEntries(WRITING_TARGETS.map((t) => [t.id, t]));

/** Ink may sit slightly proud of the box (a descender, a flourish) — not miles out. */
const SLACK = 80;
/** Anything shorter than this isn't a stroke, it's a slip of the pen. */
const MIN_LENGTH = 20;

const problems: string[] = [];
const seen = new Set<string>();

for (const g of STROKE_GLYPHS) {
  const label = `${g.id} (${g.char})`;

  if (!WRITING_TARGET_BY_ID[g.id]) problems.push(`${label}: not a known letter or matra`);
  if (seen.has(g.id)) problems.push(`${label}: duplicate entry`);
  seen.add(g.id);

  const expected = WRITING_TARGET_BY_ID[g.id]?.char;
  if (expected && expected !== g.char) {
    problems.push(`${label}: char should be "${expected}"`);
  }

  if (g.strokes.length === 0) {
    problems.push(`${label}: no strokes`);
    continue;
  }

  g.strokes.forEach((s, i) => {
    const n = `${label} stroke ${i + 1}`;
    if (s.points.length < 2) {
      problems.push(`${n}: needs at least 2 points`);
      return;
    }
    for (const [x, y] of s.points) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        problems.push(`${n}: non-numeric point`);
        return;
      }
      if (x < -SLACK || y < -SLACK || x > GLYPH_BOX + SLACK || y > GLYPH_BOX + SLACK) {
        problems.push(`${n}: point [${Math.round(x)}, ${Math.round(y)}] is outside the em-box`);
        return;
      }
    }
    if (pathLength(s.points) < MIN_LENGTH) problems.push(`${n}: degenerate (too short to draw)`);
  });
}

const authored = STROKE_GLYPHS.filter((g) => g.strokes.length > 0).length;
const total = WRITING_TARGETS.length;
const missing = WRITING_TARGETS.filter((t) => !seen.has(t.id));

if (problems.length > 0) {
  console.error(`✗ ${problems.length} problem(s) in stroke data:\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

console.log(`✓ Stroke data valid — ${authored}/${total} letters authored.`);
if (missing.length > 0) {
  const preview = missing.slice(0, 12).map((t) => t.char).join(" ");
  console.log(
    `  ${missing.length} still to author at /dev/stroke-lab: ${preview}${missing.length > 12 ? " …" : ""}`,
  );
}
