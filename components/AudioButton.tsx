"use client";

// A reusable big tappable 🔊 button. Prefers recorded audio, falls back to
// browser TTS of the Gujarati text (see lib/client/speech.ts).

import { playAudio } from "@/lib/client/speech";

interface AudioButtonProps {
  src?: string;
  gujarati: string;
  size?: "sm" | "lg";
  label?: string;
}

export default function AudioButton({ src, gujarati, size = "lg", label }: AudioButtonProps) {
  const dims = size === "lg" ? "h-14 w-14 text-2xl" : "h-9 w-9 text-base";
  return (
    <button
      type="button"
      onClick={() => void playAudio(src, gujarati)}
      aria-label={label ?? `Play audio for ${gujarati}`}
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full bg-peacock text-on-accent shadow-[var(--shadow)] transition-transform active:scale-95`}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  );
}
