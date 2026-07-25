"use client";

// બારાક્ષરી — the best idea in the whole script, previously presented as a
// spreadsheet.
//
// Barakshari is *the* insight of a Gujarati abugida: every consonant takes the
// same ten vowel signs, in the same order, in the same way. Learn ten marks and
// the thirty-four letters you know become three hundred and forty syllables.
// It should make the script feel small.
//
// As a bare 32×10 table with a tap-for-sound handler it did the opposite — a
// wall of 320 cells, no framing, and nothing to *do*. Three changes:
//
//   Decomposition. Tapping a cell says ક + ી = કી out loud in the readout,
//   with the row and column lit. The mark is the lesson, so the mark is shown.
//
//   Your grid, filling in. Consonants you haven't met yet sit back. The table
//   stops being 320 strangers and starts being a record of what you know.
//
//   The chant. Ka, kaa, ki, kee… is how this is actually learned in Gujarat,
//   out loud, one row at a time. A quiz would have been the obvious thing to
//   build here and the wrong one; the row is a rhythm, not a test.

import { useEffect, useRef, useState } from "react";
import { VOWELS, AKSHAR_BY_ID, barakshariGrid } from "@/lib/content";
import type { BarakshariCell } from "@/lib/core/types";
import { itemStatus } from "@/lib/core/progress";
import { useProgress } from "@/lib/client/useProgress";
import { playAudio, playAudioToEnd, stopAudio } from "@/lib/client/speech";
import { barakshariAudioPath } from "@/lib/content/audio-paths";

/** Gap between syllables when chanting a row. Slow enough to say along with. */
const CHANT_GAP_MS = 620;

