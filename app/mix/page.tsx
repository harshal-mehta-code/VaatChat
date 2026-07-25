"use client";

// રોજનું — the daily mix.
//
// One short sitting that crosses every pillar: words you know, letters, one
// written by hand, one typed into script, one piece of grammar. Which legs you
// get, and in which order, changes each time (lib/core/mix.ts).
//
// Almost none of this is new machinery — every leg is a session component that
// already existed, asked for a shorter run and told to hand control back
// instead of showing its own summary. What's new is that they now happen in one
// breath rather than behind four separate buttons, which is the difference
// between an app with four features and an app with a daily habit.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  VOWELS,
  TEACHABLE_CONSONANTS,
  ITEMS,
  barakshariGrid,
  unlockedFrequency,
  GRAMMAR_MODULES,
  drillPool,
} from "@/lib/content";
import { strokeGlyph, composeGujarati } from "@/lib/content/strokes";
import type { LexItem } from "@/lib/core/types";
import { useProgress } from "@/lib/client/useProgress";
import { itemStatus, writingCardId, dueItemIds, grammarCardId } from "@/lib/core/progress";
import { XP } from "@/lib/core/gamification";
import { acceptsTyped } from "@/lib/core/translit";
import { planMix, LEG_LABEL, type MixLeg } from "@/lib/core/mix";
import { makeRng, newSeed, shuffled, pick } from "@/lib/core/variation";
import AksharPractice from "@/components/AksharPractice";
import ReviewSession from "@/components/ReviewSession";
import WriteSession, { type WritePools, type WriteTarget } from "@/components/WriteSession";
import TypeSession, { type TypePools } from "@/components/TypeSession";
import { ChooseDrill, BuildDrill } from "@/components/GrammarRunner";

const PRACTICE_LETTERS = [...VOWELS, ...TEACHABLE_CONSONANTS];
const TYPE_SYLLABLES = barakshariGrid().flatMap(({ cells }) => cells);
const TYPABLE_WORDS = ITEMS.filter((i) => acceptsTyped(i.gujarati, i.roman));
const MAX_WORD_LETTERS = 4;

const WRITABLE_LETTERS: WriteTarget[] = PRACTICE_LETTERS.flatMap((a) => {
  const glyph = strokeGlyph(a.id);
  if (!glyph || glyph.strokes.length === 0) return [];
  return [
    {
      id: a.id,
      kind: "letter" as const,
      strokes: glyph.strokes,
      char: a.char,
      label: a.roman,
      note: a.mnemonic,
      audio: a.audio,
      ghostChar: a.char,
    },
  ];
});

const WRITABLE_WORDS = ITEMS.flatMap((item) => {
  const composed = composeGujarati(item.gujarati);
  if (!composed || composed.clusters.length > MAX_WORD_LETTERS) return [];
  return [{ item, composed }];
});

const CONCEPTS = GRAMMAR_MODULES.flatMap((m) => m.concepts);

