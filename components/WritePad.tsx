"use client";

// The writing pad: capture ink, score it, and say something useful about it.
//
// The scoring is deliberately explainable (lib/core/strokes.ts) — every point
// deducted maps to a named reason, so the learner gets a sentence they can act
// on ("that stroke was drawn backwards") instead of a percentage they can't.
// Nothing here is punitive: a low score offers another go, never a red X.

import { useCallback, useRef, useState } from "react";
import type { Pt, Stroke } from "@/lib/core/types";
import {
  FEEDBACK_TEXT,
  GLYPH_BOX,
  scoreGlyph,
  simplify,
  toSvgPath,
  type FeedbackCode,
  type GlyphScore,
  type WriteMode,
} from "@/lib/core/strokes";
import { GLYPH_BASELINE, GLYPH_CENTER_X, GLYPH_FONT_SIZE } from "@/lib/content/strokes";
import { Guides } from "@/components/StrokeAnimation";

const MIN_STEP = 4;
const SIMPLIFY = 5;

interface Props {
  /** What to write, already placed in the box: one letter, or a whole word. */
  reference: Stroke[];
  mode: WriteMode;
  /** Box width. A letter is square; a word is wider and its own shape. */
  width?: number;
  /** The glyph shown faintly underneath — only in trace mode, and only for a
   *  single letter: the font's own spacing for a word wouldn't line up with
   *  the strokes we composed, and two conflicting references teach nothing. */
  ghostChar?: string;
  /** Which strokes belong to which letter. Only a word has these — and with
   *  them the feedback can say "take another look at છો" instead of
   *  "stroke 6", which is the difference between advice and a stack trace. */
  parts?: { guj: string; from: number; count: number }[];
  onDone: (score: GlyphScore) => void;
  onWatchAgain?: () => void;
  /** What tapping through leads to — named explicitly, so moving from Trace to
   *  Write reads as the next rung and never as "your attempt was rejected". */
  continueLabel: string;
}

