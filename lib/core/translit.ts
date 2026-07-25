// ─────────────────────────────────────────────────────────────────────────
// Lipi — the script, and how you actually type it.
//
// Every Gujarati phone keyboard (Gboard, iOS Gujarati Transliteration) is
// *phonetic*: you type `kem cho` and it gives you કેમ છો. Learning that map is
// the single fastest route from "I'm learning Gujarati" to "I just texted the
// family group in Gujarati" — see docs/LEKHAN.md §2.
//
// This module is the engine for that. It is deliberately pure: no React, no
// DOM, no content imports. The tables below describe the *script* (a fixed
// property of Unicode), not our curriculum, so they belong in the core and an
// iOS client can reuse them verbatim.
//
// Three jobs:
//   segmentGujarati()  — split a word into the clusters a hand/keyboard emits
//   matchTyped()       — does what someone typed build this word (so far)?
//   typedCanonical()   — what we'd tell them to type
//
// The romanization here is NOT the app's reading romanization. That one carries
// diacritics (ṭa, ḍa) so the *sound* is unambiguous; this one is plain ASCII,
// because a phone keyboard has no ṭ. We're explicit with the learner about the
// mismatch rather than hiding it.
// ─────────────────────────────────────────────────────────────────────────

// ── Unicode landmarks (Gujarati block, U+0A80–U+0AFF) ─────────────────────

const HALANT = "્"; // ્  — kills the inherent 'a', binds a conjunct
const ANUSVARA = "ં"; // ં
const CHANDRABINDU = "ઁ"; // ઁ
const VISARGA = "ઃ"; // ઃ

/**
 * A nasal mark is optional when typing. Purists type `shun` for શું; in
 * practice everyone types `shu` and picks the candidate — so we accept both and
 * let the reveal teach what the mark does.
 */
const NASAL_TYPED = ["n", "m", ""];

interface Spec {
  /** Plain-ASCII reading, e.g. "kh". */
  roman: string;
  /** Accepted keyboard spellings, canonical first, always lowercase. */
  typed: string[];
  /** How we'd *show* it — the spelling a real keyboard resolves unambiguously,
   *  which for retroflexes means a capital. Defaults to typed[0]. */
  keyboard?: string;
}

/** Independent vowels — the standalone letters (અ, આ, ઇ …). */
const VOWEL: Record<string, Spec> = {
  "અ": { roman: "a", typed: ["a"] },
  "આ": { roman: "aa", typed: ["aa", "a"] },
  "ઇ": { roman: "i", typed: ["i"] },
  "ઈ": { roman: "ee", typed: ["ee", "ii", "i"] },
  "ઉ": { roman: "u", typed: ["u"] },
  "ઊ": { roman: "oo", typed: ["oo", "uu", "u"] },
  "ઋ": { roman: "ru", typed: ["ru", "ri"] },
  "એ": { roman: "e", typed: ["e"] },
  "ઐ": { roman: "ai", typed: ["ai"] },
  "ઓ": { roman: "o", typed: ["o"] },
  "ઔ": { roman: "au", typed: ["au", "ou"] },
};

/** Matras — the same vowels in their attached (diacritic) form. */
const MATRA: Record<string, Spec> = {
  "ા": { roman: "aa", typed: ["aa", "a"] },
  "િ": { roman: "i", typed: ["i"] },
  "ી": { roman: "ee", typed: ["ee", "ii", "i"] },
  "ુ": { roman: "u", typed: ["u"] },
  "ૂ": { roman: "oo", typed: ["oo", "uu", "u"] },
  "ૃ": { roman: "ru", typed: ["ru", "ri"] },
  "ે": { roman: "e", typed: ["e"] },
  "ૈ": { roman: "ai", typed: ["ai"] },
  "ો": { roman: "o", typed: ["o"] },
  "ૌ": { roman: "au", typed: ["au", "ou"] },
};

/**
 * Consonant stems — *without* the inherent 'a', because that's what combines.
 *
 * Note how many collide once you lowercase: ત and ટ are both `ta`, દ and ડ both
 * `da`. That isn't sloppiness in the table, it's the truth about the keyboard —
 * and it's exactly why the drill makes you pick a candidate (docs/LEKHAN.md
 * §2.3). The capital form in `keyboard` is the escape hatch a real keyboard
 * gives you, and worth teaching.
 */
