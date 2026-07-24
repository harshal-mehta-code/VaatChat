// ─────────────────────────────────────────────────────────────────────────
// Lekhan stroke data — how each letter is actually formed by hand.
//
// ✍️  AUTHORED BY A NATIVE WRITER, NOT GENERATED.
//
// A font can show you what a letter *looks* like; it cannot show you the order,
// the direction, or the starting point — which is the entire lesson. There is no
// open stroke-order dataset for Gujarati (Chinese and Japanese have one; the
// Indic scripts were skipped), and guessing would teach a habit that's hard to
// unlearn. So this file is filled in by hand, with an Apple Pencil, at
// /dev/stroke-lab — and what's below is the source of truth the app teaches
// from. See docs/LEKHAN.md §3.2.
//
// Coordinates live in a shared 1000×1000 em-box (GLYPH_BOX): every glyph is
// typeset identically, so relative size and position survive. That's what lets a
// matra authored once land correctly on top of its consonant.
//
// Kept deliberately data-only (no runtime imports) so the validation script can
// load it directly. Paste exports from Stroke Lab straight in here.
// ─────────────────────────────────────────────────────────────────────────

import type { StrokeGlyph } from "../core/types";

export const STROKE_GLYPHS: StrokeGlyph[] = [];