export default function WritePad({
  reference,
  mode,
  width = GLYPH_BOX,
  ghostChar,
  parts,
  onDone,
  onWatchAgain,
  continueLabel,
}: Props) {
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [live, setLive] = useState<Pt[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [penOnly, setPenOnly] = useState(false);
  const [result, setResult] = useState<GlyphScore | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const toGlyph = useCallback((clientX: number, clientY: number): Pt => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [
      ((clientX - rect.left) / rect.width) * width,
      ((clientY - rect.top) / rect.height) * GLYPH_BOX,
    ];
  }, [width]);

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    if (result) return;
    if (e.pointerType === "pen" && !penOnly) setPenOnly(true);
    if (penOnly && e.pointerType !== "pen") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrawing(true);
    setLive([toGlyph(e.clientX, e.clientY)]);
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drawing) return;
    const p = toGlyph(e.clientX, e.clientY);
    setLive((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < MIN_STEP) return prev;
      return [...prev, p];
    });
  }

  function onUp() {
    if (!drawing) return;
    setDrawing(false);
    const pts = live;
    setLive([]);
    if (pts.length < 2) return;
    setStrokes((s) => [...s, simplify(pts, SIMPLIFY)]);
  }

  function check() {
    setResult(scoreGlyph(reference, strokes, mode));
  }

  function retry() {
    setStrokes([]);
    setResult(null);
  }

  const showReference = mode === "trace" && !result;
  const canCheck = strokes.length > 0 && !result;
  // A word needs every pixel it can get — the pad is the feature (LEKHAN.md §6).
  const shell = width > GLYPH_BOX ? "w-full max-w-[720px]" : "w-full max-w-[560px]";

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className={shell}>
        <div
          className="relative w-full rounded-2xl border border-line bg-surface shadow-[var(--shadow)]"
          style={{ aspectRatio: `${width} / ${GLYPH_BOX}` }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${GLYPH_BOX}`}
            className="absolute inset-0 h-full w-full touch-none select-none"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <Guides width={width} />

            {showReference && (
              <>
                {ghostChar && (
                  <text
                    x={GLYPH_CENTER_X}
                    y={GLYPH_BASELINE}
                    fontSize={GLYPH_FONT_SIZE}
                    textAnchor="middle"
                    className="guj"
                    fill="var(--ink)"
                    opacity={0.1}
                  >
                    {ghostChar}
                  </text>
                )}
                {reference.map((s, i) => (
                  <g key={i}>
                    <path
                      d={toSvgPath(s.points)}
                      fill="none"
                      stroke="var(--peacock)"
                      strokeWidth={44}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.18}
                    />
                    {/* Start dots, numbered — the order is half the lesson. */}
                    <circle
                      cx={s.points[0][0]}
                      cy={s.points[0][1]}
                      r={30}
                      fill="var(--peacock)"
                      opacity={0.45}
                    />
                    <text
                      x={s.points[0][0]}
                      y={s.points[0][1] + 13}
                      fontSize={36}
                      textAnchor="middle"
                      fill="var(--on-accent)"
                      fontWeight="700"
                    >
                      {i + 1}
                    </text>
                  </g>
                ))}
              </>
            )}

            {/* After checking: her ink over the reference, so the gap is visible. */}
            {result &&
              reference.map((s, i) => (
                <path
                  key={`ref-${i}`}
                  d={toSvgPath(s.points)}
                  fill="none"
                  stroke="var(--peacock)"
                  strokeWidth={40}
                  strokeLinecap="round"
                  strokeDasharray="6 34"
                  opacity={0.5}
                />
              ))}

            {strokes.map((pts, i) => (
              <path
                key={i}
                d={toSvgPath(pts)}
                fill="none"
                stroke={result ? "var(--magenta)" : "var(--ink)"}
                strokeWidth={40}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={result ? 0.85 : 1}
              />
            ))}

            {live.length > 1 && (
              <path
                d={toSvgPath(live)}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={40}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>

      {result ? (
        <Feedback
          score={result}
          onRetry={retry}
          onDone={() => onDone(result)}
          onWatchAgain={onWatchAgain}
          continueLabel={continueLabel}
          shell={shell}
          parts={parts}
        />
      ) : (
        <div className={`flex items-center gap-2 ${shell}`}>
          <button
            type="button"
            onClick={() => setStrokes((s) => s.slice(0, -1))}
            disabled={strokes.length === 0}
            className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
          >
            ↶ Undo
          </button>
          {onWatchAgain && (
            <button
              type="button"
              onClick={onWatchAgain}
              className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink"
            >
              👀 Watch
            </button>
          )}
          <button
            type="button"
            onClick={check}
            disabled={!canCheck}
            className="flex-1 rounded-full bg-marigold px-6 py-3 text-base font-semibold text-on-accent disabled:opacity-40 active:scale-[.99]"
          >
            Check it
          </button>
        </div>
      )}
    </div>
  );
}

/** Praise first, then at most two things to fix — never a wall of corrections. */
function Feedback({
  score,
  onRetry,
  onDone,
  onWatchAgain,
  continueLabel,
  shell,
  parts,
}: {
  score: GlyphScore;
  onRetry: () => void;
  onDone: () => void;
  onWatchAgain?: () => void;
  continueLabel: string;
  shell: string;
  parts?: { guj: string; from: number; count: number }[];
}) {
  const codes: FeedbackCode[] = [];
  for (const c of score.codes) if (!codes.includes(c)) codes.push(c);
  for (const p of score.perStroke) for (const c of p.codes) if (!codes.includes(c)) codes.push(c);
  const notes = codes.slice(0, 2);

  // In a word, point at the letter that let it down. One is enough: a list of
  // everything wrong with your handwriting is not what anyone needs to read.
  const weakest = weakestPart(score, parts);

  const headline =
    score.stars === 3
      ? "That's it — clean."
      : score.stars === 2
        ? "Good. Close to it."
        : score.stars === 1
          ? "Getting there."
          : "Let's take that one again.";

  return (
    <div className={`flex flex-col gap-3 ${shell}`}>
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-semibold text-ink">{headline}</span>
          <span className="text-lg" aria-label={`${score.stars} out of 3 stars`}>
            {"★".repeat(score.stars)}
            <span className="opacity-25">{"★".repeat(3 - score.stars)}</span>
          </span>
        </div>
        {weakest && (
          <p className="mb-1 text-sm text-ink-soft">
            The <span className="guj text-base text-ink">{weakest}</span> is the one to
            look at again.
          </p>
        )}
        {notes.length === 0 ? (
          <p className="text-sm text-ink-soft">Right strokes, right order, right direction.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {notes.map((c) => (
              <li key={c} className="text-sm text-ink-soft">
                {FEEDBACK_TEXT[c]}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink"
        >
          Try again
        </button>
        {onWatchAgain && score.stars < 2 && (
          <button
            type="button"
            onClick={onWatchAgain}
            className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink"
          >
            👀 Watch it
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-full bg-marigold px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * The letter in a word that scored worst — but only when it's meaningfully
 * worse than the rest. On a letter, or on a word where everything came out
 * about the same, there's nothing useful to single out and we say nothing.
 */
function weakestPart(
  score: GlyphScore,
  parts?: { guj: string; from: number; count: number }[],
): string | null {
  if (!parts || parts.length < 2) return null;
  const scored = parts.map((p) => {
    const strokes = score.perStroke.slice(p.from, p.from + p.count);
    if (strokes.length === 0) return { guj: p.guj, score: 100 };
    return { guj: p.guj, score: strokes.reduce((a, s) => a + s.score, 0) / strokes.length };
  });
  const worst = scored.reduce((a, b) => (b.score < a.score ? b : a));
  const rest = scored.filter((s) => s !== worst);
  const others = rest.reduce((a, s) => a + s.score, 0) / rest.length;
  return worst.score < 70 && worst.score < others - 12 ? worst.guj : null;
}
