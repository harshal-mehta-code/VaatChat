// Canonical audio paths for generated syllable audio, shared by the UI
// (BarakshariGrid) and the generator script so they can never drift.

import type { BarakshariCell } from "../core/types.ts";

export function barakshariAudioPath(cell: BarakshariCell): string {
  return `/audio/barakshari/${cell.consonantId}-${cell.vowelId}.mp3`;
}
