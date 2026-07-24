"use client";

// ─────────────────────────────────────────────────────────────────────────
// Stroke Lab — the authoring tool for Lekhan.
//
// A native writer traces each letter once, with a Pencil, in the same em-box
// the app teaches from. The tool simplifies the ink, keeps it safe in
// localStorage, and exports a paste-ready block for lib/content/strokes.ts.
//
// This is the only place the app's handwriting knowledge comes from — see
// docs/LEKHAN.md §3.2 for why it isn't (and shouldn't be) generated.
// ─────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Pt } from "@/lib/core/types";
import { GLYPH_BOX, simplify, toSvgPath } from "@/lib/core/strokes";
import {
  GLYPH_BASELINE,
  GLYPH_CENTER_X,
  GLYPH_FONT_SIZE,
  STROKE_GLYPHS,
  WRITING_TARGETS,
  type WritingTarget,
} from "@/lib/content/strokes";
import StrokeAnimation, { Guides } from "@/components/StrokeAnimation";
import StrokeGlyphPreview from "@/components/StrokeGlyphPreview";

type Drafts = Record<string, Pt[][]>;

const KEY = "vaatchat.strokelab.v1";
/** Ignore jitter smaller than this while capturing (em-box units). */
const MIN_STEP = 4;
/** RDP epsilon — trims ~120 captured points to the dozen that define the shape. */
const SIMPLIFY = 5;

type Kind = "vowel" | "consonant" | "matra";
const KINDS: [Kind, string][] = [
  ["vowel", "Vowels"],
  ["consonant", "Consonants"],
  ["matra", "Matras"],
];

