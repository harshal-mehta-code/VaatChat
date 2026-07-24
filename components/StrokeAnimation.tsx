"use client";

// The demonstration: an invisible hand writing the letter, stroke by stroke.
//
// This is the thing no font and no static chart can do — show the *order*, the
// *direction*, and above all the *starting point*, which is what beginners get
// wrong first. A pulsing dot marks where each stroke begins, a nib rides the
// path as it draws, and finished strokes stay behind as ink.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Stroke } from "@/lib/core/types";
import { GLYPH_BOX, toSvgPath } from "@/lib/core/strokes";
import { GLYPH_BASELINE, GLYPH_CENTER_X, GLYPH_FONT_SIZE } from "@/lib/content/strokes";

/** Drawing speed, in em-box units per second. Slow is genuinely slow — people ask for it. */
const SPEED = { slow: 420, normal: 900 } as const;
export type AnimSpeed = keyof typeof SPEED;

/** Beat before each stroke where its start dot pulses. */
const LEAD_MS = 420;
/** Beat after each stroke lands. */
const TAIL_MS = 200;

interface Props {
  strokes: Stroke[];
  /** Faint glyph shown underneath (the "what it should look like"). */
  ghostChar?: string;
  speed?: AnimSpeed;
  /** Ruled-notebook guides — the pati every Gujarati schoolkid learns on. */
  guides?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  className?: string;
  /** Fires each time a full pass finishes. */
  onDone?: () => void;
}

export default function StrokeAnimation({
  strokes,
  ghostChar,
  speed = "slow",
  guides = true,
  loop = false,
  autoPlay = true,
  className,
  onDone,
}: Props) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [lengths, setLengths] = useState<number[]>([]);
  const [index, setIndex] = useState(0); // stroke currently drawing
  const [t, setT] = useState(0); // 0–1 within that stroke
  const [phase, setPhase] = useState<"lead" | "draw" | "idle">("idle");
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Measure real path lengths so the dash animation tracks the curve exactly.
  // Callers often pass a freshly-built array, so bail out when nothing actually
  // changed — otherwise measuring would set state, re-render, and measure again.
  useLayoutEffect(() => {
    const next = strokes.map((_, i) => pathRefs.current[i]?.getTotalLength() ?? 0);
    setLengths((prev) =>
      prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
    );
  }, [strokes]);

  const play = useCallback(() => {
    if (strokes.length === 0) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (reduced) {
      setIndex(strokes.length);
      setPhase("idle");
      return;
    }
    let i = 0;
    let start = performance.now();
    let leading = true;
    setIndex(0);
    setT(0);
    setPhase("lead");

    const tick = (now: number) => {
      const len = lengths[i] || 1;
      const drawMs = Math.max(360, (len / SPEED[speed]) * 1000);
      const elapsed = now - start;

      if (leading) {
        if (elapsed >= LEAD_MS) {
          leading = false;
          start = now;
          setPhase("draw");
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const p = Math.min(1, elapsed / drawMs);
      setT(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (elapsed < drawMs + TAIL_MS) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      i += 1;
      if (i >= strokes.length) {
        setIndex(strokes.length);
        setPhase("idle");
        doneRef.current?.();
        if (loop) {
          rafRef.current = requestAnimationFrame((n) => {
            i = 0;
            start = n + 500;
            leading = true;
            setIndex(0);
            setT(0);
            setPhase("lead");
            rafRef.current = requestAnimationFrame(tick);
          });
        }
        return;
      }
      setIndex(i);
      setT(0);
      leading = true;
      start = now;
      setPhase("lead");
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [strokes.length, lengths, speed, loop, reduced]);

  useEffect(() => {
    if (autoPlay && lengths.length === strokes.length && strokes.length > 0) play();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [autoPlay, play, lengths.length, strokes.length]);

  const nib = (() => {
    if (phase !== "draw") return null;
    const el = pathRefs.current[index];
    const len = lengths[index];
    if (!el || !len) return null;
    try {
      const p = el.getPointAtLength(len * t);
      return { x: p.x, y: p.y };
    } catch {
      return null;
    }
  })();

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${GLYPH_BOX} ${GLYPH_BOX}`}
        className="h-full w-full touch-none select-none"
        role="img"
        aria-label="Stroke order demonstration"
        onClick={play}
      >
        {guides && <Guides />}

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
          const d = toSvgPath(s.points);
          const len = lengths[i] ?? 0;
          const drawn = i < index;
          const active = i === index && phase === "draw";
          const offset = active ? len * (1 - t) : drawn ? 0 : len;
          return (
            <path
              key={i}
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              d={d}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={44}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={len || undefined}
              strokeDashoffset={len ? offset : undefined}
              opacity={drawn || active ? 1 : 0}
            />
          );
        })}

        {/* Where this stroke begins — the single most-missed detail. */}
        {phase === "lead" && strokes[index] && (
          <g>
            <circle
              cx={strokes[index].points[0][0]}
              cy={strokes[index].points[0][1]}
              r={54}
              fill="var(--marigold)"
              opacity={0.25}
            >
              <animate attributeName="r" values="34;72;34" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={strokes[index].points[0][0]}
              cy={strokes[index].points[0][1]}
              r={26}
              fill="var(--marigold)"
            />
          </g>
        )}

        {nib && <circle cx={nib.x} cy={nib.y} r={30} fill="var(--marigold)" />}
      </svg>
    </div>
  );
}

/** The four-line ruled guide from a Gujarati school notebook. */
export function Guides() {
  return (
    <g stroke="var(--line)" strokeWidth={3}>
      <rect x={40} y={40} width={920} height={920} fill="none" rx={24} />
      <line x1={40} y1={295} x2={960} y2={295} strokeDasharray="14 18" />
      <line x1={40} y1={GLYPH_BASELINE} x2={960} y2={GLYPH_BASELINE} strokeWidth={5} />
      <line x1={500} y1={40} x2={500} y2={960} strokeDasharray="14 18" opacity={0.6} />
    </g>
  );
}
