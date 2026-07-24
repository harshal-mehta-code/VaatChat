"use client";

// The writing pad: capture ink, score it, and say something useful about it.
//
// The scoring is deliberately explainable (lib/core/strokes.ts) — every point
// deducted maps to a named reason, so the learner gets a sentence they can act
// on ("that stroke was drawn backwards") instead of a percentage they can't.
// Nothing here is punitive: a low score offers another go, never a red X.

import { useCallback, useRef, useState } from "react";
import type { Pt, StrokeGlyph } from "@/lib/core/types";
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
  glyph: StrokeGlyph;
  mode: WriteMode;
  /** The glyph shown faintly underneath — only in trace mode. */
  ghostChar: string;
  onDone: (score: GlyphScore) => void;
  onWatchAgain?: () => void;
}

export default function WritePad({ glyph, mode, ghostChar, onDone, onWatchAgain }: Props) {
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [live, setLive] = useState<Pt[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [penOnly, setPenOnly] = useState(false);
  const [result, setResult] = useState<GlyphScore | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const toGlyph = useCallback((clientX: number, clientY: number): Pt => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [
      ((clientX - rect.left) / rect.width) * GLYPH_BOX,
      ((clientY - rect.top) / rect.height) * GLYPH_BOX,
    ];
  }, []);

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
    setResult(scoreGlyph(glyph.strokes, strokes, mode));
  }

  function retry() {
    setStrokes([]);
    setResult(null);
  }

  const showReference = mode === "trace" && !result;
  const canCheck = strokes.length > 0 && !result;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full max-w-[560px]">
        <div className="relative aspect-square w-full rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${GLYPH_BOX} ${GLYPH_BOX}`}
            className="absolute inset-0 h-full w-full touch-none select-none"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <Guides />

            {showReference && (
              <>
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
                {glyph.strokes.map((s, i) => (
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
              glyph.strokes.map((s, i) => (
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
        <Feedback score={result} onRetry={retry} onDone={() => onDone(result)} onWatchAgain={onWatchAgain} />
      ) : (
        <div className="flex w-full max-w-[560px] items-center gap-2">
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
}: {
  score: GlyphScore;
  onRetry: () => void;
  onDone: () => void;
  onWatchAgain?: () => void;
}) {
  const codes: FeedbackCode[] = [];
  for (const c of score.codes) if (!codes.includes(c)) codes.push(c);
  for (const p of score.perStroke) for (const c of p.codes) if (!codes.includes(c)) codes.push(c);
  const notes = codes.slice(0, 2);

  const headline =
    score.stars === 3
      ? "That's it — clean."
      : score.stars === 2
        ? "Good. Close to it."
        : score.stars === 1
          ? "Getting there."
          : "Let's take that one again.";

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-3">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-semibold text-ink">{headline}</span>
          <span className="text-lg" aria-label={`${score.stars} out of 3 stars`}>
            {"★".repeat(score.stars)}
            <span className="opacity-25">{"★".repeat(3 - score.stars)}</span>
          </span>
        </div>
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
          Continue
        </button>
      </div>
    </div>
  );
}
