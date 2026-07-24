# VaatChat — Product & Design Plan

> **વાત (vaat)** = *talk · conversation · story.*
> A fun, frictionless, research-backed, gamified app for learning Gujarati — built conversation-first, for the people who actually want to learn it.

**Status:** Building MVP prototype (web). Core + content scaffolded.
**Author:** Claude · **Date:** 2026-07-22

## Decisions locked in (from review)

- **Primary target: the zero-exposure beginner** (e.g. a partner marrying into a
  Gujarati family) — get them to *conversational* fast. Heritage fast-track stays,
  but the default experience assumes no prior Gujarati.
- **Spoken-first, script-parallel.** Speaking is never gated behind the alphabet;
  **Akshar Lab** runs as its own optional track and romanization fades over time.
- **Vaat Mode ships as scripted branching dialogue** — free, offline, and
  zero-hallucination (every line native-verifiable). A pluggable provider allows a
  free-tier LLM (e.g. Gemini) for open-ended chat later. No paid API key required.
- **Web-first on Vercel now → iOS later.** All learning logic lives in a portable,
  framework-agnostic core (`lib/core/*`) so the iOS app (Apple on-device speech +
  AI voice) reuses it instead of a rewrite.
- **Content is native-verified.** All Gujarati is an AI-drafted first pass; the
  owner + native-speaker network verify text/audio (see `docs/AUDIO_CHECKLIST.md`).
- **A second pillar: Vyakaran (grammar), for "learn it properly."** Alongside the
  conversation-first path, a structured, grammar-aware track serves the learner
  who wants to understand *how the language works* — same SRS/gamification engine,
  a third door beside Akshar & Vaat. Full design + syllabus in
  [`docs/VYAKARAN.md`](./VYAKARAN.md).

---

## 0. TL;DR

VaatChat is a mobile-first Gujarati learning app that combines the *stickiness* of Duolingo-style gamification with the *effectiveness* of the science that Duolingo is often criticized for skipping: spaced repetition, comprehensible input, and real speaking practice. Its wedge is the **heritage / diaspora learner** — the millions of second- and third-generation Gujaratis (and partners marrying into Gujarati families) who can half-understand *Ba* on the phone but can't read a menu, write a text, or hold a confident conversation. Duolingo doesn't even offer Gujarati. Existing resources are dry textbooks and temple weekend classes.

We win by being: **culturally native** (food, festivals, family, garba — not generic sentences about apples), **heritage-aware** (fast-track people who already understand spoken Gujarati straight to reading & speaking), **speaking-first** (AI conversation with characters like *Ba* and the *chai-wallah*), and **kindly gamified** (habit-forming without the streak-anxiety and hollow-XP traps).

---

## 1. Why this app, why now

### The opportunity
- **~55–60 million Gujarati speakers** worldwide, with one of the largest, most organized diasporas of any Indian language group (US, UK, Canada, Australia, East Africa).
- **Heritage learners are underserved.** Research on Gujarati heritage learners across three continents finds that 2nd/3rd-generation speakers keep *conversational* competence for family/community but lose *formal registers, reading, and writing* — and that heritage-language ability is tightly bound to **ethnic and cultural identity**. Identity is the motivation engine we get to build on.
- **No serious app competitor.** Duolingo has no Gujarati course. The category is textbooks, YouTube playlists, and community/temple classes — effective but high-friction and low-retention.

### The learners (personas)
1. **Diya, 24, "heritage returner"** (US-born). Understands ~40% of spoken Gujarati, can't read a word, embarrassed to speak. Wants to talk to grandparents before it's too late.
2. **Tom, 33, "the in-law"** (marrying into a Gujarati family). Zero background. Wants to understand the wedding, greet elders, not be lost at dinner.
3. **Aarav, 9, "the diaspora kid"** whose parents want him in an app instead of (or alongside) Sunday temple class.
4. **Priya, 40, "roots & devotion"** — reconnecting for cultural/religious reasons (bhajans, scripture, festivals).
5. **Sam, 29, "the traveler / business"** — Gujarat is a business hub; wants functional, fast survival Gujarati.

The heritage learners (1–4) are the wedge. Their motivation is **relationship and identity**, not a checkmark — and that changes the whole design.

---

## 2. Design principles (the non-negotiables)

