"use client";

// Top bar for the dashboard: brand, streak, XP, theme toggle, and a subtle
// dev "reset" tucked into a small menu so it can't be tapped by accident.

import { useState } from "react";
import Link from "next/link";
import { streakAlive } from "@/lib/core/gamification";
import { resetProgress } from "@/lib/core/progress";
import type { Progress } from "@/lib/core/progress";
import ThemeToggle from "./ThemeToggle";

interface TopBarProps {
  progress: Progress;
}

export default function TopBar({ progress }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const alive = streakAlive(progress.streak);

  return (
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-2xl font-semibold text-ink">VaatChat</h1>
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium ${
            alive ? "text-ink" : "text-ink-soft opacity-60"
          }`}
          title={alive ? "Streak alive" : "Streak needs a nudge"}
        >
          <span aria-hidden="true">🔥</span>
          <span>{progress.streak.count}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink">
          <span aria-hidden="true">⭐</span>
          <span>{progress.xp} XP</span>
        </div>
        <ThemeToggle />
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More options"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-lg leading-none hover:bg-surface-2"
          >
            <span aria-hidden="true">⋯</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-10 w-44 overflow-hidden rounded-[16px] border border-line bg-surface shadow-[var(--shadow)]">
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-left text-sm text-ink hover:bg-surface-2"
              >
                Your progress
              </Link>
              <div className="h-px bg-line" />
              <button
                type="button"
                onClick={() => {
                  resetProgress();
                  window.location.reload();
                }}
                className="w-full px-3 py-2 text-left text-xs text-ink-soft hover:bg-surface-2"
              >
                Reset progress (dev)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
