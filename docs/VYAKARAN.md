# Vyakaran — the "learn it properly" pillar

> **વ્યાકરણ (vyakaran)** = *grammar · the structure of the language.*
> A structured, grammar-aware path that sits alongside Vaat (conversation) and
> Akshar (script) — for the learner who wants to understand *how Gujarati works*,
> not just parrot phrases. Same engine, same joy, more depth.

**Status:** Plan + Phase-1 MVP slice. **Date:** 2026-07-23

---

## 0. The question this answers

> *"My wife wants to learn Gujarati the way it's supposed to be learned —
> grammar and everything, proper lessons, proper practice. Does that change the
> direction of the app, or is there a simple, elegant way to offer it too?"*

**It does not fork the app. It adds a second pillar that reuses ~90% of what's
already built.** The result is a *stronger* product with one identity and two
doors: your spouse can sprint toward talking; your wife can learn it properly —
in the same app, on the same engine, without either one compromising.

The reason this is cheap: everything expensive is already done and is
pedagogy-neutral.

| Already built (shared, unchanged) | What the grammar pillar adds |
|---|---|
| FSRS spaced-repetition engine (`lib/core/srs.ts`) | A grammar-**sequenced** syllabus (vs. topic-sequenced) |
| Kind gamification — XP, gentle streak, levels | Explicit "concept" cards with a tiny rule |
| Neural audio pipeline (253 clips, gu-IN Wavenet) | New **production** drill types (choose-the-form, build-the-sentence) |
| Progress + `itemStatus` (New/Learning/Known) | Grammar patterns tracked as SRS items too |
| Akshar Lab — *more* important for a formal learner | The "Vyakaran" door on the home screen |
| Design system, Vaat mode, portable core | |

The formal path is roughly **10% new code**. Nothing hard gets rebuilt.

---

## 1. Does "formal grammar" fight our values? No — if we do it right

Our non-negotiables stay: **fun, addictive, unique, elegant, and actually
useful.** Grammar is where language apps usually betray all five — walls of
rules, conjugation tables, boredom. The research points at a way to keep every
value intact.

### What the evidence says