1. **Frictionless first.** A learner should be *saying something real in Gujarati inside 90 seconds* of opening the app — before any signup wall.
2. **Culturally native, not translated.** Content is set in a Gujarati world: the kitchen, Navratri, the thali, the family WhatsApp group — not "the boy has an apple."
3. **Meet learners where they are.** A heritage speaker who understands spoken Gujarati should *never* be forced through "this is the word for water." Adaptive placement + skippable tracks.
4. **Speaking is the point.** Output and interaction, not just tapping tiles. The name is *Vaat* — conversation — for a reason.
5. **Kind gamification.** Habits without anxiety. We optimize for *learning that lasts*, and we're honest when engagement tricks would undermine it (see §6).
6. **Respect the script, but scaffold it.** The Gujarati abugida is the #1 barrier. We make it a delightful mini-game, with romanized training wheels that visibly fade.
7. **Every session ends with a small win.** Learners leave feeling capable, never drained.

---

## 3. Learning science foundation (what the app is built on)

Each pillar maps to a concrete mechanic, so the "fun" is never decorative — it's the delivery vehicle for a proven method.

| Research pillar | What it says | How VaatChat uses it |
|---|---|---|
| **Spaced Repetition (SRS)** | Reviewing just before you'd forget beats cramming — 100+ years of evidence (Ebbinghaus forgetting curve; SM-2 → modern FSRS). | Every vocab/phrase/character is a memory item scheduled by an **FSRS** engine. Reviews are woven into lessons, not a separate chore. |
| **Active recall / testing effect** | Retrieval *practice* cements memory far better than re-reading. | Prompts always ask you to *produce* (type, speak, arrange) before revealing. Cloze deletion over multiple choice where possible. |
| **Comprehensible input (i+1)** | Learners acquire language from input slightly above their level, made understandable by context. | **Mini-stories** and dialogues tuned to your known-word set, with tap-to-reveal glosses and audio. |
| **Interaction hypothesis / output** | Negotiating meaning in real conversation drives acquisition beyond passive input. | **Vaat Mode** — AI role-play conversations with feedback; real-world "quests." |
| **Dual coding** | Memory is stronger when audio + image + text are paired. | Every item = native audio + image/scene + Gujarati script + (fading) transliteration. |
| **Desirable difficulty & interleaving** | Slightly harder, mixed practice retains better than blocked, easy practice. | Interleave skills (listen/read/speak) within a session; adaptive difficulty. |
| **Intrinsic motivation (SDT)** | Autonomy, competence, relatedness sustain motivation better than pure rewards. | Personal "why" goals, mastery framing, family/community connection (see §6). |

**Sources** are collected in [`docs/RESEARCH.md`](./RESEARCH.md).

---

## 4. The learning architecture

### 4.1 Onboarding (the frictionless 90 seconds)
1. **Instant taste** — before any account, the learner hears *"Kem cho?"* ("How are you?"), taps to hear it, and speaks it back. They just spoke Gujarati.
2. **"Why are you here?"** — pick a motivation: *Talk to family · Marrying in · For my kids · Roots & devotion · Travel/business · Just curious.* This tunes vocabulary, characters, and tone.
3. **Heritage check** — *"Can you already understand spoken Gujarati?"* (None / A little / A lot). A "lot" answer routes into a quick listening placement that can skip the entire beginner-vocab track and drop them straight into **reading + speaking**.
4. **Set your `Vaat` goal** — a concrete, personal, relationship-based goal: *"Have a 2-minute chat with Ba,"* *"Read the temple bhajan,"* *"Order a full thali in Gujarati."* This becomes the north star shown on the home screen — not an abstract XP number.

### 4.2 The path: "life in a Gujarati world"
Content is CEFR-informed (A1→B1 for V1) but **themed around real diaspora life**, so every unit is immediately usable:

`Greetings & Family` → `Home & Kitchen` → `Food & the Thali` → `Festivals (Navratri, Diwali, Uttarayan)` → `The Market & Money` → `Feelings & Small Talk` → `Getting Around` → `Phone & WhatsApp` → `Work & School` → `Stories & Culture`

Each **unit** blends five strands so no single strand gets boring:
- **Akshar** (script) · **Shabdo** (vocabulary via SRS) · **Sambhalo** (listening) · **Bolo** (speaking) · **Vaancho** (reading mini-stories).