const CONSONANT: Record<string, Spec> = {
  "ક": { roman: "k", typed: ["k"] },
  "ખ": { roman: "kh", typed: ["kh"] },
  "ગ": { roman: "g", typed: ["g"] },
  "ઘ": { roman: "gh", typed: ["gh"] },
  "ઙ": { roman: "ng", typed: ["ng"] },
  "ચ": { roman: "ch", typed: ["ch", "c"] },
  "છ": { roman: "chh", typed: ["chh", "ch"], keyboard: "chha" },
  "જ": { roman: "j", typed: ["j"] },
  "ઝ": { roman: "jh", typed: ["jh", "z"] },
  "ઞ": { roman: "ny", typed: ["ny"] },
  "ટ": { roman: "t", typed: ["t", "tt"], keyboard: "Ta" },
  "ઠ": { roman: "th", typed: ["th", "tth"], keyboard: "Tha" },
  "ડ": { roman: "d", typed: ["d", "dd"], keyboard: "Da" },
  "ઢ": { roman: "dh", typed: ["dh", "ddh"], keyboard: "Dha" },
  "ણ": { roman: "n", typed: ["n", "nn"], keyboard: "Na" },
  "ત": { roman: "t", typed: ["t"] },
  "થ": { roman: "th", typed: ["th"] },
  "દ": { roman: "d", typed: ["d"] },
  "ધ": { roman: "dh", typed: ["dh"] },
  "ન": { roman: "n", typed: ["n"] },
  "પ": { roman: "p", typed: ["p"] },
  "ફ": { roman: "ph", typed: ["ph", "f"], keyboard: "fa" },
  "બ": { roman: "b", typed: ["b"] },
  "ભ": { roman: "bh", typed: ["bh"] },
  "મ": { roman: "m", typed: ["m"] },
  "ય": { roman: "y", typed: ["y"] },
  "ર": { roman: "r", typed: ["r"] },
  "લ": { roman: "l", typed: ["l"] },
  "વ": { roman: "v", typed: ["v", "w"] },
  "શ": { roman: "sh", typed: ["sh"] },
  "ષ": { roman: "sh", typed: ["sh", "shh"], keyboard: "Sha" },
  "સ": { roman: "s", typed: ["s"] },
  "હ": { roman: "h", typed: ["h"] },
  "ળ": { roman: "l", typed: ["l", "ll"], keyboard: "La" },
};

/**
 * Conjuncts whose typed form isn't just their parts glued together. Everything
 * else (ત્ર → `tr`, સ્વ → `sv`, ક્ષ → `ksh`) falls out of stem concatenation for
 * free, which is why the general case needs no table at all.
 */
const CONJUNCT_TYPED: Record<string, string[]> = {
  "જ્ઞ": ["gn", "gy", "jn", "jny"],
};

/** How many spellings we'll keep for one cluster before it stops being useful. */
const MAX_FORMS = 16;

// ── Segmentation ──────────────────────────────────────────────────────────

/** One writing/typing beat: a consonant with its vowel, or a standalone vowel. */
export interface Cluster {
  /** The Gujarati text of this cluster, e.g. "કે". */
  guj: string;
  /** Plain-ASCII reading, e.g. "ke". */
  roman: string;
  /** Every keyboard spelling that produces it, canonical first, lowercase. */
  typed: string[];
  /** Space or punctuation — carried through, matched literally. */
  literal?: boolean;
  /** Rode on the inherent 'a' rather than an explicit matra — the clusters
   *  whose final vowel disappears in speech (and in typing) at a word's end. */
  inherent?: boolean;
  /** Component letters, in the order a hand writes them (consonant, then
   *  matra). Feeds word-writing composition — docs/LEKHAN.md §3.7. */
  parts: string[];
}

function isConsonant(ch: string): boolean {
  return ch in CONSONANT;
}

