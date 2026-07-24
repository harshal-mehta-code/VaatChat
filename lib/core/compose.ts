// ─────────────────────────────────────────────────────────────────────────
// Composing a whole word's handwriting out of the letters we already have.
//
// This is the promise docs/LEKHAN.md §3.7 made: author ~53 glyphs once, and
// *every* word you can write with them composes for free. No new capture
// session, no per-word data — a word's stroke recipe is its clusters' letters
// and matras, laid on a shared baseline in the order a hand actually moves.
//
// Pure, like the rest of lib/core: no React, no DOM, no content imports. It
// takes glyphs in and gives placed strokes back, so an iOS client reuses it.
//
// The one genuinely interesting problem is where a matra goes.
// ─────────────────────────────────────────────────────────────────────────

// Type-only imports on purpose: they vanish at runtime, which keeps this module
// loadable straight from node by the guard script. Same discipline as
// lib/content/stroke-data.ts, and the reason the em box arrives as an argument
// instead of being imported from ./strokes.
import type { Pt, Stroke, StrokeGlyph } from "./types";
import type { Cluster } from "./translit";

/** Space between adjacent letters' ink, in em-box units. */
export const LETTER_GAP = 64;
/** Breathing room at the start and end of the line. */
export const WORD_MARGIN = 80;
/** A word break. Wider than a letter gap, narrower than a letter. */
export const SPACE_WIDTH = 200;

/**
 * How a matra follows its consonant when the consonant isn't the ક it was
 * authored against.
 *
 * Every matra was captured in context on ક, so its stored position already
 * encodes the right relationship — we only have to carry that relationship
 * across to a letter of a different shape. Mostly that's a horizontal shift:
 * every glyph is typeset on the same baseline at the same size, so a matra's
 * height above (or below) the line is a constant of the script rather than of
 * the letter underneath it. The exception is a letter that reaches further up
 * or down than ક does, which the mark has to give way to — see MATRA_CLEARANCE.
 *
 *   right   ા ી ો ૌ — live off the right shoulder; keep their distance from
 *                     the consonant's right edge.
 *   above   ે ૈ     — small marks over the body; keep their offset from its
 *                     middle, and stay clear of its ceiling.
 *   below   ુ ૂ     — the same, under it, clear of any descender.
 *   wrap    િ       — the odd one out, and the interesting one. It *starts*
 *                     above the consonant's right shoulder, arcs left over the
 *                     top, and comes down on its left — so it spans the whole
 *                     letter and has to stretch to fit it, not just shift.
 */
type Anchor = "right" | "above" | "below" | "wrap";

const MATRA_ANCHOR: Record<string, Anchor> = {
  "ા": "right",
  "િ": "wrap",
  "ી": "right",
  "ુ": "below",
  "ૂ": "below",
  "ે": "above",
  "ૈ": "above",
  "ો": "right",
  "ૌ": "right",
};

/**
 * Whitespace a mark keeps between itself and its letter.
 *
 * ક is a middling letter — average width, an ordinary ceiling, no descender —
 * which is exactly why the matras were authored on it. But ફ dives well below
 * where ક stops, and a ુ carried across unchanged gets drawn straight through
 * that tail. So a mark above or below moves out of the letter's way, keeping
 * the spacing it was authored with rather than a fixed one.
 */
const MATRA_CLEARANCE = 30;
/** Marks may not be pushed out of the box; the pad has no room below it. */
const BOX_PADDING = 12;

export function matraAnchor(char: string): Anchor | undefined {
  return MATRA_ANCHOR[char];
}