- **Grammar instruction beats none.** Any form-focused instruction outperforms
  pure exposure; this is one of the most robust findings in SLA
  ([Norris & Ortega meta-analysis](https://www.researchgate.net/publication/228003219_Effectiveness_of_L2_Instruction_A_Research_Synthesis_and_Quantitative_Meta-analysis)).
- **Explicit + guided-discovery is the sweet spot.** Explicit instruction gives
  larger, more durable gains — *especially for complex features* — but
  **guided inductive** ("here are examples, what do you notice?" → then confirm
  the rule) produces deeper engagement and better long-term memorability, at
  parity with rule-first teaching
  ([Spada & Tomita meta-analysis](https://onlinelibrary.wiley.com/doi/10.1111/j.1467-9922.2010.00562.x);
  [Haight et al.](https://www.sciencedirect.com/science/article/abs/pii/S0346251X13001437)).
  Combining them wins.
- **Focus on *form*, not *forms*.** Grammar embedded in meaningful sentences
  beats abstract paradigm drills; a combination of explicit rule + communicative
  context is superior to either alone
  ([Ellis, *Focus on Form: A Critical Review*](https://journals.sagepub.com/doi/10.1177/1362168816628627)).
- **Grammar responds to spaced retrieval + interleaving.** Treating a grammar
  pattern like a memory item — retrieved and reviewed on a spacing schedule,
  interleaved with related patterns — significantly improves retention of the
  rules *and* the procedures (conjugations, suffixes). Interleaving similar
  patterns creates a "discriminative contrast" that helps learners tell
  confusable forms apart
  ([Nakata & Suzuki, interleaved grammar practice](https://www.sciencedirect.com/science/article/abs/pii/S0959475224001725)).

### Our recipe (values × evidence)

| Value | How the grammar pillar honors it |
|---|---|
| **Useful** | Guided discovery → tiny explicit rule → *production* drills that build real sentences. The learner leaves able to *make* something, not recite a table. |
| **Addictive** | Every concept is a **pattern-SRS card** with a mastery bar that fills over weeks. Grammar stops being a one-time lecture and becomes a spaced, satisfying, "keep it alive" loop — the exact hook we already use for vocab. |
| **Fun** | *Discovery*, not lecture: 3–4 examples, "what do you notice?", a satisfying reveal. Contrast "aha" cards ("Gujarati puts the verb **last**") are the delightful, text-a-friend moments. |
| **Unique** | Almost no Gujarati resource teaches its genuinely interesting grammar (three genders, split-ergative past, agreement) with modern spaced, gamified, discovery-based method. This is a real moat. |
| **Elegant** | One SRS/XP/audio core; three doors (Akshar · Vyakaran · Vaat). No second app, no split brain. Grammar concepts are just another kind of SRS item. |

**Anti-patterns we refuse:** no paradigm walls, no grammar jargon dumped on a
beginner, no rule longer than a few sentences, no "study this table" without an
immediate reason to use it.

---

## 2. The Gujarati grammar worth teaching (native-credible scope)

Gujarati has genuinely fun, "wait, *really?*" structure — which is a gift for a
discovery-based app. Verified essentials for a beginner→intermediate syllabus:

- **Three genders** — masculine / feminine / **neuter** (Gujarati kept the old
  three-way split most Indo-Aryan languages lost). Gender drives everything else.
- **Agreement** — "my", adjectives, and past-tense verbs all change shape to
  match a noun's gender & number (મારો ભાઈ · મારી બહેન · મારું નામ).
- **Word order** — Gujarati is **verb-final (SOV)**: *"I water drink."*
- **Postpositions & vibhakti** — ને, થી, માં, નું/ની/નું; the case system that
  replaces English prepositions and rides *after* the noun.
- **Honorific register** — તું (intimate) vs. તમે (respectful). High-stakes for
  anyone talking to elders/in-laws; already a first-class idea in our content model.
- **Verbs across tenses** — present → past → future, with gendered agreement.
- **The split-ergative past** — in the perfective past of a transitive verb, the
  *doer* takes ‑એ and the verb agrees with the **object**, not the subject. A
  famously tricky, high-payoff milestone: nailing it is the "I actually
  understand Gujarati" moment.

*(Sources on the grammar itself:
[Gujarati grammar overview](https://grokipedia.com/page/Gujarati_grammar);
[Cardona & Suthar, split ergativity].)*

### Suggested module spine (you steer this as the native speaker)

1. **Foundations** — gender (m/f/n) · "my" agrees · verb goes last · તું vs તમે ← **MVP slice, built now**
2. **Naming & having** — this/that, there is/are, possession (નું/ની/નું)
3. **Doing things (present)** — present-tense verbs, negation, questions
4. **Where & how** — postpositions (માં/થી/ને/પર), directions
5. **The past** — simple past, then the split-ergative construction
6. **Politeness & nuance** — requests, register, softeners

Each module is a handful of **concepts**; each concept is one SRS-tracked
pattern. All of it reuses the vocabulary the learner already knows from the
Vaat path — grammar *in context*, never abstract.

---

## 3. The experience: one concept, start to finish

A Vyakaran concept runs like a tiny, satisfying episode (2–4 min), mirroring the
Vaat lesson loop the learner already knows:

1. **Discover** — 3–4 real example sentences with the key morpheme highlighted,
   audio on each. *"Notice what changes."*
2. **Notice** — a light "what do you spot?" beat (guided induction).
3. **Reveal** — the rule in **2–3 sentences**, plus a **contrast card** for the
   English speaker (*"In English 'my' never changes. In Gujarati it does."*).
4. **Do** — 4–6 production drills, interleaved:
   - **Choose the form** — pick મારો / મારી / મારું for *my ___*.
   - **Fill the gap (cloze)** — a sentence with one slot.
   - **Build the sentence** — arrange word tiles (word-order drills shine here).
5. **Win** — completion screen, **+XP**, and the concept's **SRS card is graded**
   so it comes back for spaced review — its mastery chip climbs New → Learning →
   Known, exactly like a vocab word.

Because concepts are SRS items, the home screen's "ready for review" surface and
the mastery framing extend to grammar for free.

---

## 4. How it drops into the codebase (elegant + additive)

Nothing existing is rewritten. We add a parallel content spine and a runner,
and reuse the core untouched.

- **`lib/core/types.ts`** — add `GrammarConcept`, `GrammarExample`,
  `GrammarExercise` (kinds: `choose` · `cloze` · `build`), `GrammarModule`. The
  lexical `Exercise`/`Lesson` model is left alone (zero risk to the Vaat path).
- **`lib/core/progress.ts`** — grammar concepts are SRS items with a `g-` id
  prefix, so `gradeItem` / `itemStatus` already work. Add `completedGrammar: []`
  and a `completeGrammar()` mutator; add `XP.grammarConcept`.
- **`lib/content/grammar.ts`** — the module/concept content (starts with
  *Foundations*), reusing existing vocab ids where possible.
- **`components/GrammarRunner.tsx`** — the discover→reveal→drill→win flow
  (sibling to `LessonRunner`).
- **`app/vyakaran/page.tsx`** — the pillar screen: mastery summary + concept
  rows with New/Learning/Known chips (sibling to the Akshar page).
- **`app/page.tsx`** — a third door, **Vyakaran (વ્યાકરણ)**, beside Akshar & Vaat.
- **Audio** — grammar example sentences flow through the *same* generator
  (`scripts/generate-audio.ts`); no new pipeline.

All of it stays inside the **portable core**, so the future iOS port inherits the
grammar pillar with the rest of the brain — no rewrite.

---

## 5. Two ways to offer it — and the call

- **Phase 1 (now): a parallel Vyakaran track.** Its own door, structured
  modules, discovery cards + production drills, all SRS-tracked. Clean,
  low-risk, non-disruptive to the fast-conversation path. **This is what we
  build and deploy today**, one module deep (Foundations), so it can be *felt*.
- **Phase 2: interleave grammar into the Vaat path.** Once the concept library
  exists, drop "grammar tip" cards into the topical units at the right moment —
  grammar-in-context, the best of focus-on-form, essentially for free.
- **Phase 2: onboarding weighting.** The onboarding "why are you here?" step
  already exists; add a light *"I want to understand how it works"* signal that
  surfaces the Vyakaran door more prominently for the learner who wants depth,
  while the "I want to talk soon" learner stays on the conversational spine.
  Same app, two people, no compromise.

**Recommendation:** ship Phase 1 now (this doc's MVP slice), get the native
review + feel it on the deployed app, then layer Phase 2. The syllabus is where
the native speaker steers; the engine is ready for whatever content you approve.

---

## 6. Content-verification note

As with all Gujarati in the app, the Foundations module ships as an **AI-drafted
first pass, clearly marked DRAFT**, pending native-speaker verification of every
sentence, gloss, romanization, and audio. Grammar explanations especially want a
native + light pedagogy check before this is called done.
