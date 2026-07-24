// ─────────────────────────────────────────────────────────────────────────
// Handwriting geometry & scoring — the brain behind Lekhan.
//
// Deliberately pure: no React, no DOM, no network. Everything here is plain
// math over polylines, which means (a) it runs offline with zero latency,
// (b) it is explainable — every point deducted maps to a named reason we can
// say out loud to the learner, and (c) an iOS client reuses it verbatim.
//
// See docs/LEKHAN.md §3.5 for the design rationale.
// ─────────────────────────────────────────────────────────────────────────

import type { Pt, Stroke } from "./types";

/** The shared em-box every glyph is authored in. */
export const GLYPH_BOX = 1000;

/** Points per stroke used for comparison. 64 is plenty for letter-sized shapes. */
const SAMPLES = 64;

// ── Basic geometry ─────────────────────────────────────────────────────────

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function pathLength(pts: Pt[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += dist(pts[i - 1], pts[i]);
  return total;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function bbox(strokes: Pt[][]): Box {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) {
    for (const [x, y] of s) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Resample a polyline to exactly `n` points, equally spaced by arc length. */
export function resample(pts: Pt[], n: number = SAMPLES): Pt[] {
  if (pts.length === 0) return [];
  if (pts.length === 1 || pathLength(pts) === 0) {
    return Array.from({ length: n }, () => [pts[0][0], pts[0][1]] as Pt);
  }
  const step = pathLength(pts) / (n - 1);
  const out: Pt[] = [[pts[0][0], pts[0][1]]];
  let prev = pts[0];
  let i = 1;
  let acc = 0;
  while (out.length < n && i < pts.length) {
    const seg = dist(prev, pts[i]);
    if (acc + seg >= step && seg > 0) {
      const t = (step - acc) / seg;
      const np: Pt = [
        prev[0] + t * (pts[i][0] - prev[0]),
        prev[1] + t * (pts[i][1] - prev[1]),
      ];
      out.push(np);
      prev = np;
      acc = 0;
    } else {
      acc += seg;
      prev = pts[i];
      i++;
    }
  }
  const last = pts[pts.length - 1];
  while (out.length < n) out.push([last[0], last[1]]);
  return out;
}

/**
 * Ramer–Douglas–Peucker simplification. Captured ink arrives at ~120 points per
 * stroke; this trims it to the handful that actually define the shape, so the
 * authored data stays small, readable, and diffable in git.
 */
export function simplify(pts: Pt[], epsilon = 6): Pt[] {
  if (pts.length < 3) return [...pts];
  let maxD = 0;
  let index = 0;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpendicularDistance(pts[i], a, b);
    if (d > maxD) {
      maxD = d;
      index = i;
    }
  }
  if (maxD <= epsilon) return [a, b];
  const left = simplify(pts.slice(0, index + 1), epsilon);
  const right = simplify(pts.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

function perpendicularDistance(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return dist(p, a);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

/**
 * A smooth SVG path through the points (quadratic curves via midpoints).
 * Used for both the reference animation and the learner's replayed ink.
 */
export function toSvgPath(pts: Pt[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${r(pts[0][0])} ${r(pts[0][1])} l 0.01 0`;
  if (pts.length === 2) {
    return `M ${r(pts[0][0])} ${r(pts[0][1])} L ${r(pts[1][0])} ${r(pts[1][1])}`;
  }
  let d = `M ${r(pts[0][0])} ${r(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q ${r(pts[i][0])} ${r(pts[i][1])} ${r(mx)} ${r(my)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${r(last[0])} ${r(last[1])}`;
  return d;
}

const r = (n: number) => Math.round(n * 10) / 10;

// ── Scoring ────────────────────────────────────────────────────────────────

/**
 * Named reasons for every deduction. The UI turns these into one kind sentence
 * each — we never show a bare number, because "62%" teaches nothing.
 */
export type FeedbackCode =
  | "start-off"
  | "reversed"
  | "too-short"
  | "overshoot"
  | "off-path"
  | "wrong-order"
  | "missing-stroke"
  | "extra-stroke";

export interface StrokeScore {
  score: number; // 0–100
  codes: FeedbackCode[];
}

/** How forgiving to be. Tolerances are in em-box units (glyph is 1000 wide). */
export interface Tolerance {
  /** Mean point-to-point distance that still scores full marks → 0. */
  shape: number;
  /** Start/end point slack. */
  endpoint: number;
}

export type WriteMode = "trace" | "copy" | "memory";

/**
 * Trace is generous (she's following a line under her pen); memory is tighter,
 * but only *after* the whole glyph is re-aligned (§ scoreGlyph) — writing the
 * right letter slightly off-centre in a blank box is not an error.
 */
export const TOLERANCE: Record<WriteMode, Tolerance> = {
  trace: { shape: 115, endpoint: 150 },
  copy: { shape: 95, endpoint: 130 },
  memory: { shape: 85, endpoint: 120 },
};

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Ceiling for a stroke drawn backwards — right shape, missed lesson. */
const REVERSED_CAP = 55;

function meanDistance(a: Pt[], b: Pt[]): number {
  let total = 0;
  for (let i = 0; i < a.length; i++) total += dist(a[i], b[i]);
  return total / a.length;
}

/** Mean cosine similarity between the two paths' step directions. */
function directionAgreement(a: Pt[], b: Pt[]): number {
  let sum = 0;
  let n = 0;
  for (let i = 1; i < a.length; i++) {
    const ax = a[i][0] - a[i - 1][0], ay = a[i][1] - a[i - 1][1];
    const bx = b[i][0] - b[i - 1][0], by = b[i][1] - b[i - 1][1];
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (la === 0 || lb === 0) continue;
    sum += (ax * bx + ay * by) / (la * lb);
    n++;
  }
  return n === 0 ? 0 : sum / n;
}

/** Score one drawn stroke against one reference stroke. */
export function scoreStroke(ref: Pt[], user: Pt[], tol: Tolerance): StrokeScore {
  if (ref.length < 2 || user.length < 2) return { score: 0, codes: ["off-path"] };

  const r0 = resample(ref);
  const u0 = resample(user);
  const uRev = resample([...user].reverse());

  const dFwd = meanDistance(r0, u0);
  const dRev = meanDistance(r0, uRev);
  // Only call it "reversed" if flipping is *clearly* better — otherwise a blobby
  // stroke that fits both ways would get scolded for nothing.
  const reversed = dRev < dFwd * 0.8;
  const aligned = reversed ? uRev : u0;
  const d = Math.min(dFwd, dRev);

  const shape = clamp01(1 - d / tol.shape);
  const startD = dist(r0[0], aligned[0]);
  const endD = dist(r0[r0.length - 1], aligned[aligned.length - 1]);
  const endpoints = clamp01(1 - (startD + endD) / 2 / tol.endpoint);

  const refLen = pathLength(ref);
  const ratio = refLen === 0 ? 1 : pathLength(user) / refLen;
  const coverage = clamp01(1 - Math.abs(1 - ratio) / 0.6);

  const direction = reversed ? 0 : clamp01(directionAgreement(r0, u0));

  const codes: FeedbackCode[] = [];
  if (reversed) codes.push("reversed");
  if (startD > tol.endpoint) codes.push("start-off");
  // Length alone doesn't mean the stroke ran long or short — shaky ink is longer
  // too. Only call it out when the stroke also *ended* somewhere it shouldn't,
  // otherwise we'd tell someone to "ease off at the end" for a case of nerves.
  const endMissed = endD > tol.endpoint / 2;
  if (ratio < 0.72 && endMissed) codes.push("too-short");
  else if (ratio > 1.35 && endMissed) codes.push("overshoot");
  if (shape < 0.5) codes.push("off-path");

  let score =
    100 * (0.5 * shape + 0.15 * endpoints + 0.15 * coverage + 0.2 * direction);
  // A backwards stroke traces the right shape, so the geometry barely notices —
  // but direction *is* the lesson here, so it can't come out looking near-perfect.
  if (reversed) score = Math.min(score, REVERSED_CAP);
  return { score: Math.round(score), codes };
}

export interface GlyphScore {
  /** 0–100 overall. */
  score: number;
  stars: 0 | 1 | 2 | 3;
  /** Per reference stroke: which user stroke matched it, and how well. */
  perStroke: { ref: number; user: number | null; score: number; codes: FeedbackCode[] }[];
  /** True when she drew the right strokes but not in the taught order. */
  orderOk: boolean;
  missing: number;
  extra: number;
  codes: FeedbackCode[];
}

/**
 * Align a set of strokes onto a target bounding box (uniform scale about the
 * centre). Used in copy/memory mode so that writing the correct letter a bit
 * small, or off to one side, isn't punished — only the *shape* is judged.
 */
function alignTo(strokes: Pt[][], target: Box): Pt[][] {
  const src = bbox(strokes);
  if (src.w === 0 && src.h === 0) return strokes;
  // Uniform scale keeps the letter's proportions honest (no stretching a bad
  // shape into a good one).
  const scale = Math.min(
    src.w > 0 ? target.w / src.w : Infinity,
    src.h > 0 ? target.h / src.h : Infinity,
  );
  const k = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const scx = src.x + src.w / 2;
  const scy = src.y + src.h / 2;
  const tcx = target.x + target.w / 2;
  const tcy = target.y + target.h / 2;
  return strokes.map((s) =>
    s.map(([x, y]) => [tcx + (x - scx) * k, tcy + (y - scy) * k] as Pt),
  );
}

function starsFor(score: number): 0 | 1 | 2 | 3 {
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

/**
 * Score a whole attempt.
 *
 * Two-tier order handling (docs/LEKHAN.md §3.5): we first pair strokes in the
 * taught order. If a greedy best-match pairing scores clearly better, we use
 * *that* — she drew a good letter, just not in the taught sequence — and report
 * `orderOk: false` so the UI can teach the order without marking her wrong.
 */
export function scoreGlyph(
  reference: Stroke[],
  drawn: Pt[][],
  mode: WriteMode = "trace",
): GlyphScore {
  const tol = TOLERANCE[mode];
  const ref = reference.map((s) => s.points);
  const user = mode === "trace" ? drawn : alignTo(drawn, bbox(ref));

  const codes: FeedbackCode[] = [];
  const missing = Math.max(0, ref.length - user.length);
  const extra = Math.max(0, user.length - ref.length);
  if (missing > 0) codes.push("missing-stroke");
  if (extra > 0) codes.push("extra-stroke");

  // Pairing A: in the taught order.
  const inOrder = ref.map((rs, i) => {
    const us = user[i];
    return us ? { i, ...scoreStroke(rs, us, tol) } : { i, score: 0, codes: [] as FeedbackCode[] };
  });
  const inOrderTotal = avg(inOrder.map((s) => s.score));

  // Pairing B: greedy best match, ignoring order.
  const taken = new Set<number>();
  const greedy = ref.map((rs) => {
    let best = { user: null as number | null, score: -1, codes: [] as FeedbackCode[] };
    for (let j = 0; j < user.length; j++) {
      if (taken.has(j)) continue;
      const s = scoreStroke(rs, user[j], tol);
      if (s.score > best.score) best = { user: j, score: s.score, codes: s.codes };
    }
    if (best.user !== null) taken.add(best.user);
    return { user: best.user, score: Math.max(0, best.score), codes: best.codes };
  });
  const greedyTotal = avg(greedy.map((s) => s.score));

  const useGreedy = greedyTotal > inOrderTotal + 8;
  const orderOk = !useGreedy;
  if (!orderOk) codes.push("wrong-order");

  const perStroke = ref.map((_, i) =>
    useGreedy
      ? { ref: i, user: greedy[i].user, score: greedy[i].score, codes: greedy[i].codes }
      : { ref: i, user: i < user.length ? i : null, score: inOrder[i].score, codes: inOrder[i].codes },
  );

  let score = useGreedy ? greedyTotal : inOrderTotal;
  // Gentle, bounded penalties — never a cliff.
  if (!orderOk) score -= 8;
  score -= missing * 12;
  score -= extra * 6;
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Stars are the learner-facing verdict, so they answer "did I write it the
  // taught way?" — not just "is the shape close?". A letter with the wrong
  // stroke count or sequence is a good attempt, never a perfect one.
  let stars = starsFor(score);
  const structural =
    !orderOk || missing > 0 || extra > 0 || perStroke.some((p) => p.codes.includes("reversed"));
  if (structural && stars === 3) stars = 2;

  return { score, stars, perStroke, orderOk, missing, extra, codes };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** The one kind sentence we say for each deduction. */
export const FEEDBACK_TEXT: Record<FeedbackCode, string> = {
  "start-off": "Start from the marked dot — where a stroke begins shapes the whole letter.",
  reversed: "That stroke was drawn backwards. Watch the arrow and try it the other way.",
  "too-short": "The stroke stopped early — carry it all the way through.",
  overshoot: "A little long — ease off at the end of the stroke.",
  "off-path": "The shape wandered off. Try tracing it once more, slowly.",
  "wrong-order": "Right strokes, different order! Gujarati has a taught sequence — watch it once.",
  "missing-stroke": "One stroke is missing.",
  "extra-stroke": "That's one stroke too many — some parts are drawn in a single motion.",
};