export interface Box {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** The bounding box of some ink. Empty input gives a degenerate box at 0,0. */
export function inkBox(strokes: Stroke[]): Box {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of strokes) {
    for (const [x, y] of s.points) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (minX === Infinity) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  return { minX, maxX, minY, maxY };
}

const midX = (b: Box) => (b.minX + b.maxX) / 2;
const widthOf = (b: Box) => Math.max(1, b.maxX - b.minX);

/** One cluster of a word, with its parts already resolved to authored glyphs. */
export interface ClusterGlyphs {
  /** The cluster's Gujarati text, e.g. "કે". A single space for a word break. */
  guj: string;
  /** The letter first, then its matra — the order a hand writes them. Empty
   *  for a word break. */
  glyphs: StrokeGlyph[];
}

export interface ComposedCluster {
  guj: string;
  /** Index of this cluster's first stroke within the word's `strokes`. */
  from: number;
  count: number;
  /** Horizontal middle of its ink, for pointing at it in feedback. */
  centerX: number;
}

export interface ComposedWord {
  word: string;
  /** Layout box width. Height is always GLYPH_BOX — one line, shared baseline. */
  width: number;
  height: number;
  /** Every stroke, placed, in writing order. */
  strokes: Stroke[];
  clusters: ComposedCluster[];
}

function shift(stroke: Stroke, dx: number, dy = 0): Stroke {
  return { ...stroke, points: stroke.points.map(([x, y]) => [x + dx, y + dy] as Pt) };
}

/**
 * Place a cluster's strokes in the em-box: the letter exactly where it was
 * authored, its matra carried across from ક to this letter.
 *
 * Null when the mark can't be given room without running through the letter.
 * ફૂ is the one real case — ફ's tail hangs so low that a ૂ under it would fall
 * off the bottom of the box — and refusing is the honest answer, the same one
 * the typing track gives for a word it can't spell.
 */
export function placeCluster(
  cluster: ClusterGlyphs,
  base: StrokeGlyph,
  box: number,
): Stroke[] | null {
  const [letter, ...marks] = cluster.glyphs;
  if (!letter) return [];
  const out: Stroke[] = letter.strokes.map((s) => ({ ...s, points: s.points.map((p) => [...p] as Pt) }));
  if (marks.length === 0) return out;

  const body = inkBox(letter.strokes);
  const ref = inkBox(base.strokes);

  for (const mark of marks) {
    // Every matra is in the table (check:compose proves it); an unlisted mark
    // is treated as sitting over the body, which is the least surprising guess.
    const anchor = MATRA_ANCHOR[mark.char] ?? "above";
    if (anchor === "wrap") {
      // Stretch across the letter: the mark's own left and right edges land on
      // the letter's. Horizontal only — a matra squashed vertically would stop
      // sitting on the line, and the line is the one thing every glyph shares.
      const k = widthOf(body) / widthOf(ref);
      out.push(
        ...mark.strokes.map((s) => ({
          ...s,
          points: s.points.map(([x, y]) => [body.minX + (x - ref.minX) * k, y] as Pt),
        })),
      );
      continue;
    }
    const dx = anchor === "right" ? body.maxX - ref.maxX : midX(body) - midX(ref);

    // Above and below marks step out of the letter's way if it reaches further
    // than ક did. `right` marks sit beside the letter, so nothing to dodge.
    let dy = 0;
    const mine = inkBox(mark.strokes);
    if (anchor === "above") {
      dy = Math.min(0, body.minY - MATRA_CLEARANCE - mine.maxY);
      dy = Math.max(dy, BOX_PADDING - mine.minY);
      if (mine.maxY + dy >= body.minY) return null;
    } else if (anchor === "below") {
      dy = Math.max(0, body.maxY + MATRA_CLEARANCE - mine.minY);
      dy = Math.min(dy, box - BOX_PADDING - mine.maxY);
      if (mine.minY + dy <= body.maxY) return null;
    }

    out.push(...mark.strokes.map((s) => shift(s, dx, dy)));
  }
  return out;
}

/**
 * Lay a word out on one line.
 *
 * Clusters are packed by their *ink*, not by a typeset advance width, because
 * ink is what we have and what the learner traces. That handles િ for free:
 * its stroke reaches left past its own consonant, so the packer simply leaves
 * room for it and the previous letter never collides.
 *
 * @param base The consonant the matras were authored against (ક).
 */
export function composeWord(
  word: string,
  clusters: ClusterGlyphs[],
  base: StrokeGlyph,
  box: number,
): ComposedWord | null {
  const strokes: Stroke[] = [];
  const placed: ComposedCluster[] = [];
  let cursor = WORD_MARGIN;

  for (const cluster of clusters) {
    if (cluster.glyphs.length === 0) {
      cursor += SPACE_WIDTH;
      continue;
    }
    const ink = placeCluster(cluster, base, box);
    if (!ink) return null;
    const bounds = inkBox(ink);
    const dx = cursor - bounds.minX;
    const from = strokes.length;
    for (const s of ink) strokes.push(shift(s, dx));
    placed.push({
      guj: cluster.guj,
      from,
      count: ink.length,
      centerX: midX(bounds) + dx,
    });
    cursor = bounds.maxX + dx + LETTER_GAP;
  }

  let width = Math.max(WORD_MARGIN, cursor - LETTER_GAP) + WORD_MARGIN;

  // A one- or two-letter word would otherwise get a tall narrow sliver of a
  // pad, which is horrible to write in. Give it at least a square and centre
  // the ink in it.
  if (width < box) {
    const shiftBy = (box - width) / 2;
    for (let i = 0; i < strokes.length; i++) strokes[i] = shift(strokes[i], shiftBy);
    for (const c of placed) c.centerX += shiftBy;
    width = box;
  }

  return { word, width, height: box, strokes, clusters: placed };
}

/**
 * The whole pipeline: segmented text in, a drawable word out — or null if we
 * can't honestly draw it yet.
 *
 * Two things put a word out of reach, both deliberate:
 *
 *  - **Conjuncts** (ક્ષ, શ્રી, કૃષ્ણ). A halant stack isn't two letters side by
 *    side; it's a fused shape with strokes of its own, and pretending otherwise
 *    would teach a form nobody writes. docs/LEKHAN.md §2.7 quarantined these,
 *    and unlike the typing half, the quarantine holds.
 *  - **The nasal and visarga marks** (ં, ઁ, ઃ). Nobody has authored them, so a
 *    word needing one would come out missing a piece.
 *
 * The test for both is the same, and pleasingly cheap: the segmenter reports
 * each cluster's writable `parts`, so if those parts don't spell the cluster
 * back, it contains something that isn't a letter we can draw.
 */
export function composeSegmented(
  word: string,
  clusters: Cluster[],
  glyphFor: (char: string) => StrokeGlyph | undefined,
  base: StrokeGlyph,
  box: number,
): ComposedWord | null {
  if (clusters.map((c) => c.guj).join("") !== word) return null;

  const resolved: ClusterGlyphs[] = [];
  for (const cluster of clusters) {
    if (cluster.literal) {
      // A space is a gap we can lay out. Anything else — punctuation, a digit —
      // has no stroke data and never will.
      if (!/^\s+$/.test(cluster.guj)) return null;
      resolved.push({ guj: " ", glyphs: [] });
      continue;
    }
    if (cluster.parts.join("") !== cluster.guj) return null;
    const glyphs: StrokeGlyph[] = [];
    for (const part of cluster.parts) {
      const glyph = glyphFor(part);
      if (!glyph || glyph.strokes.length === 0) return null;
      glyphs.push(glyph);
    }
    resolved.push({ guj: cluster.guj, glyphs });
  }

  if (resolved.every((c) => c.glyphs.length === 0)) return null;
  return composeWord(word, resolved, base, box);
}
