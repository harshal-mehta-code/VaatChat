# Lekhan & Lipi — the literacy pillar (write it, type it)

> **લેખન (lekhan)** = *writing — by hand.*
> **લિપિ (lipi)** = *the script — and how you transcribe it.*
> Reading is only half of literacy. This is the other half: forming the letters
> with your own hand, and typing them on the phone you already own.

**Status:** Phases A and B shipped; Phase C's centrepiece — writing whole words
by hand — shipped with them.
 · **Lekhan** — stroke data captured (all 53 glyphs), Stroke Lab, the offline
   scorer, and the Watch → Trace → Write ladder are live in Akshar Lab, for
   single letters *and* for whole words composed from them
   (`lib/core/compose.ts`, guarded by `npm run check:compose` — §3.7).
 · **Lipi** — `lib/core/translit.ts` (segmenter + matcher + tables),
   `components/TypeSession.tsx` (the five-rung ladder, candidate picker, and the
   progressive reveal), guarded by `npm run check:translit`.
 · Still to come: sentences in the typing track (§2.4 rung 5 currently stops at
   single words), and the rest of Phase C — `w-` cards surfaced in the Review
   deck, stars, the pati, and the name moment (§5).
**Date:** 2026-07-24
**Origin:** feature request from the app's second real user (the owner's wife),
after trying the app — *"there's no app that shows you exactly how to write the
letters."* She's right. There isn't.

---

## 0. What was asked for

1. **Typing / transcription.** Given a sound played *or* a Gujarati letter
   shown, pick the correct English-typed version (`ka`, `ga`, `chi`) — growing
   into typing whole words and sentences. Goal: internalize how Gujarati sounds
   map to what you'd type.
2. **Handwriting.** A proper **animated demonstration** of how to form each
   letter (with matras where applicable), then a **writing pad** to trace and
   practise on — ideally on iPad — where the app **watches, scores, and gives
   feedback**.
3. Her thesis: **learning to write goes hand-in-hand with learning to read.**

That thesis is correct and well-evidenced — motor production of a glyph
strengthens its visual recognition far more than looking at it does (the
handwriting/letter-recognition link is one of the more robust findings in early
literacy research, and it's why every Gujarati kid still fills a *pati* with
rows of ક ખ ગ). It's also already in our own plan: `PLAN.md` §4.3 lists
"stroke-order tracing" as an Akshar Lab pillar we never built.

So this isn't a detour. It's the missing third of the pillar we said mattered
most.

---

## 1. The organizing idea: one letter, three skills

Today `Akshar Lab` is a **reference** (browse letters, run a recognition drill).
It becomes a **dojo** where every letter carries three separate, separately-
tracked skills:

| Skill | Prompt → answer | Why it's its own skill |
|---|---|---|
| 👁 **Read** (built) | see ક → know it's *ka* | recognition |
| ⌨️ **Type** (new) | hear /ka/ → type `ka` → get ક | production, but with a keyboard |
| ✍️ **Write** (new) | hear /ka/ → draw ક | motor production, no crutches |

Crucially they're **not** the same memory. Anyone who's studied a script knows
you can read a letter fluently and still freeze when asked to write it. So each
gets its own SRS card (see §4) — and a letter isn't "known" until all three are.
That's a more honest mastery bar than we have now, and it makes the existing
`N of 46 letters known` number mean something much better.

**No new bottom-tab.** One door (Akshar Lab), three skills inside it. The
tab bar comment in `components/TabBar.tsx` warns against "a dozen places to
tap" — we keep that promise.

---

## 2. Lipi — typing Gujarati (ship this first)

### 2.1 The real-world payoff (this is the addictive part)

The skill isn't academic. Every Gujarati phone keyboard (Gboard, iOS Gujarati
Transliteration) works **phonetically**: you type `kem cho` and it gives you
કેમ છો. Learning the sound→typing map is *exactly* the skill that lets her text
the family WhatsApp group in Gujarati script within days, not months. That's a
real-life win the app can hand someone in week one — the "quest" idea from
`PLAN.md` §4.4, finally with a concrete payload.

### 2.2 The honesty problem, and the fix

We already ship a romanization on every item — but it's a **reading aid** with
diacritics (`ṭa`, `ḍa`), and you can't type `ṭ` on a phone. Shipping two
romanizations would be confusing, so we frame them as what they are:

- `roman` (existing) — *"how it sounds"*, precise, keeps the retroflex marks.
- `typed` (new, `string[]`) — *"how you'd type it"*, plain ASCII, **multiple
  accepted forms**, first one canonical. ટ → `["Ta", "ta", "tta"]`.

The learner is told this explicitly once ("the marks show you the sound; the
keyboard doesn't have them — here's what you actually type"). Being straight
about the mismatch is more respectful than hiding it.

### 2.3 The mechanic nobody else has: candidate picking

`ta` is ambiguous — it's both ત (dental) and ટ (retroflex). A real keyboard
resolves this by showing you **candidates** and making you pick. So do we:

```
   🔊  (plays /ṭa/)          you type:  ta
   ┌──────────┬──────────┐
   │    ત     │    ટ     │   ← pick the one you heard
   └──────────┴──────────┘
```

This is faithful to the actual tool she'll use, *and* it drills the single
hardest distinction for an English ear (dental vs. retroflex, `ત/ટ`, `દ/ડ`) at
the exact moment of confusion. One mechanic, three jobs: real-world transfer,
phoneme discrimination, and a genuine "oh, *that's* how the keyboard works"
moment. I haven't seen another app do it for an Indic script.

### 2.4 The ladder

Each rung is a short session, gated softly (advisory, like the rest of the app):

1. **Match** — see ક → tap the right typed form from 4. Zero friction, one hand.
2. **Hear it** — 🔊 → tap the right typed form. (Reuses all 382 existing clips.)
3. **Type the letter** — free text input; the normalizer accepts any listed form.
4. **Type the syllable** — barakshari cells (`ka ka kaa ki kee ku koo…`). This is
   where vowel length (`ki` vs `kee`) stops being theory. All 180 cells already
   have audio.
5. **Type the word / sentence** — from her unlocked vocab + the 40-word frequency
   bank, with the reveal below.

### 2.5 The reveal: script assembling under her fingers

As she types the roman for a word, the Gujarati **builds itself, cluster by
cluster**, above the input:

```
   type:  k e m ␣ c h o
   →      કે      કેમ      કેમ છો
```

That's the dopamine beat. It's also *not* fake: it requires a real
**segmenter**, which is the one genuinely interesting piece of code here.

### 2.6 `segmentGujarati()` — the small engine that pays for itself twice

Gujarati is an abugida with regular structure, so a word can be walked
grapheme-by-grapheme into clusters:

```
cluster := consonant (+ halant + consonant)*  (+ matra)?  (+ anusvara/chandrabindu)?
         | independent-vowel
```

`segmentGujarati("કેમ") → [{ guj: "કે", roman: "ke" }, { guj: "મ", roman: "m" }]`

It's ~120 lines of pure TypeScript over the tables already in
`lib/content/akshar.ts`, and it earns its keep **twice**:

- **Lipi** — progressive reveal, per-cluster grading ("છ was right, the ો slipped").
- **Lekhan** — a word's stroke sequence is just its clusters' strokes laid out on
  a baseline (§3.7). Author 46 letters + 12 matras once → get *every word* free.

**It is also self-validating.** Every one of the ~420 items in `lib/content`
already carries a hand-written `roman`. A new `npm run check:translit` runs the
segmenter over all of them and asserts the reconstructed romanization matches
(after normalization). Where it disagrees, either the segmenter is wrong or the
content is — both worth knowing. Same discipline as `check:audio`.

### 2.7 Scope note

Conjuncts (ક્ષ, જ્ઞ, ત્ર, and true halant stacks) are the hard case for both the
segmenter and the writing composer. **Explicitly out of v1**, handled by a
small per-word override table when they appear, and revisited once the simple
case is solid.

### 2.8 What shipping it actually taught us

Three things the plan got wrong or didn't anticipate:

**Conjuncts turned out to be nearly free — for *typing*.** The plan quarantined
them, but a halant stack's keyboard spelling is just its stems concatenated:
ત્ર → `tr`, સ્વ → `sv`, ક્ષ → `ksh`. So the segmenter handles them by
construction and the override table has exactly one entry (જ્ઞ, where nobody
types `jny`). They remain genuinely hard for the *writing* composer, which is a
different problem — see §3.7.

**The content validated the engine, and then the engine audited the content.**
`npm run check:translit` asserts that every romanization we show is a spelling
the matcher accepts. 362/362 letters and barakshari cells pass, and **125 of 130
words**. The five that don't are the interesting part: મમ્મી is written
*"Mummy"* here because that's how it sounds to an English ear, but you'd type
`mammi`. Rather than "fixing" a reading aid that isn't broken, the app filters
the word pool on `acceptsTyped()` at runtime — so a learner is never asked to
type a spelling that wouldn't work. The check reports the exclusions instead of
failing on them, and holds a coverage floor to catch a genuine regression.

**The nasal mark is invisible on a keyboard.** શું is *typed* `shu`; you get the
ં by picking a candidate. Since our romanizations consistently omit it, the
matcher accepts the mark as optional — and the reveal is what teaches that it's
there. Same class of honesty problem as §2.2, same answer: show the mismatch
rather than paper over it.

One deliberate deviation from §4's table: the `typed` forms live in
`lib/core/translit.ts` rather than as a field on `Akshar`. They describe
*Unicode*, not our curriculum — a fixed property of the script that an iOS
client would need verbatim — so they belong in the portable core, not in
content. The content tables stay teaching material.

---

## 3. Lekhan — handwriting

### 3.1 Data model

```ts
/** One pen-down-to-pen-up stroke, on a normalized 1000×1000 glyph box. */
interface Stroke {
  /** Polyline centerline, [x,y] pairs, in draw order. */
  points: [number, number][];
  /** Optional teaching note, e.g. "start at the top, sweep down-left". */
  hint?: string;
}

interface StrokeGlyph {
  /** Akshar id ("c-ka") or matra id ("m-aa"). */
  id: string;
  char: string;
  strokes: Stroke[];
  /** For matras: where this attaches relative to a consonant body. */
  attach?: { dx: number; dy: number; scale: number };
  /** Advance width for composing words on a baseline. */
  advance: number;
}
```

Centerlines, not filled outlines — because centerlines are what you can *draw
along*, *animate*, and *score against*. (This is why we don't reuse
`hanzi-writer`: its data format needs a filled outline per stroke, which our
authoring route doesn't produce, and its metrics are Han-specific. Our own
renderer is ~200 lines and gives full control of the feedback UI.)

### 3.2 The authoring problem — and the elegant unlock

Where does correct stroke data come from? There's no open stroke-order dataset
for Gujarati (there is for Chinese and Japanese; Indic scripts were skipped).
Font outlines don't help — they give shape, not the *order and direction* a hand
takes, which is the entire lesson. And **I should not be the authority here**:
I can approximate Gujarati letter shapes, but I can't verify from memory that
I've got the conventional order and direction right for all 46 letters, and
getting that subtly wrong would teach a bad habit that's hard to unlearn.

**So we build a 100-line dev tool and let a native hand author it.**

`/dev/stroke-lab` (hidden, dev-only route):
- The target glyph renders huge and faint, in the same font the app uses.
- You trace it once, stroke by stroke, **with an Apple Pencil on the iPad**.
- The tool simplifies each stroke (Ramer–Douglas–Peucker), normalizes it to the
  1000×1000 box, and shows the resulting animation played back immediately.
- "Copy JSON" → paste into `lib/content/strokes.ts`.

This turns a task I'd do badly into a **~20-minute, genuinely pleasant session**
for a native speaker who already wants to be writing on that iPad — and every
letter she writes becomes the reference the app teaches from forever. It's the
same move as the content review sheet: the native speaker is the source of
truth, the tooling just makes it cheap. (I'll pre-seed my best attempt at the
10 vowels so there's something to correct rather than a blank page — correcting
is faster than authoring.)

### 3.2b Fluent hand vs. teaching hand (learned during the first capture)

The first real capture surfaced something the plan hadn't anticipated. Asked to
write naturally, a fluent native writer draws most letters in **one unbroken
motion** — body straight into the right-hand stem, no pen lift. That's not
sloppiness; it's what fluency looks like, and it's how the author genuinely
writes. (Tellingly, their own capture *did* separate the stem on ગ and આ —
natural variance, not a rule.)

But the two artefacts have different jobs:

| | Fluent hand | Teaching hand |
|---|---|---|
| Strokes for ખ | 1 | 2 (body, stem) |
| Feedback we can give | one verdict for the whole letter | "stroke 2 went backwards" |
| Trace mode | one long sweep to follow | discrete beats, each snapping green |
| Who it's for | someone who already writes | someone learning from zero |

So the shipped data is the **teaching** breakdown, derived from the fluent
capture by splitting the terminal stem (steep, downward, late in the stroke,
with a real letter body before it — guarded so it never bisects a ા vertical or
an ઐ diagonal). The fluent capture is kept in git history, and is the raw
material for a genuinely nice future beat: teach the breakdown, then show
*"and here's how it looks when you actually write it"* — the transition from
learner to native hand, made visible. No app does that.

### 3.3 The demonstration

An SVG per-stroke `<path>` with animated `stroke-dashoffset` — the classic
"invisible hand writing it" effect — plus:

- a **nib dot** riding the path (`getPointAtLength`) so the eye has something to
  follow,
- a **pulsing start dot** before each stroke (start point is the #1 thing
  beginners get wrong),
- **numbered badges** (①②③) on a static overview,
- completed strokes staying as a soft ghost,
- **speed control** (slow / normal) and replay — she'll want slow, everyone does,
- a faint **notebook guide** behind it: the four-line ruled *pati* every Gujarati
  schoolkid learns on. Free culture, free scaffolding.

Nice teaching beat we get for free: Gujarati is Devanagari **without** the
shirorekha (the horizontal roofline). Point that out once and half the alphabet
gets less intimidating — and it changes how you write ક, not just how it looks.

### 3.4 The pad (iPad-first, but works everywhere)

- **Pointer Events** (`pointerdown/move/up/cancel`), `touch-action: none`,
  `overscroll-behavior: none`. Apple Pencil arrives as `pointerType: "pen"` with
  `pressure` and tilt.
- **Palm rejection**: once a `pen` pointer is seen in a session, ignore `touch`
  pointers (with a visible "Pencil only" toggle so a finger-user isn't locked out).
- **Ink that feels good**: variable stroke width from pressure (or velocity, on a
  finger), round caps, drawn to a `<canvas>` overlay with rAF batching; the
  reference, guides and feedback stay in SVG underneath. Zero new dependencies.
- Undo-last-stroke, clear, and — this matters — **never** an accidental page
  scroll mid-stroke.

### 3.5 Scoring — deterministic, offline, explainable

No ML, no network, no black box. Per stroke, resample both the reference and her
ink to 64 equidistant points, then:

| Signal | Catches |
|---|---|
| **Shape** — mean point distance, normalized by box size | wrong path |
| **Direction** — mean cosine of tangent vectors | drawn backwards (very common, very worth flagging) |
| **Endpoints** — start/end proximity | started in the wrong place |
| **Coverage** — two-way near-miss ratio | stopped short / overshot / scribbled |
| **Order & count** — sequence alignment | strokes out of order, missing, or extra |

Composite `0–100` → 1–3 stars, with tolerances that are **generous in Trace and
tighter in Write-from-memory**. Every deduction maps to a named feedback code
(`start-off`, `reversed`, `too-short`, `overshoot`, `wrong-order`,
`missing-stroke`, `extra-stroke`) so the message is **specific and kind**:

> ✨ Nice shape! Stroke 2 went right-to-left — this one's written left-to-right.
> [Watch it again] [Try just stroke 2]

...alongside a visual diff: her ink in magenta over the reference in peacock,
with the offending stroke highlighted. Never a bare score, never a red X.

Order handling is deliberately two-tier: in **Trace** we enforce order and nudge
in the moment ("that's stroke 3 — try stroke 2 first"); in **Write** we accept a
correct-looking letter written in an unconventional order but *say so*, because
grading a right answer as wrong is how apps lose people.

### 3.6 The ladder (this is the "guided fun way" she asked for)

Exactly the app's existing predict → reveal → produce shape, applied to motor
skill:

1. **Watch** 👀 — the animation, replayable, plus the mnemonic we already have.
2. **Trace** ✍️ — reference under her pen, dots to follow, generous tolerance,
   each stroke snapping green as it lands.
3. **Copy** 👁️‍🗨️ — reference *beside* the box, not under it.
4. **Write from memory** 🧠 — prompt is the **sound** (🔊) or the typed form
   (`ka`); blank box. This is the rung that makes writing a *recall* exercise and
   feeds SRS.

Each rung is a real win-state; nobody is blocked from going back a rung.

### 3.7 Then: words, with matras

Because a word's clusters decompose (§2.6) and matras carry an `attach` offset,
**word writing composes for free** from letters + matras. That covers her
"along with modifiers where applicable" ask directly: કે is taught as ક *then*
the ે on top, in that order, with the matra animating in separately.

One genuine edge case worth naming: **િ (short i) renders to the LEFT of its
consonant but is written after it.** Cluster-based composition handles it with a
negative `dx` — and it becomes a great teaching moment rather than a bug.

### 3.7b What composing them actually taught us

The promise held: **53 authored glyphs, zero new data, 45 of 76 vocabulary
words writable by hand.** But four things the plan glossed over turned out to
be the whole problem.

**A matra doesn't have one offset — it has four kinds of relationship.** §3.1
imagined a single `attach: {dx, dy, scale}` per matra. What the captured data
actually wants is an *anchor rule*: ા ી ો ૌ keep their distance from the
consonant's **right edge**; ે ૈ and ુ ૂ keep their offset from its **middle**,
above and below. And િ does neither — it starts above the letter's right
shoulder, arcs left over the top and comes down on its left, so it has to
**stretch to the letter's width**, not shift. A fixed `dx` puts it half-way
across ખ and hanging off ડ. This is the difference between a plan that sounds
right and data that is.

**ક is a good reference letter, but not a universal one.** Every matra was
captured on ક — average width, ordinary ceiling, and, it turns out, *no
descender*. ફ dives far below where ક stops, so a ુ carried across unchanged
was drawn straight through ફ's tail. Marks now step clear of the letter rather
than sitting at a fixed height, and where clearing it would push the mark out
of the box entirely, we refuse: **ફૂ is the one combination of 306 we won't
draw**, and saying so is better than drawing it wrong. Same answer the typing
track gives a word it can't spell.

**Pack by ink, not by advance width.** Laying letters out by their actual
bounding boxes makes િ free: its stroke reaches left past its own consonant, so
the packer simply leaves room and the previous letter never collides. A typeset
advance width would have needed a special case.

**The conjunct quarantine holds here — and it's what costs us.** §2.8 recorded
that conjuncts turned out nearly free for *typing*, because a halant stack's
keyboard spelling is just its stems concatenated. Writing is the opposite: a
stack is a fused shape with strokes of its own, and two letters side by side is
not what a hand draws. That plus the nasal marks (nobody has authored ં) is the
whole of the 31 excluded words — including નમસ્તે, મમ્મી, and જય શ્રી કૃષ્ણ,
which is a shame precisely because §5 wanted that last one as a moment.

**Still untested by a real hand:** the scorer was tuned on single letters, and a
word introduces a failure mode it has never seen — *spacing*. `scoreGlyph`
removes translation and uniform scale globally, so writing the letters right but
spread too far apart shows up as every letter being slightly wrong. It may be
fine; it may feel harsh. §8's "tolerance needs a hand on the glass" now applies
twice over.

---

## 4. How it drops into the codebase

Additive, portable-core-respecting, nothing existing is rewritten.

| Layer | New | Notes |
|---|---|---|
| `lib/core/types.ts` | `Stroke`, `StrokeGlyph`, `WriteMode`, `TypeDrillKind` | pure types |
| `lib/core/translit.ts` | `normalizeTyped()`, `acceptsTyped()`, `segmentGujarati()` | **pure**, no DOM — iOS reuses it |
| `lib/core/strokes.ts` | `resample()`, `simplify()`, `scoreStroke()`, `scoreGlyph()` | **pure** — the whole scorer is unit-testable and framework-free |
| `lib/content/akshar.ts` | `typed?: string[]` on `Akshar` | one field, one line per letter |
| `lib/content/strokes.ts` | authored `StrokeGlyph[]` | grows letter by letter |
| `lib/core/progress.ts` | `writingCardId(id) => "w-<id>"` | mirrors the existing `grammarCardId` `g-` pattern exactly |
| `components/` | `StrokeAnimation`, `WritePad`, `WriteSession`, `TypeSession` | `WritePad` is the only genuinely new UI primitive |
| `app/akshar/[id]/page.tsx` | per-letter detail: hear · watch · write · type | deep-linkable |
| `app/dev/stroke-lab/page.tsx` | authoring tool | dev-only, `noindex` |
| `lib/core/compose.ts` | `placeCluster()`, `composeWord()`, `composeSegmented()` | **pure**, and import-free at runtime so the guard can load it |
| `scripts/check-strokes.ts` | every taught letter has strokes, in-box, non-degenerate | `npm run check:strokes` |
| `scripts/check-translit.ts` | segmenter round-trips all ~420 content romans | `npm run check:translit` |
| `scripts/check-compose.ts` | all 306 consonant × matra placements land right | `npm run check:compose` |

**SRS namespacing decision:** writing gets its own card (`w-c-ka`) because motor
production is a genuinely separate memory. **Typing does not** — a typing drill
grades the letter's existing card, since it's a harder variant of the same
sound↔letter knowledge the Read drill already tests. Two namespaces, not three;
the Review tab stays legible ("6 letters to write, 12 words to review").

`Progress` gains nothing but cards — `loadProgress()` already backfills, so old
profiles migrate silently.

---

## 5. The fun (kind gamification, per §5 of PLAN.md)

- **Stars, not percentages.** 1–3 stars per letter, "your best" remembered, and
  progress framed as *"you wrote it cleaner than last time"* — improvement, not
  a grade.
- **The pati fills up.** A slate that visibly fills with letters she can write —
  the culturally-real version of a progress bar.
- **Write your name.** The moment she can write her own name in Gujarati, we make
  a *thing* of it — animate it, keep it, let her share the card. Same for her
  husband's name, and for જય શ્રી કૃષ્ણ. These are the emotional beats that make
  someone open the app tomorrow, and they cost us almost nothing.
- **Lipi Chat** (stretch): a typing drill dressed as texting Ba in the family
  WhatsApp group — she types roman, watches it become Gujarati, hits send, gets a
  reply. Reuses the Vaat characters we already wrote, and rehearses the exact
  real-world act we want her doing.
- **No new streak, no new currency.** XP, one gentle streak, done.

---

## 6. Platform notes

- **The 480px shell needs an exception.** The whole app is capped at
  `max-w-[480px]` (right for a phone). The writing pad must break out to a large
  square on iPad — that's the device she'll actually use, and a cramped canvas
  would undercut the entire feature.
- **PWA basics** (manifest + `apple-mobile-web-app-capable` + icons) so
  Add-to-Home-Screen gives a full-screen, chrome-free pad on iPad. Cheap, big
  perceived-quality win.
- Suppress iOS double-tap zoom, text-selection callout, and pull-to-refresh
  inside the pad.
- Everything stays offline-capable; **no new audio and no API key required** —
  Lipi reuses the 382 clips we have, and the scorer is local math. (Relevant
  given the TTS key situation.)

---

## 7. Phasing

**Phase A — Lipi (typing).** `translit.ts` + `check:translit` + `typed` field +
rungs 1–4 + live script assembly + candidate picking. *No new content authoring,
no new audio* — it's mostly engine over data we already have, so it ships fast
and she gets a usable new skill immediately.

**Phase B — Lekhan engine + authoring.** Types, scorer, `WritePad`,
`StrokeAnimation`, `/dev/stroke-lab`, pre-seeded vowels. Ends with the
**authoring session**: she draws the letters, we ship them. Then the four-rung
ladder over whatever's authored.

**Phase C — Scale & compose.** All letters + matras ✅, word writing via the
segmenter ✅, `w-` cards in the Review deck, iPad/PWA polish, stars + the pati +
the name moment.

**Phase D — Delight.** Lipi Chat, dictation ("hear it → write it"), a
"guess my handwriting" mini-game, freeform recognition.

Phase A is independently valuable if we stop there. So is B. That's the point.

---

## 8. What's genuinely uncertain

- **Stroke order needs a native call, not mine.** Some letters have more than one
  taught order; we pick one convention, note it, and she's the arbiter. This is
  the one place the plan depends on someone else's knowledge — hence §3.2.
- **Tolerance tuning is empirical.** Too strict feels punishing; too loose feels
  fake. Start generous, tune with her hand on the glass. Bias: mastery gates on
  the *memory* rung, not on pixel accuracy. **Words raise this again** — letter
  spacing is a signal the scorer was never tuned against (§3.7b).
- **Conjuncts are deferred**, deliberately (§2.7).
- **Safari/Pencil latency** is decent but not native-app good. If it grates, the
  fallback is a thin native shell later — the core is already pure TS, so the
  scorer and segmenter port unchanged.

---

## 9. What I need from her

1. **The stroke-authoring session** — ~20 minutes on the iPad with `/dev/stroke-lab`,
   once Phase B lands. This is the whole content cost of the feature.
2. **A tolerance verdict** — write five letters sloppily and tell me whether the
   app was too harsh, too soft, or right.
3. **Her name in Gujarati** (and any names she'd want to write first), so the
   payoff moment is hers and not a demo.
