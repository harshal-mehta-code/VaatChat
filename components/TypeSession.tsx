"use client";

// Lipi session — learning to type Gujarati on the keyboard you already own.
//
// The ladder (docs/LEKHAN.md §2.4), climbed per-letter rather than per-session:
//
//   Match    👀  see ક → tap `ka`            — zero friction, one hand
//   Hear     🔊  hear /ka/ → tap `ka`        — the sound→spelling map
//   Type     ⌨️  hear it → type it           — production, no options
//   Syllable ⌨️  કી → `kee`                   — where vowel length gets real
//   Word     ⌨️  "How are you?" → `kem cho`  — the script builds as you type
//
// Which rung a letter gets is decided by its own SRS card, so a session is a
// mix: new letters get the gentle rung, familiar ones get the hard one. Nothing
// is gated — the ladder steers, it never locks.
//
// The unusual bit is the candidate picker. `ta` is genuinely ambiguous — it's
// both ત and ટ — and a real keyboard resolves that by making you choose. So do
// we, at the exact moment of confusion, which drills the hardest distinction for
// an English ear while teaching the tool she'll actually use.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Akshar, BarakshariCell, LexItem } from "@/lib/core/types";
import { useProgress } from "@/lib/client/useProgress";
import { itemStatus } from "@/lib/core/progress";
import { XP } from "@/lib/core/gamification";
import { playAudio } from "@/lib/client/speech";
import { barakshariAudioPath } from "@/lib/content/audio-paths";
import {
  segmentGujarati,
  matchTyped,
  acceptsTyped,
  typedCanonical,
  typedRivals,
  type Cluster,
} from "@/lib/core/translit";

const SESSION_SIZE = 10;
/** Seen the "your keyboard doesn't have ṭ" explainer? Device-local, not synced. */
const INTRO_KEY = "vaatchat.lipi.intro.v1";

type Rung = "match" | "hear" | "type" | "syllable" | "word";

