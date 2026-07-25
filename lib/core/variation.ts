// ─────────────────────────────────────────────────────────────────────────
// Variation — why the app shouldn't feel the same twice.
//
// There are two different jobs here, and conflating them is how an app ends up
// either predictable or flickering:
//
//   Stable *within* a question.  Options must not reorder when state updates
//   mid-answer. That's what a seeded shuffle is for, and it's why this file
//   exists at all rather than Math.random() being sprinkled around.
//
//   Different *between* sittings. If the seed is something permanent like an
//   exercise id, "stable" quietly becomes "identical forever, for everyone" —
//   the answer is always third, the same three wrong answers, the same order.
//   That's the failure this file is really here to prevent.
//
// So: one RNG, seeded by (what is being shuffled) + (a seed minted when the
// session starts). Stable while you're answering, new when you come back.
//
// Pure and portable, like the rest of lib/core — `Rng` is just `() => number`,
// so `Math.random` is a valid one where a session genuinely wants pure chance.
// ─────────────────────────────────────────────────────────────────────────

export type Rng = () => number;

/**
 * A deterministic RNG from a string. Not cryptographic and not trying to be —
 * it shuffles quiz options — but it does have to be good on *its first few
 * outputs from similar seeds*, which is an unusual requirement and the reason
 * this isn't the four-line LCG you'd reach for first.
 *
 * Our seeds are near-identical by construction: `<session>:<exercise-id>`, same
 * prefix, one character apart. A plain LCG hands back visibly correlated first
 * values for those, so shuffling four options with a handful of seeds landed on
 * two orders instead of six — the very predictability this module exists to
 * remove. (`npm run check:variation` caught exactly that, which is why the
 * check asserts on the spread rather than just "it runs".)
 *
 * So: an avalanching hash for the seed (xmur3), then mulberry32 to draw from.
 */
export function makeRng(seed: string): Rng {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  let state = (h ^ (h >>> 16)) >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A fresh seed for one sitting. Mint it once when a runner mounts and pass it
 * down — everything derived from it then varies together, per session, while
 * staying rock-stable through re-renders.
 */
export function newSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Fisher–Yates, non-mutating. */
export function shuffled<T>(arr: readonly T[], rng: Rng): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** `n` distinct items, in random order. Fewer if the pool is smaller. */
export function sample<T>(arr: readonly T[], rng: Rng, n: number): T[] {
  return shuffled(arr, rng).slice(0, Math.max(0, n));
}

/** One item, or undefined from an empty pool. */
export function pick<T>(arr: readonly T[], rng: Rng): T | undefined {
  return arr.length === 0 ? undefined : arr[Math.floor(rng() * arr.length)];
}

/** Shuffle by a seed string — the common case, in one call. */
export function seededShuffle<T>(arr: readonly T[], seed: string): T[] {
  return shuffled(arr, makeRng(seed));
}
