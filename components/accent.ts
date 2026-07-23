// Static class-name maps for the three unit accent colors. Tailwind's scanner
// needs literal class strings to appear in source, so we can't build these
// with template interpolation (`bg-${accent}`) — hence this lookup table.

import type { Unit } from "@/lib/core/types";

export type Accent = Unit["accent"];

export const ACCENT_BG: Record<Accent, string> = {
  marigold: "bg-marigold",
  magenta: "bg-magenta",
  peacock: "bg-peacock",
};

export const ACCENT_TEXT: Record<Accent, string> = {
  marigold: "text-marigold",
  magenta: "text-magenta",
  peacock: "text-peacock",
};

export const ACCENT_BORDER: Record<Accent, string> = {
  marigold: "border-marigold",
  magenta: "border-magenta",
  peacock: "border-peacock",
};

export const ACCENT_SOFT_BG: Record<Accent, string> = {
  marigold: "bg-marigold/10",
  magenta: "bg-magenta/10",
  peacock: "bg-peacock/10",
};
