# VaatChat 🪔

> **વાત (vaat)** = *talk · conversation · story.*

A fun, frictionless, research-backed, gamified app for learning **Gujarati** — built conversation-first, for heritage learners, partners marrying into Gujarati families, and anyone who wants to actually *speak* the language.

**Status:** 🛠️ Working MVP prototype (web). Onboarding, spaced-repetition lessons, Akshar Lab, scripted Vaat Mode, and a **Vyakaran** (grammar) track all run today. Gujarati content is an AI-drafted first pass awaiting native-speaker verification.

## Run it locally

```bash
npm install
npm run dev      # → http://localhost:3000
```

`npm run build` for a production build, `npm run typecheck` to type-check. The app is a Next.js (App Router) web app, ready to deploy to Vercel. Audio uses your recorded files when present (see `docs/AUDIO_CHECKLIST.md`) and falls back to browser text-to-speech otherwise — no API keys required.

## What makes it different
- **Heritage-aware** — fast-tracks people who already understand spoken Gujarati straight to reading & speaking.
- **Culturally native** — the kitchen, festivals, family, garba — not "the boy has an apple."
- **Speaking-first** — AI role-play (*Vaat Mode*) with characters like *Ba* and the *chai-wallah*.
- **Script made fun** — *Akshar Lab* turns the abugida into a game (mnemonics, tracing, barakshari).
- **Grammar, done right** — *Vyakaran* teaches how the language works by guided discovery + spaced practice, not rule dumps ([`docs/VYAKARAN.md`](./docs/VYAKARAN.md)).
- **Kind gamification** — habit-forming without streak anxiety; mastery over minutes.
- **Grounded in research** — spaced repetition (FSRS), comprehensible input, active recall, real output.

## Read the plan
- 📄 [`docs/PLAN.md`](./docs/PLAN.md) — full product & design plan (start here).
- 🧩 [`docs/VYAKARAN.md`](./docs/VYAKARAN.md) — the grammar pillar: design, syllabus, and how it reuses the same engine.
- 📚 [`docs/RESEARCH.md`](./docs/RESEARCH.md) — the evidence and sources behind the design.
- 🎙️ [`docs/AUDIO_CHECKLIST.md`](./docs/AUDIO_CHECKLIST.md) — phrases & letters to record for native audio.

## Code map
- `lib/core/` — portable, framework-agnostic learning engine (SRS/FSRS, gamification, progress, content model, Vaat provider). Reused by a future iOS app.
- `lib/content/` — seeded Gujarati content (units, Akshar Lab, scenarios, grammar). *Draft — pending native verification.*
- `lib/client/` — React glue: progress hook + browser audio/TTS/STT helpers.
- `app/`, `components/` — the Next.js screens and UI.

Feedback welcome — that's the whole point of *Vaat*. 🙏