function combine(prefixes: string[], suffixes: string[]): string[] {
  const out: string[] = [];
  for (const p of prefixes) for (const s of suffixes) out.push(p + s);
  return dedupe(out).slice(0, MAX_FORMS);
}

function dedupe(xs: string[]): string[] {
  return [...new Set(xs)];
}

/**
 * Split Gujarati text into the clusters a keyboard emits one at a time.
 *
 *   segmentGujarati("કેમ છો") → કે · મ · ␣ · છો
 *
 * Unknown characters (Latin, digits, punctuation) survive as literal clusters,
 * so a mixed string round-trips rather than throwing.
 */
export function segmentGujarati(text: string): Cluster[] {
  const chars = [...text.normalize("NFC")];
  const out: Cluster[] = [];
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];

    if (isConsonant(ch)) {
      // Stem: one consonant, or several bound by halants (સ્વ, ક્ષ, મ્મ).
      const letters = [ch];
      i++;
      while (i + 1 < chars.length && chars[i] === HALANT && isConsonant(chars[i + 1])) {
        letters.push(chars[i + 1]);
        i += 2;
      }
      // A trailing halant (word-final, or before a non-consonant) still kills
      // the inherent 'a' — "ok" spelling, no vowel of its own.
      let bare = false;
      if (i < chars.length && chars[i] === HALANT) {
        bare = true;
        i++;
      }

      const stemGuj = letters.join(HALANT);
      const stemRoman = letters.map((l) => CONSONANT[l].roman).join("");
      const stemTyped =
        CONJUNCT_TYPED[stemGuj] ??
        letters.reduce<string[]>((acc, l) => combine(acc, CONSONANT[l].typed), [""]);

      // Vowel: an explicit matra, or the inherent 'a' that comes free.
      const matraChar = i < chars.length && MATRA[chars[i]] ? chars[i] : "";
      const matra = matraChar ? MATRA[matraChar] : undefined;
      if (matra) i++;

      let guj = stemGuj + matraChar;
      let roman = stemRoman + (matra ? matra.roman : bare ? "" : "a");
      let typed = matra
        ? combine(stemTyped, matra.typed)
        : bare
          ? stemTyped
          : // Bare consonant: `ka` is the honest spelling, but schwa-deletion
            // means `k` is what you type mid-word (`kem`, not `kaem`).
            dedupe([...stemTyped.map((s) => s + "a"), ...stemTyped]).slice(0, MAX_FORMS);

      // A nasal or visarga rides along on the same cluster.
      const tail = i < chars.length ? chars[i] : "";
      if (tail === ANUSVARA || tail === CHANDRABINDU) {
        guj += tail;
        roman += "n";
        typed = combine(typed, NASAL_TYPED);
        i++;
      } else if (tail === VISARGA) {
        guj += tail;
        roman += "h";
        typed = combine(typed, ["h", ""]);
        i++;
      }

      // Parts in *writing* order: the consonant(s) first, then the matra — even
      // for િ, which renders to the left but is written second (§3.7).
      out.push({
        guj,
        roman,
        typed,
        parts: matraChar ? [...letters, matraChar] : letters,
        inherent: !matraChar && !bare,
      });
      continue;
    }

    const vowel = VOWEL[ch];
    if (vowel) {
      i++;
      let guj = ch;
      let roman = vowel.roman;
      let typed = vowel.typed;
      const tail = i < chars.length ? chars[i] : "";
      if (tail === ANUSVARA || tail === CHANDRABINDU) {
        guj += tail;
        roman += "n";
        typed = combine(typed, NASAL_TYPED);
        i++;
      } else if (tail === VISARGA) {
        guj += tail;
        roman += "h";
        typed = combine(typed, ["h", ""]);
        i++;
      }
      out.push({ guj, roman, typed, parts: [ch] });
      continue;
    }

    // Anything else — space, punctuation, a stray mark — passes through.
    i++;
    const isSpace = /\s/.test(ch);
    out.push({
      guj: ch,
      roman: ch,
      // Punctuation is optional to type; a space isn't, because word breaks are
      // real and `kemcho` genuinely doesn't work on a phone either.
      typed: isSpace ? [" "] : [ch, ""],
      literal: true,
      parts: [],
    });
  }

  return out;
}

