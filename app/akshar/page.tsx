"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  VOWELS,
  TEACHABLE_CONSONANTS,
  ITEMS,
  barakshariGrid,
  unlockedFrequency,
} from "@/lib/content";
import { strokeGlyph, composeGujarati } from "@/lib/content/strokes";
import { useProgress } from "@/lib/client/useProgress";
import { statusCounts, writingCardId, type StatusCounts } from "@/lib/core/progress";
import { acceptsTyped } from "@/lib/core/translit";
import AksharPractice from "@/components/AksharPractice";
import WriteSession, { type WritePools, type WriteTarget } from "@/components/WriteSession";
import TypeSession, { type TypePools } from "@/components/TypeSession";
import MasteryBar from "@/components/MasteryBar";
import { nextScriptSkill, type ScriptSkill } from "@/lib/core/progression";

/** ઙ and ઞ appear on the chart but never alone, so they stay out of drills. */
const PRACTICE_LETTERS = [...VOWELS, ...TEACHABLE_CONSONANTS];

/** Letters someone has hand-authored stroke data for — the writing track's pool.
 *  Rare letters are excluded here for the same reason they're excluded from
 *  drills: nobody needs to practise writing a letter that never stands alone. */
const WRITABLE: WriteTarget[] = PRACTICE_LETTERS.flatMap((akshar) => {
  const glyph = strokeGlyph(akshar.id);
  if (!glyph || glyph.strokes.length === 0) return [];
  return [
    {
      id: akshar.id,
      kind: "letter" as const,
      strokes: glyph.strokes,
      char: akshar.char,
      label: akshar.roman,
      note: akshar.mnemonic,
      audio: akshar.audio,
      ghostChar: akshar.char,
    },
  ];
});

/**
 * Words we can write out of the letters we've authored — no per-word data, no
 * second capture session (docs/LEKHAN.md §3.7). Conjuncts and nasal marks put a
 * word out of reach, so composition returns null and it simply sits out.
 *
 * Capped at four letters: the pad grows sideways with the word, and past four
 * a phone-width box gets too short to write in comfortably.
 */
const MAX_WORD_LETTERS = 4;
const WRITABLE_WORDS = ITEMS.flatMap((item) => {
  const composed = composeGujarati(item.gujarati);
  if (!composed || composed.clusters.length > MAX_WORD_LETTERS) return [];
  return [{ item, composed }];
});

/** Syllables worth typing: every barakshari cell, flattened. */
const TYPE_SYLLABLES = barakshariGrid().flatMap(({ cells }) => cells);

/**
 * Words whose romanization really does produce their spelling on a phonetic
 * keyboard. A handful of ours don't — મમ્મી is written "Mummy" here because
 * that's how it sounds to an English ear, but you'd type `mammi` — and drilling
 * those would teach a spelling that doesn't work. `npm run check:translit`
 * lists exactly which ones sit out.
 */
const TYPABLE_WORDS = ITEMS.filter((i) => acceptsTyped(i.gujarati, i.roman));

