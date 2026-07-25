"use client";

// Persistent bottom navigation — three focused destinations so the app never
// feels like "blocks after blocks with a dozen places to tap." Hidden during
// onboarding and inside immersive players (lesson / grammar / vaat runners),
// which are full-screen focus modes.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress } from "@/lib/client/useProgress";

interface Tab {
  href: string;
  label: string;
  icon: string;
  /** Extra path prefixes that should light this tab up as active. */
  match: (path: string) => boolean;
}

const TABS: Tab[] = [
  // The journey belongs to Learn: it's reached from the home screen and it's
  // the answer to "how far am I", not a place to practise.
  { href: "/", label: "Learn", icon: "🪔", match: (p) => p === "/" || p.startsWith("/journey") },
  { href: "/review", label: "Review", icon: "🔁", match: (p) => p.startsWith("/review") },
  {
    href: "/explore",
    label: "Explore",
    icon: "🧭",
    match: (p) =>
      p === "/explore" ||
      p.startsWith("/akshar") ||
      p.startsWith("/vyakaran") ||
      p.startsWith("/vaat"),
  },
];

// Full-screen focus modes where the tab bar should get out of the way.
// `/dev/*` are internal authoring tools — not part of the learner's app.
const IMMERSIVE = /^\/(lesson|vaat|vyakaran)\/[^/]+|^\/dev\//;

export default function TabBar() {
  const pathname = usePathname();
  const { progress, hydrated } = useProgress();

  if (!hydrated || !progress.onboarded) return null;
  if (IMMERSIVE.test(pathname)) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[480px] items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active ? "text-marigold" : "text-ink-soft hover:text-ink"
              }`}
            >
              <span className={`text-xl ${active ? "" : "opacity-70 grayscale"}`} aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