/** Rebuild the plain-ASCII reading of a word from its clusters. */
export function romanize(text: string): string {
  return segmentGujarati(text)
    .map((c) => c.roman)
    .join("");
}

// ── Matching what someone typed ───────────────────────────────────────────

/**
 * Fold a typed string down to what we compare against.
 *
 * Case goes, because demanding a capital T from a beginner is a trap (the
 * candidate picker teaches that lesson instead). Diacritics go too, so the
 * app's own reading romanization — `ṭa`, `ī`, `ã` — can be fed straight in; the
 * tilde becomes an `n` because that's the nasal it stands for.
 */
export function normalizeTyped(s: string): string {
  return s
    .normalize("NFD")
    .replace(/([aeiouAEIOU])̃/g, "$1n") // ã → an  (a nasalized vowel *is* a nasal)
    .replace(/[̀-ͯ]/g, "") // drop remaining combining marks: ṭ → t, ī → i, ñ → n
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    // Only the leading side is trimmed: a *trailing* space is meaningful while
    // someone is mid-word ("kem " has just finished કેમ and opened a gap), and
    // matchTyped forgives it once the word is done.
    .trimStart();
}

export interface TypeMatch {
  /** Clusters fully built, from the start — what the reveal should show. */
  matched: number;
  /** The whole input maps exactly onto the whole word. */
  complete: boolean;
  /** Nothing typed so far is wrong (it's on the way to a valid word). */
  prefix: boolean;
}

/**
 * Walk `input` against the clusters, allowing every accepted spelling.
 *
 * Spellings overlap (`a` is a prefix of `aa`), so this can't be a greedy scan —
 * it's a small reachability search over (cluster, character) positions. Cheap:
 * words are short and the graph is tiny.
 */