export default function AksharLabPage() {
  const { progress, hydrated } = useProgress();
  const [practicing, setPracticing] = useState(false);
  const [writing, setWriting] = useState(false);
  const [typing, setTyping] = useState(false);

  const EMPTY = { new: 0, learning: 0, known: 0 };
  const readCounts = useMemo(
    () => (hydrated ? statusCounts(progress, PRACTICE_LETTERS.map((a) => a.id)) : EMPTY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, hydrated],
  );
  const writeCounts = useMemo(
    () => (hydrated ? statusCounts(progress, WRITABLE.map((l) => writingCardId(l.id))) : EMPTY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, hydrated],
  );

  // Words the learner has actually met, so a typing session never demands
  // vocabulary they've never seen. Falls back to the first few so day one isn't
  // empty.
  //
  // Keyed on what can actually change the pool rather than on `progress`
  // itself: every XP award produces a new progress object, and a session
  // component handed a fresh pool each answer is how questions end up
  // reshuffling mid-question. Cheap insurance for a mistake this codebase has
  // now made twice.
  const poolKey = `${progress.completedLessons.length}:${Object.keys(progress.cards).length}`;

  // One writing pool, letters and words together. The session decides which of
  // each you get (components/WriteSession.tsx) — a word surfaces once its own
  // letters are under way, which is a better gate than a second button.
  const writePools: WritePools = useMemo(
    () => {
      // Words she's actually met, so the drill never asks her to form a word
      // she's never read. Falls back to the lot so day one isn't empty.
      const met = WRITABLE_WORDS.filter(({ item }) => progress.cards[item.id]);
      const source = met.length >= 3 ? met : WRITABLE_WORDS;
      return {
        letters: WRITABLE,
        words: source.map(({ item, composed }) => ({
          id: item.id,
          kind: "word" as const,
          // Matras don't stand alone, so they're never practised alone — a word
          // is where you first draw one, and it's gated on its letters only.
          requires: [
            ...new Set(composed.clusters.flatMap((c) => c.ids.filter((i) => !i.startsWith("m-")))),
          ],
          strokes: composed.strokes,
          width: composed.width,
          parts: composed.clusters,
          char: item.gujarati,
          label: item.roman,
          note: item.english,
          audio: item.audio,
        })),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poolKey],
  );

  const wordsWritten = useMemo(
    () =>
      hydrated
        ? WRITABLE_WORDS.filter(({ item }) => progress.cards[writingCardId(item.id)]).length
        : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, hydrated],
  );

  const typePools: TypePools = useMemo(() => {
    const met = TYPABLE_WORDS.filter((i) => progress.cards[i.id]);
    const freq = unlockedFrequency(progress).filter((i) => acceptsTyped(i.gujarati, i.roman));
    const words = [...met, ...freq];
    return {
      letters: PRACTICE_LETTERS,
      syllables: TYPE_SYLLABLES,
      words: words.length ? words : TYPABLE_WORDS.slice(0, 6),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey]);

  // Which of the three to lead with. Advisory — all three are one tap away.
  const skill = nextScriptSkill({
    read: readCounts.known,
    write: writeCounts.known,
    total: PRACTICE_LETTERS.length,
  });
  const start: Record<ScriptSkill, () => void> = {
    read: () => setPracticing(true),
    write: () => setWriting(true),
    type: () => setTyping(true),
  };

  if (practicing) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 py-6 pb-24">
        <AksharPractice pool={PRACTICE_LETTERS} onExit={() => setPracticing(false)} />
      </div>
    );
  }

  // Writing gets a wider shell than the rest of the app: the pad is the feature,
  // and a phone-width canvas would undercut it on the iPad it's made for.
  if (writing) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[720px] flex-col px-4 py-6 pb-24">
        <WriteSession pools={writePools} onExit={() => setWriting(false)} />
      </div>
    );
  }

  if (typing) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 py-6 pb-24">
        <TypeSession pools={typePools} onExit={() => setTyping(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 py-6 pb-16">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back home" className="text-ink-soft">
          <span aria-hidden="true">←</span>
        </Link>
        <h1 className="guj text-2xl">અક્ષર Lab</h1>
      </div>

      {/* One recommended action, then everything else quietly.

          This page used to open with three saturated panels stacked — practice,
          write, type — in three different accent colours, all shouting equally.
          For someone who knows zero letters, "learn to write" and "learn to
          type" aren't choices, they're noise; and the three skills are
          genuinely sequential anyway (lib/core/progression.ts). So: the one
          worth doing now, big. The other two, small, with their numbers. */}
      <HeroSkill
        skill={skill}
        readCounts={readCounts}
        writeCounts={writeCounts}
        onStart={start[skill]}
      />

      <div className="flex flex-col gap-2">
        {(["read", "write", "type"] as ScriptSkill[])
          .filter((s) => s !== skill)
          .map((s) => (
            <SecondarySkill
              key={s}
              skill={s}
              readCounts={readCounts}
              writeCounts={writeCounts}
              wordsWritten={wordsWritten}
              onStart={start[s]}
            />
          ))}
      </div>

      <Link
        href="/akshar/chart"
        className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2"
      >
        <span className="text-xl" aria-hidden="true">
          📖
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium text-ink">Browse the script</span>
          <span className="text-xs text-ink-soft">
            All {PRACTICE_LETTERS.length} letters, and the barakshari grid
          </span>
        </span>
        <span className="text-ink-soft" aria-hidden="true">
          ›
        </span>
      </Link>
    </div>
  );
}

