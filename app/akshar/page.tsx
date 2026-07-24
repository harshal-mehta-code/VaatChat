"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  VOWELS,
  CONSONANTS,
  TEACHABLE_CONSONANTS,
  ITEMS,
  barakshariGrid,
  unlockedFrequency,
} from "@/lib/content";
import { strokeGlyph } from "@/lib/content/strokes";
import { useProgress } from "@/lib/client/useProgress";
import { itemStatus, statusCounts, writingCardId } from "@/lib/core/progress";
import { acceptsTyped } from "@/lib/core/translit";
import AksharCard from "@/components/AksharCard";
import BarakshariGrid from "@/components/BarakshariGrid";
import AksharPractice from "@/components/AksharPractice";
import WriteSession, { type WritableLetter } from "@/components/WriteSession";
import TypeSession, { type TypePools } from "@/components/TypeSession";
import MasteryBar from "@/components/MasteryBar";

type Tab = "vowels" | "consonants" | "barakshari";

const ALL_LETTERS = [...VOWELS, ...CONSONANTS];
/** ઙ and ઞ appear on the chart but never alone, so they stay out of drills. */
const PRACTICE_LETTERS = [...VOWELS, ...TEACHABLE_CONSONANTS];

/** Letters someone has hand-authored stroke data for — the writing track's pool.
 *  Rare letters are excluded here for the same reason they're excluded from
 *  drills: nobody needs to practise writing a letter that never stands alone. */
const WRITABLE: WritableLetter[] = PRACTICE_LETTERS.flatMap((akshar) => {
  const glyph = strokeGlyph(akshar.id);
  return glyph && glyph.strokes.length > 0 ? [{ akshar, glyph }] : [];
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
  const [tab, setTab] = useState<Tab>("vowels");
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
    () =>
      hydrated
        ? statusCounts(progress, WRITABLE.map((l) => writingCardId(l.akshar.id)))
        : EMPTY,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, hydrated],
  );

  // Words the learner has actually met, so a typing session never demands
  // vocabulary they've never seen. Falls back to the first few so day one isn't
  // empty.
  const typePools: TypePools = useMemo(() => {
    const met = TYPABLE_WORDS.filter((i) => progress.cards[i.id]);
    const freq = unlockedFrequency(progress).filter((i) => acceptsTyped(i.gujarati, i.roman));
    const words = [...met, ...freq];
    return {
      letters: PRACTICE_LETTERS,
      syllables: TYPE_SYLLABLES,
      words: words.length ? words : TYPABLE_WORDS.slice(0, 6),
    };
  }, [progress]);

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
        <WriteSession pool={WRITABLE} onExit={() => setWriting(false)} />
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

      {/* Practice CTA + mastery summary */}
      <div className="rounded-2xl border border-peacock/40 bg-peacock/10 p-4">
        <MasteryBar
          counts={readCounts}
          total={PRACTICE_LETTERS.length}
          accent="peacock"
          noun="letters known"
        />
        <button
          type="button"
          onClick={() => setPracticing(true)}
          className="w-full rounded-full bg-peacock px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
        >
          Practice letters →
        </button>
      </div>

      {/* Writing — the other half of literacy. Reading a letter and being able to
          form it are different skills, so they're tracked separately. */}
      {WRITABLE.length > 0 && (
        <div className="rounded-2xl border border-magenta/40 bg-magenta/10 p-4">
          <MasteryBar
            counts={writeCounts}
            total={WRITABLE.length}
            accent="magenta"
            noun="letters you can write"
          />
          <button
            type="button"
            onClick={() => setWriting(true)}
            className="w-full rounded-full bg-magenta px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
          >
            ✍️ Learn to write →
          </button>
          <p className="mt-2 text-center text-xs text-ink-soft">
            Watch it formed stroke by stroke, then trace it — works with a finger, best
            with a Pencil.
          </p>
        </div>
      )}

      {/* Typing — the third skill, and the one with a same-week payoff. No
          mastery bar of its own on purpose: typing grades the letter's own
          card, because it's a harder direction on the same knowledge rather
          than a separate memory (docs/LEKHAN.md §4). */}
      <div className="rounded-2xl border border-marigold/40 bg-marigold/10 p-4">
        <p className="mb-1 text-base font-semibold text-ink">Type it on your phone</p>
        <p className="mb-3 text-sm text-ink-soft">
          Gujarati keyboards are phonetic — type <span className="font-mono text-ink">kem cho</span>,
          get <span className="guj text-base text-ink">કેમ છો</span>. The fastest route to texting
          the family group in Gujarati.
        </p>
        <button
          type="button"
          onClick={() => setTyping(true)}
          className="w-full rounded-full bg-marigold px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
        >
          ⌨️ Learn to type →
        </button>
      </div>

      <p className="text-sm text-ink-soft">
        Browse the script below — tap any letter for its shape→sound hint — then hit{" "}
        <span className="font-medium text-ink">Practice</span> to lock it into memory.
      </p>

      <div className="flex gap-2 rounded-full border border-line bg-surface-2 p-1">
        {(
          [
            ["vowels", "Vowels"],
            ["consonants", "Consonants"],
            ["barakshari", "Barakshari"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              tab === id ? "bg-peacock text-on-accent" : "text-ink-soft hover:bg-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "vowels" && (
        <div className="grid grid-cols-2 gap-3">
          {VOWELS.map((v) => (
            <AksharCard key={v.id} akshar={v} status={hydrated ? itemStatus(progress, v.id) : "new"} />
          ))}
        </div>
      )}

      {tab === "consonants" && (
        <div className="grid grid-cols-2 gap-3">
          {CONSONANTS.map((c) => (
            <AksharCard key={c.id} akshar={c} status={hydrated ? itemStatus(progress, c.id) : "new"} />
          ))}
        </div>
      )}

      {tab === "barakshari" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-soft">
            Tap any cell to hear it. Scroll sideways to see every vowel form.
          </p>
          <BarakshariGrid />
        </div>
      )}
    </div>
  );
}