export function matchTyped(clusters: Cluster[], input: string): TypeMatch {
  const text = normalizeTyped(input);
  const n = clusters.length;
  const width = text.length + 1;
  const seen = new Set<number>([0]);
  const queue: number[] = [0];

  while (queue.length) {
    const key = queue.shift() as number;
    const i = Math.floor(key / width);
    const j = key % width;
    if (i >= n) continue;
    for (const form of clusters[i].typed) {
      if (!text.startsWith(form, j)) continue;
      const next = (i + 1) * width + (j + form.length);
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }

  // How much script is standing: the most clusters any reachable state has
  // built. Deliberately *not* "clusters built by the whole input" — halfway
  // through typing `cho` the input no longer lands on a boundary, and a reveal
  // that blinked the word away every other keystroke would be worse than none.
  let matched = 0;
  for (const key of seen) matched = Math.max(matched, Math.floor(key / width));

  // A space typed after the last cluster is a habit, not a mistake — accept the
  // input as finished either with or without it.
  const complete =
    seen.has(n * width + text.length) ||
    (text.endsWith(" ") && seen.has(n * width + text.length - 1));

  // "Still on track" = either the input landed on a cluster boundary, or what's
  // left over is the beginning of a spelling the next cluster accepts.
  let prefix = false;
  for (const key of seen) {
    const i = Math.floor(key / width);
    const j = key % width;
    if (j === text.length) {
      prefix = true;
      break;
    }
    const rest = text.slice(j);
    if (i < n && clusters[i].typed.some((f) => f.startsWith(rest))) {
      prefix = true;
      break;
    }
  }

  return { matched, complete, prefix };
}

/** Does this typing produce this word, exactly? */
export function acceptsTyped(gujarati: string, input: string): boolean {
  return matchTyped(segmentGujarati(gujarati), input).complete;
}

/** Can this word be reached by typing at all — i.e. is it safe to drill? */
export function isTypable(gujarati: string): boolean {
  const clusters = segmentGujarati(gujarati);
  return clusters.length > 0 && clusters.every((c) => c.typed.some((f) => f.length > 0));
}

// ── What we tell the learner to type ──────────────────────────────────────

/**
 * The spelling we show as *the* answer — including the capital that a real
 * keyboard needs to disambiguate a retroflex. Accepting the lowercase form is
 * handled by matching; this is what gets taught.
 */
export function typedCanonical(gujarati: string): string {
  const chars = [...gujarati.normalize("NFC")];
  if (chars.length === 1) {
    const spec = VOWEL[chars[0]] ?? CONSONANT[chars[0]];
    if (spec) return spec.keyboard ?? (CONSONANT[chars[0]] ? spec.typed[0] + "a" : spec.typed[0]);
  }
  // Multi-character (a barakshari cell, a word): canonical spelling per
  // cluster, with the retroflex capital kept wherever it falls.
  const clusters = segmentGujarati(gujarati);
  /** Is this the last sounded cluster of its word, in a word of more than one?
   *  Schwa deletion is a *word*-final rule; anchoring it to the end of the whole
   *  string is what used to make કેમ છો? come out as `kema chho?`, which is not
   *  a thing anybody types. */
  const wordFinal = (idx: number): boolean => {
    let start = idx;
    while (start > 0 && !clusters[start - 1].literal) start--;
    return idx + 1 >= clusters.length || Boolean(clusters[idx + 1].literal) ? idx > start : false;
  };
  return clusters
    .map((c, idx) => {
      if (c.literal) return c.guj;
      let form = c.typed[0];
      // Word-final schwa deletion — શાક is `shaak`, never `shaaka`. Real in
      // speech, and real on the keyboard.
      if (c.inherent && wordFinal(idx) && form.endsWith("a")) {
        form = form.slice(0, -1);
      }
      // A retroflex needs its capital *wherever* it appears, not just at the
      // front. This used to fire only on the first cluster, which meant we
      // taught `rotalee` for રોટલી — and typing that on a real phone gives you
      // રોતલી, the dental. The lowercase form is still accepted (matching folds
      // case); this is about the answer we hold up as correct.
      const cap = CONSONANT[[...c.guj][0]]?.keyboard;
      // "Ta" → "T", then the cluster's own vowel: ટી → "Tee".
      if (cap && cap[0] !== cap[0].toLowerCase()) return cap[0] + form.slice(1);
      return form;
    })
    .join("");
}

/**
 * Letters that a real keyboard would offer alongside this one for the same
 * lowercase typing — the candidates the picker shows. Empty when there's no
 * genuine ambiguity.
 */
export function typedRivals(char: string): string[] {
  const spec = CONSONANT[char] ?? VOWEL[char];
  if (!spec) return [];
  const mine = spec.typed[0];
  const pool = CONSONANT[char] ? CONSONANT : VOWEL;
  return Object.entries(pool)
    .filter(([other, s]) => other !== char && s.typed[0] === mine)
    .map(([other]) => other);
}

// ── The other direction: roman in, script out ─────────────────────────────
//
// Everything above answers "did they type this word correctly?" — it always has
// a target to compare against, which is why the app can drill typing without
// ever producing Gujarati of its own.
//
// This does produce it, and that deserves an explanation, because "we never
// invent Gujarati" is a rule this project enforces in three separate guards.
// The rule exists to stop us *teaching* a form no native speaker writes. It has
// exactly one honest exception: the learner's own name. There is no authored
// answer for સ્મિતા or હર્ષલ — nobody can look it up for her, and the only
// person qualified to say whether it's right is the one typing it. So we render
// what a phonetic keyboard would render, show it to her, and let her fix it.
// Nothing here reaches a drill, a lesson, or an SRS card.
//
// Two rules do most of the work, and both are what a real keyboard does:
//   consonant + consonant  → halant stack   (priya → પ્રિય, not પરિય)
//   nasal + a different consonant → anusvara (anand → અનંદ, not અનન્દ)
//
// Where it falls short is the same place phone keyboards fall short: the
// retroflex/palatal choices English can't spell. `harshal` gives હર્શલ; the
// capital that a real keyboard needs — `harShal` — gives હર્ષલ. We teach that
// capital elsewhere (docs/LEKHAN.md §2.3), so this is consistent rather than a
// special case.

/** Nasals that become an anusvara before an unlike consonant. */
const NASALS = new Set(["ન", "મ", "ણ", "ઙ", "ઞ"]);

/**
 * Consonants a nasal does *not* collapse onto. Before a stop or a sibilant a
 * nasal is written as the anusvara — આનંદ, પલંગ, હંસ — but before a semivowel
 * it stays a real conjunct: જમ્યા, કન્યા, સમ્રાટ. Without this the rule eats
 * every મ્ય it meets.
 */
const NO_ANUSVARA_BEFORE = new Set(["ય", "ર", "લ", "વ", "ળ", "હ"]);

interface Reverse {
  /** Longest spelling first, so `aa` wins over `a`. */
  order: string[];
  map: Record<string, string>;
}

/** Build spelling → character, first writer wins so the unmarked letter keeps
 *  the plain spelling (`t` is ત, and ટ has to be asked for as `T`). */
function reverseOf(specs: Record<string, Spec>): Reverse {
  const map: Record<string, string> = {};
  const add = (form: string, char: string) => {
    if (form && !NOT_REVERSIBLE.has(form) && !(form in map)) map[form] = char;
  };
  // Only the canonical spelling, deliberately. The `typed` alternates exist to
  // be *forgiving* when reading input, and forgiveness inverts badly: ટ accepts
  // `tt`, so inverting the whole list turns the geminate in ઉત્તરાયણ into a
  // retroflex — ઉટરાયણ. Doubling a letter means a stack; asking for a retroflex
  // is what the capital is for.
  //
  // Two passes so the unmarked letter claims the plain spelling before the
  // retroflex gets a look in: `t` is ત, and ટ has to be asked for as `T`.
  const chars = Object.keys(specs);
  for (const pass of [0, 1]) {
    for (const char of chars) {
      const spec = specs[char];
      if ((spec.keyboard === undefined ? 0 : 1) !== pass) continue;
      add(spec.typed[0], char);
    }
  }
  // The alternates that are a genuinely different letter rather than a longer
  // spelling of the same one — these collide with nothing.
  for (const [form, char] of Object.entries(ALIAS)) if (char in specs) add(form, char);
  // The capital escape hatch: "Ta" → `T` → ટ. Case-sensitive on purpose.
  for (const char of chars) {
    const kb = specs[char].keyboard;
    if (!kb || kb[0] === kb[0].toLowerCase()) continue;
    const stem = kb.endsWith("a") ? kb.slice(0, -1) : kb;
    map[stem] = char;
  }
  return { order: Object.keys(map).sort((a, b) => b.length - a.length), map };
}

/** Single-letter spellings people really use, none of which collide. */
const ALIAS: Record<string, string> = { c: "ચ", z: "ઝ", w: "વ", f: "ફ" };

/**
 * Spellings that are too greedy to invert. `ri` and `ru` belong to ઋ/ૃ — the
 * vocalic r, which is genuinely rare — and letting them match here means every
 * consonant followed by an r swallows it: `priya` comes out પૃય instead of
 * પ્રિય. The r is nearly always the consonant, so the rare reading loses.
 */
const NOT_REVERSIBLE = new Set([
  // ઋ / ૃ, the vocalic r.
  "ri",
  "ru",
  // ઙ and ઞ, which our own alphabet data flags `rare` because they never stand
  // alone. Reading `ng` as ઙ turns પલંગ into પલઙ; letting it fall through to
  // ન + ગ lets the nasal rule below produce the anusvara that's actually written.
  "ng",
  "ny",
]);

const REV_CONSONANT = reverseOf(CONSONANT);
const REV_VOWEL = reverseOf(VOWEL);
/** Matras keyed by the *vowel* spelling, so one lookup serves both positions. */
const MATRA_BY_ROMAN: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [char, spec] of Object.entries(MATRA)) {
    for (const form of spec.typed) {
      if (!NOT_REVERSIBLE.has(form) && !(form in out)) out[form] = char;
    }
  }
  return out;
})();

