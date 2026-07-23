"use client";

import { useState } from "react";
import { VOWELS, barakshariGrid } from "@/lib/content";
import { playAudio } from "@/lib/client/speech";
import { barakshariAudioPath } from "@/lib/content/audio-paths";

export default function BarakshariGrid() {
  const rows = barakshariGrid();
  const [highlighted, setHighlighted] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface p-2" />
            {VOWELS.map((v) => (
              <th
                key={v.id}
                className="guj min-w-12 p-2 text-center text-base font-medium text-ink-soft"
              >
                {v.char}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ consonant, cells }) => (
            <tr key={consonant.id}>
              <th className="guj sticky left-0 z-10 bg-surface p-2 text-center text-lg font-medium text-ink">
                {consonant.char}
              </th>
              {cells.map((cell) => {
                const key = `${cell.consonantId}-${cell.vowelId}`;
                const isHi = highlighted === key;
                return (
                  <td key={key} className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setHighlighted(key);
                        void playAudio(barakshariAudioPath(cell), cell.combined);
                      }}
                      className={`guj flex h-14 w-14 flex-col items-center justify-center rounded-lg text-lg transition-colors ${
                        isHi ? "bg-peacock text-on-accent" : "text-ink hover:bg-surface-2"
                      }`}
                    >
                      <span>{cell.combined}</span>
                      <span className={`text-[10px] ${isHi ? "text-on-accent" : "text-ink-soft"}`}>
                        {cell.roman}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