export default function MixPage() {
  const { progress, hydrated, gradeItem, award } = useProgress();

  // One seed for the sitting. Everything downstream reads from it, so the mix
  // is fixed the moment you start it and different the next time you come back.
  const [seed] = useState(newSeed);
  const [leg, setLeg] = useState(0);
  const [tally, setTally] = useState({ correct: 0, total: 0 });
  const [startXp] = useState(() => progress.xp);

  // Snapshot at mount, like every session component here: grading changes
  // `progress` on every answer, and a plan derived from live progress would
  // re-plan the sitting underneath the learner.
  const [snapshot] = useState(progress);

  const legs: MixLeg[] = useMemo(() => {
    const writableStarted = WRITABLE_LETTERS.filter(
      (t) => itemStatus(snapshot, writingCardId(t.id)) !== "new",
    ).length;
    return planMix(
      {
        deck: Object.keys(snapshot.cards).filter((id) => !id.startsWith("g-") && !id.startsWith("w-"))
          .length,
        writable: writableStarted,
        concepts: snapshot.completedGrammar.length,
      },
      makeRng(seed),
    );
  }, [snapshot, seed]);

  const reviewPool: LexItem[] = useMemo(() => {
    const due = new Set(dueItemIds(snapshot));
    const carded = ITEMS.filter((i) => snapshot.cards[i.id]);
    const deck = [...carded, ...unlockedFrequency(snapshot)];
    // Due first — that's the whole reason the review leg leads.
    return [...deck.filter((i) => due.has(i.id)), ...deck.filter((i) => !due.has(i.id))];
  }, [snapshot]);

  const writePools: WritePools = useMemo(() => {
    const met = WRITABLE_WORDS.filter(({ item }) => snapshot.cards[item.id]);
    const source = met.length >= 3 ? met : WRITABLE_WORDS;
    return {
      letters: WRITABLE_LETTERS,
      words: source.map(({ item, composed }) => ({
        id: item.id,
        kind: "word" as const,
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
  }, [snapshot]);

  const typePools: TypePools = useMemo(() => {
    const met = TYPABLE_WORDS.filter((i) => snapshot.cards[i.id]);
    const freq = unlockedFrequency(snapshot).filter((i) => acceptsTyped(i.gujarati, i.roman));
    const words = [...met, ...freq];
    return {
      letters: PRACTICE_LETTERS,
      syllables: TYPE_SYLLABLES,
      words: words.length ? words : TYPABLE_WORDS.slice(0, 6),
    };
  }, [snapshot]);

  /** Drills drawn from concepts they've already been taught — never a new one.
   *  The mix is for keeping things sharp; meeting a concept for the first time
   *  belongs in Vyakaran, where it comes with its discovery step. */
  const grammarDrills = useMemo(() => {
    const done = CONCEPTS.filter((c) => snapshot.completedGrammar.includes(c.id));
    const rng = makeRng(`${seed}:grammar`);
    const concept = pick(done, rng);
    if (!concept) return [];
    return shuffled(drillPool(concept), rng)
      .slice(0, 2)
      .map((exercise) => ({ exercise, conceptId: concept.id }));
  }, [snapshot, seed]);

  const advance = useCallback((correct: number, total: number) => {
    setTally((t) => ({ correct: t.correct + correct, total: t.total + total }));
    setLeg((l) => l + 1);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="guj animate-pulse text-lg text-ink-soft">કેમ છો...</div>
      </div>
    );
  }

  const current = legs[leg];
  const wide = current?.kind === "write";

  // ── Done ────────────────────────────────────────────────────────────────
  if (!current) {
    const earned = progress.xp - startXp;
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-4 px-4 py-6 text-center">
        <div className="text-6xl" aria-hidden="true">
          {tally.correct === tally.total ? "🎉" : "🌸"}
        </div>
        <h2 className="text-2xl">That&apos;s today done</h2>
        <p className="text-ink-soft">
          <span className="font-semibold text-marigold">
            {tally.correct}/{tally.total}
          </span>{" "}
          across {legs.length} kinds of practice
          {earned > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-marigold">+{earned} XP</span>
            </>
          )}
        </p>
        <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
          <Link
            href="/journey"
            className="w-full rounded-full bg-marigold px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
          >
            See how far you are
          </Link>
          <Link
            href="/"
            className="w-full rounded-full border border-line bg-surface px-6 py-3 text-base font-semibold text-ink"
          >
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto flex min-h-dvh w-full flex-col px-4 py-6 pb-24 ${
        wide ? "max-w-[720px]" : "max-w-[480px]"
      }`}
    >
      {/* One bar for the whole sitting, so the legs read as one session rather
          than four sessions in a trench coat. */}
      <div className="mb-4 flex items-center gap-2">
        {legs.map((l, i) => (
          <div
            key={`${l.kind}-${i}`}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < leg ? "bg-marigold" : i === leg ? "bg-marigold/40" : "bg-surface-2"
            }`}
          />
        ))}
        <span className="ml-1 shrink-0 text-[11px] font-medium text-ink-soft">
          {LEG_LABEL[current.kind]}
        </span>
      </div>

      {current.kind === "review" && (
        <ReviewSession
          key={leg}
          pool={reviewPool}
          size={current.size}
          onExit={() => setLeg(legs.length)}
          onComplete={advance}
        />
      )}
      {current.kind === "letters" && (
        <AksharPractice
          key={leg}
          pool={PRACTICE_LETTERS}
          size={current.size}
          onExit={() => setLeg(legs.length)}
          onComplete={advance}
        />
      )}
      {current.kind === "write" && (
        <WriteSession
          key={leg}
          pools={writePools}
          size={current.size}
          onExit={() => setLeg(legs.length)}
          onComplete={advance}
        />
      )}
      {current.kind === "type" && (
        <TypeSession
          key={leg}
          pools={typePools}
          size={current.size}
          onExit={() => setLeg(legs.length)}
          onComplete={advance}
        />
      )}
      {current.kind === "grammar" && (
        <GrammarLeg
          key={leg}
          drills={grammarDrills}
          seed={seed}
          onDone={advance}
          onAnswer={(conceptId, ok) => {
            gradeItem(grammarCardId(conceptId), ok ? "good" : "again");
            if (ok) award(XP.exercise);
          }}
        />
      )}
    </div>
  );
}

/** A couple of grammar drills, borrowed from the concept runner's own views. */
function GrammarLeg({
  drills,
  seed,
  onDone,
  onAnswer,
}: {
  drills: { exercise: ReturnType<typeof drillPool>[number]; conceptId: string }[];
  seed: string;
  onDone: (correct: number, total: number) => void;
  onAnswer: (conceptId: string, correct: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);

  const current = drills[index];

  // Nothing to draw from (no concept finished yet) — skip the leg rather than
  // dead-end the sitting. In an effect, not in render: calling back into the
  // parent's setState while rendering is how you get a React warning and,
  // eventually, a loop.
  const empty = drills.length === 0;
  useEffect(() => {
    if (empty) onDone(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empty]);

  if (!current) return null;

  function settle(ok: boolean) {
    setAnswered(true);
    if (ok) setCorrect((c) => c + 1);
    onAnswer(current.conceptId, ok);
  }

  function next() {
    if (index + 1 >= drills.length) {
      onDone(correct, drills.length);
      return;
    }
    setIndex(index + 1);
    setAnswered(false);
  }

  const optionSeed = `${seed}:${current.exercise.id}`;

  return (
    <div className="flex flex-1 flex-col">
      {current.exercise.kind === "build" ? (
        <BuildDrill exercise={current.exercise} optionSeed={optionSeed} onAnswered={settle} />
      ) : (
        <ChooseDrill exercise={current.exercise} optionSeed={optionSeed} onAnswered={settle} />
      )}
      {answered && (
        <button
          type="button"
          onClick={next}
          className="mt-6 w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent active:scale-[.99]"
        >
          {index + 1 >= drills.length ? "Finish" : "Continue"}
        </button>
      )}
    </div>
  );
}