function matchAt(rev: Reverse, text: string, i: number): { form: string; char: string } | null {
  for (const form of rev.order) {
    if (text.startsWith(form, i)) return { form, char: rev.map[form] };
  }
  return null;
}

const MATRA_FORMS = Object.keys(MATRA_BY_ROMAN).sort((a, b) => b.length - a.length);

/**
 * The vowel spelling starting at `i`, longest first.
 *
 * A bare `a` returns an empty matra rather than ા, because in an abugida the
 * plain consonant already *is* consonant + a. That's the difference between
 * `ka` → ક and `kaa` → કા, and it's the one place the reverse tables can't be
 * a straight inversion of the forward ones.
 */
function vowelAt(text: string, i: number): { form: string; matra: string } | null {
  for (const form of MATRA_FORMS) {
    if (text.startsWith(form, i)) {
      return { form, matra: form === "a" ? "" : MATRA_BY_ROMAN[form] };
    }
  }
  return null;
}

/**
 * Render romanized text as Gujarati script, the way a phonetic keyboard would.
 *
 * Intended for the learner's own words — their name, and the freeform typing
 * pad. Never for curriculum: see the note above. Anything it can't read
 * (digits, punctuation, Latin it has no letter for) passes straight through.
 */
export function transliterateRoman(roman: string): string {
  // Capitals are meaningful (`T` is retroflex), so this normalization keeps
  // case — unlike normalizeTyped, whose job is the opposite.
  const text = roman.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "");
  // Word by word, because one rule below depends on where a word ends.
  return text
    .split(/(\s+)/)
    .map((part) => (/^\s*$/.test(part) ? part : transliterateWord(part)))
    .join("")
    .normalize("NFC");
}

