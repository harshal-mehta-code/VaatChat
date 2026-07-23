"use client";

// ─────────────────────────────────────────────────────────────────────────
// Small sun/moon toggle. Persists the explicit choice to localStorage and
// stamps data-theme on <html>, which wins over the prefers-color-scheme
// media query in app/globals.css (both directions).
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

const KEY = "vaatchat.theme";
type Theme = "light" | "dark";

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY) as Theme | null;
    const initial: Theme = stored ?? (systemPrefersDark() ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(KEY, next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-lg leading-none transition-colors hover:bg-surface-2"
    >
      <span aria-hidden="true">{theme === "dark" ? "🌙" : "☀️"}</span>
    </button>
  );
}
