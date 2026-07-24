"use client";

// A static, at-a-glance view of a letter's stroke recipe: numbered start dots
// and an arrowhead on each stroke, so order and direction are readable without
// waiting for an animation. This is the review instrument — the fastest way to
// spot a stroke that was captured backwards, merged, or missing.

import type { Stroke } from "@/lib/core/types";
import { GLYPH_BOX, toSvgPath } from "@/lib/core/strokes";
import { GLYPH_BASELINE, GLYPH_CENTER_X, GLYPH_FONT_SIZE } from "@/lib/content/strokes";

/** Distinct hues so adjacent strokes never blur together. */
const STROKE_COLORS = [
  "var(--ink)",
  "var(--peacock)",
  "var(--magenta)",
  "var(--marigold)",
  "var(--good)",
];

export default function StrokeGlyphPreview({
  strokes,
  ghostChar,
  className,
}: {
  strokes: Stroke[];
  ghostChar?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${GLYPH_BOX} ${GLYPH_BOX}`}
      className={className}
      role="img"
      aria-label={`Stroke order: ${strokes.length} stroke${strokes.length === 1 ? "" : "s"}`}
    >
      {ghostChar && (
        <text
          x={GLYPH_CENTER_X}
          y={GLYPH_BASELINE}
          fontSize={GLYPH_FONT_SIZE}
          textAnchor="middle"
          className="guj"
          fill="var(--ink)"
          opacity={0.08}
        >
          {ghostChar}
        </text>
      )}

      {strokes.map((s, i) => {
        const color = STROKE_COLORS[i % STROKE_COLORS.length];
        const pts = s.points;
        const start = pts[0];
        const end = pts[pts.length - 1];
        const prev = pts[pts.length - 2] ?? start;
        const angle = (Math.atan2(end[1] - prev[1], end[0] - prev[0]) * 180) / Math.PI;
        return (
          <g key={i}>
            <path
              d={toSvgPath(pts)}
              fill="none"
              stroke={color}
              strokeWidth={34}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.75}
            />
            {/* Where it ends, and which way it was going. */}
            <polygon
              points="0,-34 62,0 0,34"
              fill={color}
              transform={`translate(${end[0]} ${end[1]}) rotate(${angle})`}
            />
            {/* Where it starts, and which number it is. */}
            <circle cx={start[0]} cy={start[1]} r={46} fill={color} />
            <text
              x={start[0]}
              y={start[1] + 17}
              fontSize={54}
              textAnchor="middle"
              fill="var(--on-accent)"
              fontWeight="700"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