export default function StrokeLabPage() {
  const [drafts, setDrafts] = useState<Drafts>({});
  const [hydrated, setHydrated] = useState(false);
  const [kind, setKind] = useState<Kind>("vowel");
  const [targetId, setTargetId] = useState<string>(WRITING_TARGETS[0]?.id ?? "");
  const [live, setLive] = useState<Pt[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [penOnly, setPenOnly] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // ── Persistence: never lose a hand-authored stroke to a refresh ──────────
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      const saved = raw ? (JSON.parse(raw) as Drafts) : {};
      const shipped: Drafts = Object.fromEntries(
        STROKE_GLYPHS.map((g) => [g.id, g.strokes.map((s) => s.points)]),
      );
      setDrafts({ ...shipped, ...saved });
    } catch {
      /* first run */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(drafts));
    } catch {
      /* quota — non-fatal */
    }
  }, [drafts, hydrated]);

  const targets = useMemo(() => WRITING_TARGETS.filter((t) => t.kind === kind), [kind]);
  const target: WritingTarget | undefined =
    WRITING_TARGETS.find((t) => t.id === targetId) ?? targets[0];
  const strokes = useMemo(() => (target && drafts[target.id]) || [], [target, drafts]);
  const animStrokes = useMemo(() => strokes.map((points) => ({ points })), [strokes]);
  const authoredCount = Object.values(drafts).filter((s) => s.length > 0).length;

  // ── Ink capture ─────────────────────────────────────────────────────────
  const toGlyph = useCallback((clientX: number, clientY: number): Pt => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [
      ((clientX - rect.left) / rect.width) * GLYPH_BOX,
      ((clientY - rect.top) / rect.height) * GLYPH_BOX,
    ];
  }, []);

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    if (previewing || !target) return;
    // Palm rejection: once a Pencil shows up, fingers stop drawing.
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
    if (!drawing || !target) return;
    setDrawing(false);
    const pts = live;
    setLive([]);
    if (pts.length < 2) return; // a tap isn't a stroke
    const clean = simplify(pts, SIMPLIFY).map(
      ([x, y]) => [Math.round(x), Math.round(y)] as Pt,
    );
    setDrafts((d) => ({ ...d, [target.id]: [...(d[target.id] ?? []), clean] }));
  }

  const undo = () =>
    target && setDrafts((d) => ({ ...d, [target.id]: (d[target.id] ?? []).slice(0, -1) }));
  const clear = () => target && setDrafts((d) => ({ ...d, [target.id]: [] }));
  /** Drop one stroke by index — so fixing stroke 2 of 5 doesn't mean redrawing all 5. */
  const dropStroke = (i: number) =>
    target &&
    setDrafts((d) => ({ ...d, [target.id]: (d[target.id] ?? []).filter((_, j) => j !== i) }));

  function step(delta: number) {
    const all = WRITING_TARGETS;
    const i = all.findIndex((t) => t.id === target?.id);
    const next = all[(i + delta + all.length) % all.length];
    setKind(next.kind);
    setTargetId(next.id);
    setPreviewing(false);
  }

  // ── Export ──────────────────────────────────────────────────────────────
  const exported = useMemo(() => {
    const rows = WRITING_TARGETS.filter((t) => (drafts[t.id]?.length ?? 0) > 0).map((t) => {
      const s = drafts[t.id]
        .map((pts) => `    { points: ${JSON.stringify(pts)} },`)
        .join("\n");
      return `  {\n    id: "${t.id}",\n    char: "${t.char}",\n    strokes: [\n${s}\n    ],\n  },`;
    });
    return `export const STROKE_GLYPHS: StrokeGlyph[] = [\n${rows.join("\n")}\n];`;
  }, [drafts]);

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exported);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* fall back to the textarea below */
    }
  }

  if (!hydrated || !target) return null;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-4 overscroll-none px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back home" className="text-ink-soft">
          <span aria-hidden="true">←</span>
        </Link>
        <h1 className="text-xl">Stroke Lab</h1>
        <span className="ml-auto rounded-full bg-surface-2 px-3 py-1 text-xs text-ink-soft">
          {authoredCount} / {WRITING_TARGETS.length} authored
        </span>
      </div>

      <p className="text-sm text-ink-soft">
        Trace each letter <span className="font-medium text-ink">the way you'd actually write it</span> —
        right order, right direction, lifting the pen where you really lift it. One
        pen-down to pen-up = one stroke. This becomes what the app teaches.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setReviewing((v) => !v)}
          className={`w-full rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
            reviewing ? "border-peacock bg-peacock text-on-accent" : "border-line bg-surface text-ink"
          }`}
        >
          {reviewing ? "← Back to drawing" : `🔍 Review all ${authoredCount} letters`}
        </button>
      </div>

      {reviewing && (
        <>
          <p className="text-xs text-ink-soft">
            Numbered dot = where each stroke starts · arrow = which way it went. Tap any
            letter to fix it.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {WRITING_TARGETS.filter((t) => (drafts[t.id]?.length ?? 0) > 0).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setKind(t.kind);
                  setTargetId(t.id);
                  setReviewing(false);
                  setPreviewing(false);
                }}
                className="rounded-xl border border-line bg-surface p-1 text-left"
              >
                <StrokeGlyphPreview
                  strokes={drafts[t.id].map((points) => ({ points }))}
                  ghostChar={t.display}
                  className="aspect-square w-full"
                />
                <div className="flex items-baseline justify-between px-1 pb-1">
                  <span className="guj text-lg">{t.display}</span>
                  <span className="text-[10px] text-ink-soft">
                    {drafts[t.id].length} stroke{drafts[t.id].length === 1 ? "" : "s"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {!reviewing && (
        <>
      {/* Kind filter */}
      <div className="flex gap-2 rounded-full border border-line bg-surface-2 p-1">
        {KINDS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setKind(id);
              // Follow the tab — otherwise the canvas keeps showing a letter
              // from the category you just left.
              const first = WRITING_TARGETS.find((t) => t.kind === id);
              if (first) setTargetId(first.id);
              setPreviewing(false);
            }}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              kind === id ? "bg-peacock text-on-accent" : "text-ink-soft hover:bg-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Target picker */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {targets.map((t) => {
          const done = (drafts[t.id]?.length ?? 0) > 0;
          const active = t.id === target.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTargetId(t.id);
                setPreviewing(false);
              }}
              className={`relative shrink-0 rounded-xl border px-4 py-2 ${
                active ? "border-peacock bg-peacock/10" : "border-line bg-surface"
              }`}
            >
              <span className="guj text-2xl">{t.kind === "matra" ? t.display : t.char}</span>
              {done && (
                <span className="absolute -right-1 -top-1 text-xs" aria-label="authored">
                  ✅
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* The pad */}
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <div className="guj text-3xl">{target.display}</div>
          <div className="text-xs text-ink-soft">{target.label}</div>
          {target.kind === "matra" && (
            <div className="mx-auto mt-2 max-w-xs rounded-xl border border-marigold/40 bg-marigold/10 px-3 py-2 text-xs text-ink">
              Trace <span className="font-semibold">only the {target.char} mark</span> — the ક
              is there to show you where it sits, and is already captured.
            </div>
          )}
        </div>

        <div className="w-full max-w-[560px]">
          <div className="relative aspect-square w-full rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
            {previewing ? (
              <StrokeAnimation
                strokes={animStrokes}
                ghostChar={target.display}
                loop
                className="absolute inset-0"
              />
            ) : (
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

                {/* The letter to trace. Matras show their base consonant for position. */}
                <text
                  x={GLYPH_CENTER_X}
                  y={GLYPH_BASELINE}
                  fontSize={GLYPH_FONT_SIZE}
                  textAnchor="middle"
                  className="guj"
                  fill="var(--ink)"
                  opacity={0.16}
                >
                  {target.display}
                </text>

                {strokes.map((pts, i) => (
                  <g key={i}>
                    <path
                      d={toSvgPath(pts)}
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth={40}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.85}
                    />
                    <circle cx={pts[0][0]} cy={pts[0][1]} r={26} fill="var(--peacock)" />
                    <text
                      x={pts[0][0]}
                      y={pts[0][1] + 13}
                      fontSize={34}
                      textAnchor="middle"
                      fill="var(--on-accent)"
                      fontWeight="700"
                    >
                      {i + 1}
                    </text>
                    <circle
                      cx={pts[pts.length - 1][0]}
                      cy={pts[pts.length - 1][1]}
                      r={16}
                      fill="var(--magenta)"
                    />
                  </g>
                ))}

                {live.length > 1 && (
                  <path
                    d={toSvgPath(live)}
                    fill="none"
                    stroke="var(--magenta)"
                    strokeWidth={40}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            )}
          </div>
        </div>

        <div className="flex w-full max-w-[560px] flex-wrap items-center justify-center gap-2">
          <Ctl onClick={undo} disabled={strokes.length === 0}>
            ↶ Undo stroke
          </Ctl>
          <Ctl onClick={clear} disabled={strokes.length === 0}>
            Clear
          </Ctl>
          <Ctl onClick={() => setPreviewing((p) => !p)} disabled={strokes.length === 0}>
            {previewing ? "✍️ Back to drawing" : "▶︎ Preview"}
          </Ctl>
          <Ctl onClick={() => setPenOnly((p) => !p)} active={penOnly}>
            {penOnly ? "✏️ Pencil only" : "👆 Finger ok"}
          </Ctl>
        </div>

        {/* Per-stroke list: fix stroke 2 of 5 without redrawing the other four. */}
        {strokes.length > 0 && (
          <div className="flex w-full max-w-[560px] flex-wrap justify-center gap-2">
            {strokes.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => dropStroke(i)}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft"
              >
                stroke {i + 1} <span className="text-bad">✕</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex w-full max-w-[560px] items-center gap-2">
          <Ctl onClick={() => step(-1)}>← Prev</Ctl>
          <span className="flex-1 text-center text-xs text-ink-soft">
            {strokes.length} stroke{strokes.length === 1 ? "" : "s"}
          </span>
          <Ctl onClick={() => step(1)}>Next →</Ctl>
        </div>
      </div>
        </>
      )}

      {/* Export */}
      <div className="mt-2 rounded-2xl border border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-base">Export</h2>
          <button
            type="button"
            onClick={copyExport}
            className="rounded-full bg-marigold px-4 py-2 text-sm font-semibold text-on-accent active:scale-[.99]"
          >
            {copied ? "Copied ✓" : "Copy for Claude"}
          </button>
        </div>
        <p className="mb-2 text-xs text-ink-soft">
          Everything is saved on this device as you go. When you've done a batch, hit
          Copy and paste it into the chat — it drops straight into{" "}
          <code>lib/content/stroke-data.ts</code>.
        </p>
        <textarea
          readOnly
          value={exported}
          onFocus={(e) => e.currentTarget.select()}
          className="h-40 w-full rounded-xl border border-line bg-surface-2 p-3 font-mono text-[11px] text-ink"
        />
      </div>
    </div>
  );
}

function Ctl({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
        active ? "border-peacock bg-peacock/10 text-ink" : "border-line bg-surface text-ink"
      }`}
    >
      {children}
    </button>
  );
}