// ── The three skills, described once ──────────────────────────────────────

const SKILL: Record<
  ScriptSkill,
  { emoji: string; verb: string; accent: "peacock" | "magenta" | "marigold"; blurb: string }
> = {
  read: {
    emoji: "👀",
    verb: "Practice letters",
    accent: "peacock",
    blurb: "See a letter, know its sound — the foundation everything else sits on.",
  },
  write: {
    emoji: "✍️",
    verb: "Learn to write",
    accent: "magenta",
    blurb:
      "Watch it formed stroke by stroke, then trace it. Works with a finger, best with a Pencil.",
  },
  type: {
    emoji: "⌨️",
    verb: "Learn to type",
    accent: "marigold",
    blurb:
      "Gujarati keyboards are phonetic — type kem cho, get કેમ છો. The fastest route to texting the family group.",
  },
};

const BORDER = {
  peacock: "border-peacock/40 bg-peacock/10",
  magenta: "border-magenta/40 bg-magenta/10",
  marigold: "border-marigold/40 bg-marigold/10",
} as const;
const BUTTON = {
  peacock: "bg-peacock",
  magenta: "bg-magenta",
  marigold: "bg-marigold",
} as const;

/** A brand-new learner should see one button, not a menu. */
function HeroSkill({
  skill,
  readCounts,
  writeCounts,
  onStart,
}: {
  skill: ScriptSkill;
  readCounts: StatusCounts;
  writeCounts: StatusCounts;
  onStart: () => void;
}) {
  const meta = SKILL[skill];
  const fresh = readCounts.known === 0 && readCounts.learning === 0;

  return (
    <div className={`rounded-2xl border p-4 ${BORDER[meta.accent]}`}>
      {/* No bar at all before there's anything to show — a progress bar reading
          zero is a worse first impression than no bar. */}
      {!fresh && skill === "read" && (
        <MasteryBar
          counts={readCounts}
          total={PRACTICE_LETTERS.length}
          accent="peacock"
          noun="letters known"
        />
      )}
      {!fresh && skill === "write" && (
        <MasteryBar
          counts={writeCounts}
          total={WRITABLE.length}
          accent="magenta"
          noun="letters you can write"
        />
      )}
      <p className="mb-3 text-sm text-ink-soft">{fresh ? "Start here." : meta.blurb}</p>
      <button
        type="button"
        onClick={onStart}
        className={`w-full rounded-full px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99] ${BUTTON[meta.accent]}`}
      >
        {meta.emoji} {fresh ? "Meet your first letters" : meta.verb} →
      </button>
    </div>
  );
}

/** The other two: available, obviously, but not competing for attention. */
function SecondarySkill({
  skill,
  readCounts,
  writeCounts,
  wordsWritten,
  onStart,
}: {
  skill: ScriptSkill;
  readCounts: StatusCounts;
  writeCounts: StatusCounts;
  wordsWritten: number;
  onStart: () => void;
}) {
  const meta = SKILL[skill];
  // Typing deliberately has no count of its own: it grades the letter's
  // existing card rather than keeping a second memory (docs/LEKHAN.md §4).
  const detail =
    skill === "read"
      ? `${readCounts.known} of ${PRACTICE_LETTERS.length} letters known`
      : skill === "write"
        ? `${writeCounts.known} of ${WRITABLE.length} by hand` +
          (wordsWritten > 0 ? ` · ${wordsWritten} whole ${wordsWritten === 1 ? "word" : "words"}` : "")
        : "Type it on your phone";

  return (
    <button
      type="button"
      onClick={onStart}
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
    >
      <span className="text-xl" aria-hidden="true">
        {meta.emoji}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-ink">{meta.verb}</span>
        <span className="text-xs text-ink-soft">{detail}</span>
      </span>
      <span className="text-ink-soft" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