### 4.3 Akshar Lab — making the script a game
The abugida (14 vowels/swar, 34 consonants/vyanjan, plus matras/diacritics) is the biggest wall. We turn it into the most delightful part of the app:
- **Shape→sound mnemonics.** Each letter gets a memorable image tied to its sound (dual coding).
- **Stroke-order tracing** with satisfying haptics and a "written it right" animation.
  Plus **typing** (the phonetic-keyboard skill) — the two halves of literacy the
  script track was missing. Full design in [`docs/LEKHAN.md`](./LEKHAN.md).
- **Barakshari game** — the consonant × vowel grid (ક કા કિ કી…) that Gujarati kids drill, reimagined as a fast, musical matching game. This is the single highest-leverage literacy tool and almost no app does it well.
- **Fading transliteration.** Romanized crutches shrink and disappear as the learner's recognition accuracy for each character crosses a mastery threshold — literacy sneaks up on them.

### 4.4 Vaat Mode — speaking with characters
The flagship differentiator. AI-driven role-play (Claude for dialogue + Gujarati TTS/STT):
- **Characters with warmth:** *Ba* (grandmother), the *chai-wallah*, a cousin, a shopkeeper, a Navratri dance partner. Each has a personality and a scenario.
- **Scaffolded conversation:** the app suggests things you could say; you speak; you get gentle, specific feedback (pronunciation of tricky **retroflex** ટ/ડ and **aspirated** ખ/ઘ sounds, word choice, register/politeness with elders).
- **Real-world quests:** "This week, actually say *Jai Shri Krishna* to a relative and mark it done," "Send one voice note in Gujarati to the family group." Bridges app → life (the thing Duolingo is criticized for missing).

### 4.5 The session loop (2–7 min)
Warm-up recall (SRS due items) → one new concept (comprehensible input) → active practice (produce it) → a speaking beat (even 1 line) → **end on a win** (a completed mini-dialogue, a mastered letter, a used-in-real-life quest). Short by design; a learner can always do "just one more."

---

## 5. Gamification — the fun, done ethically

We deliberately learn from **both** Duolingo's wins *and* its documented failure modes (streak anxiety, compulsive checking, competitive leaderboards that feel like social media, "engagement without learning").

### What we borrow (because the data is real)
- **Streaks** — loss aversion drives daily habit; 7-day streakers are dramatically more likely to stick. **But softened** (below).
- **XP as a universal currency** connecting every activity.
- **Meaningful progress visualization** — a filling path, not a scary graph.

### How we make it *kind* (the differentiators)
- **"Mastery over minutes."** The headline metric is *words/letters/phrases you can actually use*, not a raw streak count. The streak is secondary and gentle.
- **Streak insurance & grace.** Auto-forgiveness (real life happens — festivals, exams). No dark-pattern guilt. A missed day pauses, never shames.
- **No forced competitive leaderboards.** Leagues are **opt-in** and framed as friendly. The default social layer is **cooperative**: a *family/community garden* that everyone's practice grows together (relatedness > rivalry).
- **Culturally-themed rewards** instead of generic gems: collect **rangoli patterns**, fill a **thali** with dishes you can name, light **diyas** on a Diwali progress scene, unlock **garba** tracks. Rewards *are* the culture.
- **Festival events** tied to the real calendar — a **Navratri 9-night challenge**, an **Uttarayan kite** streak in January — so the app breathes with Gujarati life.
- **Intrinsic anchors** (per Self-Determination Theory): your personal *Vaat* goal, progress you can *feel* in real conversations, and quests that pay off in actual relationships.

The bet: retention that comes from *feeling more connected to family and identity* is deeper and healthier than retention from fear of losing a number — and it's exactly what heritage learners want.

---

## 6. Social & community layer

- **Family Mode.** Link a household. Elders (even non-app-users) can be sent a one-tap prompt to record a **voice challenge** ("say this back to Ba"). Learning becomes a shared family activity, not a solo grind.
- **Cooperative community goals.** Temple groups, Gujarati Samaj chapters, friend circles grow a shared garden/rangoli by practicing.
- **Live festival events.** Time-boxed community challenges around Navratri/Diwali/Uttarayan.
- **Gentle, opt-in leagues** for people who *want* competition — never the default.

---

## 7. Content strategy

- **Authenticity is the moat.** Native voice actors (note: standard Gujarati + awareness of Kathiyawadi/Surti/diaspora accents), culturally real scenarios, reviewed by native speakers and, ideally, heritage-education partners (temples, Gujarati Samaj, weekend schools).
- **Register matters.** Gujarati politeness (tું vs. તમે, elder-respect) is taught explicitly — huge for heritage learners who don't want to sound rude to relatives.
- **A content pipeline** (structured item bank: text + audio + image + metadata + SRS params) so we can scale units without re-engineering, and so AI can help *draft* content that native reviewers approve — never ship unreviewed.