function transliterateWord(text: string): string {
  let out = "";
  let i = 0;
  /** The bare nasal we've just emitted, if the next letter might absorb it. */
  let pendingNasal: string | null = null;
  /** Syllables so far — the word-final `a` rule needs to know it isn't first. */
  let syllables = 0;

  while (i < text.length) {
    // A vowel at the start of a syllable is the independent letter, not a matra.
    const consonant = matchAt(REV_CONSONANT, text, i);
    if (consonant) {
      i += consonant.form.length;

      // The two keyboard rules. A nasal that we're about to stack onto an
      // unlike consonant becomes an anusvara instead — `anand` is આનંદ, but a
      // doubled `mammi` is મમ્મી, because a geminate really is a stack.
      if (
        pendingNasal &&
        pendingNasal !== consonant.char &&
        !NO_ANUSVARA_BEFORE.has(consonant.char)
      ) {
        out = out.slice(0, -1) + ANUSVARA;
      } else if (pendingNasal) {
        out += HALANT;
      }
      pendingNasal = null;

      const vowel = vowelAt(text, i);
      if (vowel) {
        i += vowel.form.length;
        syllables++;
        // A written `a` at the very end of a multi-syllable word is ા, not the
        // inherent vowel — સ્મિતા, કવિતા, નિશા. The logic is the reverse of
        // schwa deletion: if the inherent a were meant, the romanization
        // wouldn't have bothered writing it. One-syllable words are exempt so
        // the alphabet keeps its own spelling: `ka` stays ક.
        const trailing = vowel.form === "a" && i === text.length && syllables > 1;
        out += consonant.char + (trailing ? "ા" : vowel.matra);
        continue;
      }
      syllables++;
      // No vowel: bare letter for now. Whether it needs a halant depends on
      // what comes next, which we don't know yet — so remember and decide on
      // the next pass. (A bare Gujarati consonant already carries its 'a'.)
      out += consonant.char;
      const next = matchAt(REV_CONSONANT, text, i);
      if (next) {
        if (NASALS.has(consonant.char)) {
          pendingNasal = consonant.char;
        } else {
          out += HALANT;
        }
      }
      continue;
    }

    const vowel = matchAt(REV_VOWEL, text, i);
    if (vowel) {
      // A vowel directly after a bare nasal still closes the nasal's syllable
      // normally — no stack, no anusvara.
      pendingNasal = null;
      i += vowel.form.length;
      out += vowel.char;
      continue;
    }

    // Unknown: a space, a digit, punctuation, a letter we have no sound for.
    pendingNasal = null;
    out += text[i];
    i++;
  }

  return out.normalize("NFC");
}
