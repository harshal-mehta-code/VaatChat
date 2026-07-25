// ─────────────────────────────────────────────────────────────────────────
// Lekhan — what the writing track can teach, and how it's laid out.
//
// The hand-authored stroke data itself lives in ./stroke-data (data-only, so
// the validation script can load it without a bundler). This module wraps it
// with the letter/matra catalogue and the shared typesetting frame.
// ─────────────────────────────────────────────────────────────────────────

import type { Akshar, StrokeGlyph } from "../core/types";
import { segmentGujarati } from "../core/translit";
import { composeSegmented, type ComposedWord } from "../core/compose";
import { VOWELS, CONSONANTS } from "./akshar";
import { STROKE_GLYPHS } from "./stroke-data";

export { STROKE_GLYPHS };
export type { StrokeGlyph, ComposedWord };

/**
 * How the faint reference glyph is typeset inside the em-box. These are fixed
 * on purpose: authoring and practice must share one coordinate frame, or a
 * matra authored today won't sit on its consonant tomorrow.
 */
export const GLYPH_FONT_SIZE = 700;
export const GLYPH_BASELINE = 745;
export const GLYPH_CENTER_X = 500;

/** The stroke id for a vowel's matra form: "v-aa" → "m-aa". */
export function matraId(vowelId: string): string {
  return vowelId.replace(/^v-/, "m-");
}

/** The consonant a matra is authored against, so its position is in context. */
export const MATRA_BASE = "ક";

export interface WritingTarget {
  /** Stroke-glyph id. */
  id: string;
  /** What to draw. For a matra this is the bare mark, e.g. "ા". */
  char: string;
  /** What to show faintly underneath while authoring/tracing, e.g. "કા". */
  display: string;
  /** Human label for the picker. */
  label: string;
  kind: "vowel" | "consonant" | "matra";
  /** For matras, the akshar it derives from. */
  akshar?: Akshar;
}

/**
 * Everything the writing track can teach: every independent letter, plus every
 * matra. Author these ~46 and word-writing composes for free (docs/LEKHAN.md §3.7).
 */
export const WRITING_TARGETS: WritingTarget[] = [
  ...VOWELS.map((v) => ({
    id: v.id,
    char: v.char,
    display: v.char,
    label: `${v.char}  ${v.roman}`,
    kind: "vowel" as const,
    akshar: v,
  })),
  ...CONSONANTS.map((c) => ({
    id: c.id,
    char: c.char,
    display: c.char,
    label: `${c.char}  ${c.roman}`,
    kind: "consonant" as const,
    akshar: c,
  })),
  ...VOWELS.filter((v) => v.matra).map((v) => ({
    id: matraId(v.id),
    char: v.matra as string,
    display: MATRA_BASE + v.matra,
    label: `${MATRA_BASE}${v.matra}  matra for ${v.roman}`,
    kind: "matra" as const,
    akshar: v,
  })),
];

export const WRITING_TARGET_BY_ID: Record<string, WritingTarget> = Object.fromEntries(
  WRITING_TARGETS.map((t) => [t.id, t]),
);

export const STROKE_GLYPH_BY_ID: Record<string, StrokeGlyph> = Object.fromEntries(
  STROKE_GLYPHS.map((g) => [g.id, g]),
);

export function strokeGlyph(id: string): StrokeGlyph | undefined {
  return STROKE_GLYPH_BY_ID[id];
}

export function hasStrokes(id: string): boolean {
  return Boolean(STROKE_GLYPH_BY_ID[id]?.strokes.length);
}

/** Letters that can be *practised* today — i.e. someone has authored them. */
export function writableTargets(): WritingTarget[] {
  return WRITING_TARGETS.filter((t) => hasStrokes(t.id));
}

// ── Words ─────────────────────────────────────────────────────────────────

/** Every letter and matra, reachable by the character it draws. */
const GLYPH_BY_CHAR: Record<string, StrokeGlyph> = Object.fromEntries(
  WRITING_TARGETS.flatMap((t) => {
    const glyph = STROKE_GLYPH_BY_ID[t.id];
    return glyph && glyph.strokes.length > 0 ? [[t.char, glyph] as const] : [];
  }),
);

/** The consonant every matra was authored on top of — the reference frame. */
const BASE_GLYPH = GLYPH_BY_CHAR[MATRA_BASE];

/**
 * A word's full stroke recipe, composed from the letters we've authored — or
 * null if we can't honestly draw it yet. The rule for "can't" lives in
 * lib/core/compose.ts; this only supplies the glyphs and the coordinate frame.
 */
export function composeGujarati(text: string): ComposedWord | null {
  if (!BASE_GLYPH) return null;
  const word = text.normalize("NFC");
  return composeSegmented(
    word,
    segmentGujarati(word),
    (char) => GLYPH_BY_CHAR[char],
    BASE_GLYPH,
  );
}