---

## 8. Proposed tech architecture (for discussion)

Mobile-first, because speaking + habit + notifications live on the phone.

| Layer | Proposal | Why |
|---|---|---|
| **Client** | **React Native (Expo)** | One codebase iOS+Android, fast iteration, great for an MVP; strong audio libs. (Flutter is the alternative.) |
| **Backend** | Node/TypeScript API + **Postgres**; or **Supabase** to start | Speed to MVP; Postgres handles the item bank + SRS scheduling well. |
| **SRS engine** | **FSRS** (open-source) | State-of-the-art, better than SM-2, actively maintained. |
| **Speech-in (STT)** | Cloud STT with Gujarati support (Google / Azure) | Gujarati ASR is the risk item — needs early evaluation. |
| **Speech-out (TTS)** | Cloud Gujarati TTS + recorded native audio for core content | Native recordings for quality where it matters; TTS for scale/AI dialogue. |
| **Conversation AI** | **Claude** for Vaat Mode dialogue, feedback, and content drafting | Nuanced, register-aware, good at pedagogy and cultural sensitivity. |
| **Pronunciation feedback** | Phoneme-level scoring (evaluate cloud vs. on-device) | The retroflex/aspirated distinctions are where learners need help. |
| **Analytics** | Learning-outcome metrics first (see §10) | We measure *learning*, not just DAU. |

**Biggest technical risks to de-risk early:** (1) quality of Gujarati **STT/pronunciation scoring**, (2) sourcing **native audio** at scale, (3) making the FSRS scheduling feel invisible inside a fun loop.

---

## 9. Roadmap

### Phase 0 — Prototype (prove the magic)
Akshar Lab (script mini-game) + a single themed unit (Family & Greetings) + one Vaat Mode conversation with *Ba*. Goal: does the core loop feel *fun and effective*? Test with 5–10 real heritage learners.

### Phase 1 — MVP
- Onboarding + heritage placement.
- 3–4 themed units (A1) with full 5-strand lessons.
- FSRS review system.
- Akshar Lab complete (all letters + barakshari).
- Kind gamification core (XP, gentle streak, cultural rewards, personal goal).
- 2–3 Vaat Mode scenarios.

### Phase 2 — V1 (retention & social)
- Full A1→A2 path.
- Family Mode + cooperative community garden.
- First festival event (timed to the calendar).
- Pronunciation feedback for tricky phonemes.
- Opt-in leagues.

### Phase 3 — V2 (depth & scale)
- B1 content, culture/devotion tracks (bhajans, scripture, Bollywood/Gujarati song mode).
- Richer AI tutor, dialect awareness.
- Web companion; partnerships with temples / Gujarati Samaj / heritage schools.

---

## 10. How we measure success (learning, not just engagement)

- **Primary (learning):** words/phrases at "mastered" SRS state; letters read fluently; speaking-quest completions; self-reported "I had a real conversation" milestones.
- **Secondary (habit):** D1/D7/D30 retention, sessions/week, streak health.
- **Guardrail (ethics):** we watch for anxiety signals; if a mechanic boosts DAU but not learning or wellbeing, we cut it. That's the promise that makes us different.

---

## 11. Open questions for your feedback

1. **Primary audience** — do we aim squarely at the **heritage/diaspora** learner first (my recommendation), or serve travelers/beginners equally from day one?
2. **Platform** — React Native (my lean) vs. Flutter vs. web-first?
3. **Script vs. speaking** — for the very first prototype, which single feature should we make *shine*: **Akshar Lab** (literacy) or **Vaat Mode** (speaking)?
4. **Gamification depth** — how far do we lean into game mechanics vs. calm/minimalist? Where's your comfort line on streaks?
5. **Kids** — is the diaspora-kid audience (age 8–12) in scope for V1, or a later dedicated mode?
6. **Content sourcing** — do you have access to native speakers / community partners for audio and review?
7. **Name/brand** — keep **VaatChat**, shorten to **Vaat**, or explore alternatives?

---

*This is a starting point for a conversation — the whole point of Vaat. Tell me what excites you, what's off, and what you'd cut, and I'll refine the plan before we write a line of code.*