interface Question {
  key: string;
  rung: Rung;
  /** What the learner has to produce, in Gujarati. */
  guj: string;
  /** The spelling we'd teach — capitals and all. */
  answer: string;
  /** How it reads, in the app's romanization (the one with the marks). */
  roman: string;
  english?: string;
  audio?: string;
  /** SRS cards this answer is evidence for. */
  cardIds: string[];
  /** Options for the tap rungs. */
  options?: string[];
  /** Letters a real keyboard would offer for the same lowercase typing. */
  rivals?: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface TypePools {
  letters: Akshar[];
  syllables: BarakshariCell[];
  /** Vocabulary the learner has unlocked. Filtered to what's actually typable. */
  words: LexItem[];
}

/**
 * Compose a session. Letters carry it; syllables and words are the payoff at
 * the end, and only appear once there's enough letter knowledge to earn them.
 */
function buildSession(
  pools: TypePools,
  rungFor: (akshar: Akshar) => Rung,
  knownLetters: number,
): Question[] {
  const letterQs: Question[] = shuffle(pools.letters).map((a, i) => {
    const rung = rungFor(a);
    const answer = typedCanonical(a.char);
    const distractors = shuffle(
      pools.letters.filter((o) => o.id !== a.id && typedCanonical(o.char) !== answer),
    )
      .slice(0, 3)
      .map((o) => typedCanonical(o.char));
    return {
      key: `${a.id}-${i}`,
      rung,
      guj: a.char,
      answer,
      roman: a.roman,
      audio: a.audio,
      cardIds: [a.id],
      options: rung === "match" || rung === "hear" ? shuffle([answer, ...distractors]) : undefined,
      rivals: typedRivals(a.char),
    };
  });

  // Syllables unlock the moment a handful of letters have stuck — before that
  // they're just noise. Two per session: enough to make vowel length land.
  const syllableQs: Question[] =
    knownLetters >= 6
      ? shuffle(pools.syllables)
          .slice(0, 2)
          .map((c, i) => ({
            key: `${c.consonantId}-${c.vowelId}-${i}`,
            rung: "syllable" as const,
            guj: c.combined,
            answer: typedCanonical(c.combined),
            roman: c.roman,
            audio: barakshariAudioPath(c),
            // A correct કી is evidence for both ક and ઈ.
            cardIds: [c.consonantId, c.vowelId],
          }))
      : [];

  // The real-world payoff, and the emotional beat of the whole track.
  const wordQs: Question[] = shuffle(pools.words)
    .slice(0, knownLetters >= 6 ? 2 : 1)
    .map((w, i) => ({
      key: `${w.id}-${i}`,
      rung: "word" as const,
      guj: w.gujarati,
      // The authored romanization, not the derived one: it's native-verified,
      // the pool is already filtered to romans the matcher accepts, and the
      // derived form guesses wrong on schwa-final words (કૃષ્ણ → "krushn").
      answer: w.roman,
      roman: w.roman,
      english: w.english,
      audio: w.audio,
      cardIds: [w.id],
    }));

  const tail = [...syllableQs, ...wordQs];
  return [...letterQs.slice(0, Math.max(0, SESSION_SIZE - tail.length)), ...tail];
}

/** The script assembling under her fingers — cluster by cluster, as she types. */
function ScriptReveal({
  clusters,
  matched,
  settled,
}: {
  clusters: Cluster[];
  matched: number;
  settled: boolean;
}) {
  return (
    <div className="flex min-h-16 flex-wrap items-center justify-center gap-0.5">
      {clusters.map((c, i) => {
        const shown = settled || i < matched;
        if (c.literal && /\s/.test(c.guj)) return <span key={i} className="w-3" />;
        return (
          <span
            key={i}
            className={`guj text-4xl transition-all duration-200 ${
              shown
                ? "scale-100 text-ink opacity-100"
                : "scale-95 text-ink-soft opacity-25 blur-[1px]"
            }`}
          >
            {shown ? c.guj : "▁"}
          </span>
        );
      })}
    </div>
  );
}

export default function TypeSession({ pools, onExit }: { pools: TypePools; onExit: () => void }) {
  const { progress, gradeItem, award } = useProgress();
  const [round, setRound] = useState(0);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(INTRO_KEY)) setShowIntro(true);
    } catch {
      /* storage blocked — just skip the explainer */
    }
  }, []);

  const knownLetters = useMemo(
    () => pools.letters.filter((a) => itemStatus(progress, a.id) === "known").length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, pools.letters],
  );

  const session = useMemo(
    () =>
      buildSession(
        pools,
        (a) => {
          const status = itemStatus(progress, a.id);
          if (status === "new") return "match";
          if (status === "learning") return Math.random() < 0.5 ? "hear" : "type";
          return "type";
        },
        knownLetters,
      ),
    // Rebuilt only between rounds: re-deriving mid-session on every graded card
    // would reshuffle the questions under the learner.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pools, round],
  );

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  /** Set once the answer is in: what happened, and whether it counted. */
  const [result, setResult] = useState<"right" | "wrong" | null>(null);
  /** The keyboard is asking her to choose between ત and ટ. */
  const [choosing, setChoosing] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [earned, setEarned] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = session[index];
  const clusters = useMemo(() => (q ? segmentGujarati(q.guj) : []), [q]);
  const match = useMemo(() => matchTyped(clusters, input), [clusters, input]);
  // Shuffled once per question — re-rolling on every keystroke would make the
  // candidates jump around under her thumb.
  const candidates = useMemo(() => (q ? shuffle([q.guj, ...(q.rivals ?? [])]) : []), [q]);

  // Autoplay the prompt when the sound *is* the prompt.
  useEffect(() => {
    if (q && (q.rung === "hear" || q.rung === "type" || q.rung === "word")) {
      void playAudio(q.audio, q.guj);
    }
    if (q && q.rung !== "match" && q.rung !== "hear") {
      // Focus without scrolling the pad off-screen on iPad.
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [q]);

  function settle(ok: boolean) {
    if (!q) return;
    setResult(ok ? "right" : "wrong");
    for (const id of q.cardIds) gradeItem(id, ok ? "good" : "again");
    if (ok) {
      const xp = q.rung === "word" ? XP.wordTyped : XP.exercise;
      award(xp);
      setEarned((e) => e + xp);
      setCorrectCount((c) => c + 1);
    }
  }

  function tap(option: string) {
    if (!q || result) return;
    setPicked(option);
    settle(option === q.answer);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q || result || choosing) return;
    if (!match.complete) {
      settle(false);
      return;
    }
    // Right sounds, but on a real keyboard this spelling would have offered her
    // more than one letter. Make her pick, the way the keyboard would — unless
    // she typed the exact capital form, which is precisely how you tell a real
    // keyboard you meant the retroflex. Knowing that deserves to skip the step.
    const ambiguous =
      q.rung === "type" &&
      input.trim() !== q.answer &&
      (q.rivals?.some((r) => acceptsTyped(r, input)) ?? false);
    if (ambiguous) {
      setChoosing(true);
      return;
    }
    settle(true);
  }

  function choose(char: string) {
    if (!q) return;
    setChoosing(false);
    setPicked(char);
    settle(char === q.guj);
  }

  function next() {
    if (index + 1 >= session.length) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setInput("");
    setPicked(null);
    setResult(null);
    setChoosing(false);
  }

  function again() {
    setRound((r) => r + 1);
    setIndex(0);
    setInput("");
    setPicked(null);
    setResult(null);
    setChoosing(false);
    setCorrectCount(0);
    setEarned(0);
    setDone(false);
  }

  function dismissIntro() {
    setShowIntro(false);
    try {
      window.localStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* non-fatal */
    }
  }

  // ── The one-time explainer ───────────────────────────────────────────────
  if (showIntro) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
        <div className="text-6xl" aria-hidden="true">
          ⌨️
        </div>
        <h2 className="text-2xl">Your phone can already type Gujarati</h2>
        <div className="flex max-w-sm flex-col gap-3 text-left text-sm text-ink-soft">
          <p>
            Gujarati keyboards work <span className="font-semibold text-ink">phonetically</span> —
            you type <code className="rounded bg-surface-2 px-1 text-ink">kem cho</code> and out
            comes <span className="guj text-lg text-ink">કેમ છો</span>. Learn that map and you can
            text the family group this week.
          </p>
          <p>
            One honest catch: the romanization we show you has marks for the sound —{" "}
            <span className="text-ink">ṭa</span>, <span className="text-ink">ḍa</span> — and your
            keyboard has no ṭ. So here you type the plain version,{" "}
            <code className="rounded bg-surface-2 px-1 text-ink">ta</code>, and when that&apos;s
            ambiguous the keyboard asks you to pick. We do the same.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissIntro}
          className="w-full max-w-xs rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent active:scale-[.99]"
        >
          Let&apos;s go →
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="text-6xl" aria-hidden="true">
          📱
        </div>
        <h2 className="text-2xl">Typed like a local.</h2>
        <p className="text-ink-soft">
          <span className="font-semibold text-marigold">
            {correctCount}/{session.length}
          </span>{" "}
          right
          {earned > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-marigold">+{earned} XP</span>
            </>
          )}
        </p>
        <p className="max-w-xs text-sm text-ink-soft">
          Try it for real: add the Gujarati keyboard on your phone and send one word to someone.
        </p>
        <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
          <button
            type="button"
            onClick={again}
            className="w-full rounded-full bg-marigold px-6 py-3 text-base font-semibold text-on-accent active:scale-[.99]"
          >
            Type more
          </button>
          <button
            type="button"
            onClick={onExit}
            className="w-full rounded-full border border-line bg-surface px-6 py-3 text-base font-semibold text-ink"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!q) return null;

  const isTap = q.rung === "match" || q.rung === "hear";
  const prompt =
    q.rung === "match"
      ? "How would you type this?"
      : q.rung === "hear"
        ? "Which spelling makes this sound?"
        : q.rung === "word"
          ? "Type it in roman — watch the script build"
          : q.rung === "syllable"
            ? "Type this syllable"
            : "Hear it, then type it";

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={onExit} aria-label="Exit typing practice" className="text-ink-soft">
          <span aria-hidden="true">✕</span>
        </button>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-marigold transition-[width]"
            style={{ width: `${(index / session.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-ink-soft">
          {index + 1}/{session.length}
        </span>
      </div>

      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-ink-soft">{prompt}</p>

      {/* ── The prompt ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-6 text-center shadow-[var(--shadow)]">
        {q.rung === "match" || q.rung === "syllable" ? (
          <>
            <div className="guj text-6xl font-medium text-ink">{q.guj}</div>
            <button
              type="button"
              onClick={() => void playAudio(q.audio, q.guj)}
              className="text-sm text-ink-soft"
            >
              🔊 hear it
            </button>
          </>
        ) : q.rung === "word" ? (
          <>
            {q.english && <div className="text-lg font-medium text-ink">{q.english}</div>}
            <button
              type="button"
              onClick={() => void playAudio(q.audio, q.guj)}
              aria-label="Replay"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-peacock text-2xl text-on-accent shadow-[var(--shadow)] active:scale-95"
            >
              <span aria-hidden="true">🔊</span>
            </button>
            <ScriptReveal clusters={clusters} matched={match.matched} settled={result !== null} />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void playAudio(q.audio, q.guj)}
              aria-label="Replay sound"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-peacock text-2xl text-on-accent shadow-[var(--shadow)] active:scale-95"
            >
              <span aria-hidden="true">🔊</span>
            </button>
            {/* The letter is the answer on both these rungs, so it stays hidden
                until it's been answered — otherwise "type what you hear" is
                just copying, and the candidate picker below has nothing to
                distinguish. */}
            {result !== null && <div className="guj text-5xl font-medium text-ink">{q.guj}</div>}
          </>
        )}
      </div>

      {/* ── The answer ─────────────────────────────────────────────────── */}
      {isTap ? (
        <div className="grid grid-cols-2 gap-2">
          {q.options?.map((opt) => {
            const isPicked = picked === opt;
            const isRight = opt === q.answer;
            const state =
              result === null
                ? "border-line bg-surface text-ink hover:bg-surface-2"
                : isRight
                  ? "border-good bg-good/10 text-good"
                  : isPicked
                    ? "border-bad bg-bad/10 text-bad"
                    : "border-line bg-surface text-ink-soft";
            return (
              <button
                key={opt}
                type="button"
                disabled={result !== null}
                onClick={() => tap(opt)}
                className={`rounded-2xl border px-4 py-4 text-center font-mono text-lg font-medium transition-colors ${state}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : choosing ? (
        // The candidate picker — the keyboard's own question, asked at the
        // moment it actually matters.
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-ink-soft">
            <code className="rounded bg-surface-2 px-1 text-ink">{input.toLowerCase()}</code> gives
            you more than one letter — pick the one you heard.
          </p>
          <div className="flex justify-center gap-3">
            {candidates.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => choose(char)}
                className="guj flex h-24 w-24 items-center justify-center rounded-2xl border border-line bg-surface text-5xl text-ink shadow-[var(--shadow)] active:scale-95"
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={result !== null}
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            placeholder={q.rung === "word" ? "kem cho" : "ka"}
            className={`w-full rounded-2xl border-2 bg-surface-2 px-5 py-4 text-center font-mono text-xl text-ink transition-colors ${
              result === "wrong"
                ? "border-bad"
                : result === "right"
                  ? "border-good"
                  : input && !match.prefix
                    ? "border-bad/60"
                    : match.complete
                      ? "border-good"
                      : "border-line"
            }`}
          />
          {result === null && (
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent disabled:opacity-40 active:scale-[.99]"
            >
              Check
            </button>
          )}
        </form>
      )}

      {/* ── Feedback ───────────────────────────────────────────────────── */}
      {result !== null && (
        <div className="mt-5">
          <div
            className={`rounded-2xl border p-4 text-center ${
              result === "right" ? "border-good/40 bg-good/10" : "border-bad/40 bg-bad/10"
            }`}
          >
            <p className="text-base font-semibold text-ink">
              {result === "right" ? "That's it." : "Not quite."}{" "}
              <span className="guj text-xl">{q.guj}</span> is{" "}
              <code className="font-mono text-ink">{q.answer}</code>
            </p>
            {q.rung !== "word" && q.roman !== q.answer && (
              <p className="mt-1 text-xs text-ink-soft">
                Written <span className="font-medium text-ink">{q.roman}</span> in the app because
                that shows the sound — but a keyboard has no marks, so you type{" "}
                <span className="font-medium text-ink">{q.answer}</span>.
              </p>
            )}
            {q.rung === "word" && q.english && (
              <p className="mt-1 text-sm text-ink-soft">{q.english}</p>
            )}
          </div>
          <button
            type="button"
            onClick={next}
            className="mt-4 w-full rounded-full bg-marigold px-6 py-3.5 text-base font-semibold text-on-accent active:scale-[.99]"
          >
            {index + 1 >= session.length ? "Finish" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