export default function BarakshariGrid() {
  const rows = barakshariGrid();
  const { progress, hydrated } = useProgress();
  const [selected, setSelected] = useState<BarakshariCell | null>(null);
  const [chanting, setChanting] = useState<string | null>(null);
  /** Bumped on every stop/unmount so an in-flight chant abandons itself. */
  const chantRun = useRef(0);

  useEffect(
    () => () => {
      chantRun.current++;
      stopAudio();
    },
    [],
  );

  async function chant(consonantId: string, cells: BarakshariCell[]) {
    const run = ++chantRun.current;
    setChanting(consonantId);
    for (const cell of cells) {
      if (chantRun.current !== run) return;
      setSelected(cell);
      await playAudioToEnd(barakshariAudioPath(cell), cell.combined);
      await new Promise((r) => setTimeout(r, CHANT_GAP_MS));
    }
    if (chantRun.current === run) setChanting(null);
  }

  function stopChant() {
    chantRun.current++;
    setChanting(null);
    stopAudio();
  }

  const selectedVowel = selected ? AKSHAR_BY_ID[selected.vowelId] : undefined;
  const selectedConsonant = selected ? AKSHAR_BY_ID[selected.consonantId] : undefined;

  return (
    <div className="flex flex-col gap-3">
      {/* What this table actually is. */}
      <div className="rounded-2xl border border-peacock/40 bg-peacock/10 p-4">
        <p className="text-sm font-semibold text-ink">Ten marks, and the script is yours</p>
        <p className="mt-1 text-sm text-ink-soft">
          Every consonant takes the same ten vowel signs, in the same order.{" "}
          <span className="guj text-ink">ક</span> + <span className="guj text-peacock">ા</span> ={" "}
          <span className="guj text-ink">કા</span>. Learn the marks once and every letter you
          know multiplies by ten — that&apos;s{" "}
          <span className="font-semibold text-ink">{rows.length * VOWELS.length} syllables</span>{" "}
          from {rows.length} letters.
        </p>
      </div>

      {/* The readout: what you're looking at, decomposed. Sticky, because the
          grid scrolls and the answer shouldn't scroll away with it. */}
      <div className="sticky top-0 z-20 flex min-h-[3.75rem] items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5 shadow-[var(--shadow)]">
        {selected && selectedConsonant && selectedVowel ? (
          <>
            <div className="guj flex items-baseline gap-1.5 text-2xl text-ink">
              <span>{selectedConsonant.char}</span>
              <span className="text-base text-ink-soft">+</span>
              <span className="text-peacock">{selectedVowel.matra || selectedVowel.char}</span>
              <span className="text-base text-ink-soft">=</span>
              <span className="font-medium">{selected.combined}</span>
            </div>
            <div className="ml-auto text-right">
              <div className="text-sm font-medium text-ink">{selected.roman}</div>
              <div className="text-[11px] text-ink-soft">
                {selectedConsonant.roman} + {selectedVowel.roman}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-soft">
            Tap any square to hear it and see how it&apos;s built.
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface p-2" />
              {VOWELS.map((v) => {
                const lit = selectedVowel?.id === v.id;
                return (
                  <th
                    key={v.id}
                    className={`min-w-12 p-2 text-center transition-colors ${
                      lit ? "bg-peacock/15" : ""
                    }`}
                  >
                    {/* The *mark*, not the letter — the mark is what a
                        consonant actually takes. */}
                    <span
                      className={`guj block text-base font-medium ${
                        lit ? "text-peacock" : "text-ink-soft"
                      }`}
                    >
                      {v.matra || v.char}
                    </span>
                    <span className="block text-[10px] text-ink-soft">{v.roman}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ consonant, cells }) => {
              const met = hydrated && itemStatus(progress, consonant.id) !== "new";
              const rowLit = selected?.consonantId === consonant.id;
              const isChanting = chanting === consonant.id;
              return (
                <tr key={consonant.id} className={rowLit ? "bg-peacock/5" : ""}>
                  <th className="sticky left-0 z-10 bg-surface p-1 pr-2">
                    <button
                      type="button"
                      onClick={() => (isChanting ? stopChant() : void chant(consonant.id, cells))}
                      title={`Chant the ${consonant.roman} row`}
                      className={`flex h-12 w-14 flex-col items-center justify-center rounded-lg transition-colors ${
                        isChanting ? "bg-peacock text-on-accent" : "hover:bg-surface-2"
                      }`}
                    >
                      <span
                        className={`guj text-lg font-medium ${
                          isChanting ? "text-on-accent" : met ? "text-ink" : "text-ink-soft"
                        }`}
                      >
                        {consonant.char}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isChanting ? "text-on-accent" : "text-ink-soft"
                        }`}
                      >
                        {isChanting ? "◼ stop" : "▶ chant"}
                      </span>
                    </button>
                  </th>
                  {cells.map((cell) => {
                    const key = `${cell.consonantId}-${cell.vowelId}`;
                    const isSel =
                      selected?.consonantId === cell.consonantId &&
                      selected?.vowelId === cell.vowelId;
                    const colLit = selectedVowel?.id === cell.vowelId;
                    return (
                      <td key={key} className="p-1">
                        <button
                          type="button"
                          onClick={() => {
                            stopChant();
                            setSelected(cell);
                            void playAudio(barakshariAudioPath(cell), cell.combined);
                          }}
                          className={`guj flex h-14 w-14 flex-col items-center justify-center rounded-lg text-lg transition-colors ${
                            isSel
                              ? "bg-peacock text-on-accent"
                              : colLit || rowLit
                                ? "bg-peacock/10 text-ink"
                                : met
                                  ? "text-ink hover:bg-surface-2"
                                  : "text-ink-soft/60 hover:bg-surface-2"
                          }`}
                        >
                          <span>{cell.combined}</span>
                          <span
                            className={`text-[10px] ${
                              isSel ? "text-on-accent" : "text-ink-soft"
                            }`}
                          >
                            {cell.roman}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="px-1 text-xs text-ink-soft">
        Letters you haven&apos;t met yet sit back a little — the grid fills in as you learn.
        Tap a letter on the left to chant its whole row, the way it&apos;s taught in Gujarat.
      </p>
    </div>
  );
}
