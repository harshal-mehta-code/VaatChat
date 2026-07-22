# Research notes & sources

Supporting evidence behind the design decisions in [`PLAN.md`](./PLAN.md). Summarized from web research on 2026-07-22.

## Spaced repetition (SRS)
- 100+ years of evidence that spaced practice beats massed practice (cramming) for durable memory; grounded in the Ebbinghaus **forgetting curve**. Modern algorithms (SM-2 → **FSRS**) adapt review intervals to recall performance; AI/adaptive schedulers outperform static formulas. SRS is strongest when paired with multimedia (audio + image) and cloze deletion rather than plain translation.
  - The FLTMAG — Benefits & challenges of SRS flashcard apps: https://fltmag.com/spaced-repetition-flashcard-apps/
  - Lingua-Learn — SRS for vocabulary: https://lingua-learn.com/blogs/spaced-repetition-system-language/
  - Research-backed SRS app picks (2026): https://yourhealthmagazine.net/article/reviews/the-best-spaced-repetition-language-apps-in-2026-research-backed-picks-for-real-fluency/
  - Taalhammer — SRS + AI app comparison: https://www.taalhammer.com/best-language-learning-apps-with-spaced-repetition-srs-and-ai-in-2025-taalhammer-vs-11-other-apps/

## Gamification — what works and what to avoid
- **Works:** streaks exploit loss aversion (7-day streakers far more likely to persist; streak wagers lifted D14 retention ~14%); XP as a universal currency; leaderboards raised engagement without increasing dropout among lower performers in Duolingo's data; large shares of students credit gamification for daily use.
- **Criticism to design against:** streak anxiety, compulsive checking, and competitive leaderboards that resemble addictive social media; "engagement without genuine learning"; weak conversational fluency. This directly motivates VaatChat's *kind gamification* (§6 of the plan): softened streaks, cooperative-by-default social layer, mastery-over-minutes framing, and real speaking practice.
  - StriveCloud — Duolingo gamification: https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo
  - Trophy — Duolingo gamification case study (2026): https://trophy.so/blog/duolingo-gamification-case-study
  - Deconstructor of Fun — how Duolingo uses game principles: https://www.deconstructoroffun.com/blog/2025/4/14/duolingo-how-the-15b-app-uses-gaming-principles-to-supercharge-dau-growth
  - On meaningful/ethical gamification: https://arxiv.org/pdf/2403.08041

## Comprehensible input, output & AI conversation
- Comprehensible input (Krashen's i+1) drives acquisition, but recent critique shows **interactional involvement** (learners negotiating meaning) yields better vocabulary and pragmatic gains than one-way input. Blending **adaptive gamification with conversational AI** improves comprehension, self-regulation, and learner autonomy; AI tutors work best as a *complement*, not a replacement, for human practice. Supports VaatChat's Vaat Mode + real-world quests.
  - Frontiers — neuro-ecological critique of Krashen: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1636777/full
  - Gamified + non-gamified AI (Duolingo vs. Replika) listening study: https://www.researchsquare.com/article/rs-7558517/v1
  - Gamification & AI in language learning: https://egarp.lt/index.php/aghel/article/view/142

## The Gujarati script (abugida)
- 14 vowels (*swar*) + 34 consonants (*vyanjan*); vowels appear as independent letters *or* as diacritic **matras** attached to consonants. Challenges for English speakers: matra system, short/long vowel timing, and consonants absent in English (**retroflex** ટ/ડ, **aspirated** ખ/ઘ). Recommended remedies: audio + native-speaker practice, syllable breakdown — motivates Akshar Lab's mnemonics, tracing, and the **barakshari** (consonant×vowel) drill.
  - Preply — Gujarati alphabet guide: https://preply.com/en/blog/gujarati-alphabet-guide/
  - Remitly — Gujarati alphabet / script & sound: https://www.remitly.com/blog/education/gujarati-alphabet/
  - Remitly — Gujarati vowels: https://www.remitly.com/blog/education/gujarati-vowels-guide/

## Heritage / diaspora learners (the wedge)
- 2nd/3rd-generation Gujaratis often retain **conversational** competence but lose **formal registers, reading, and writing**; heritage-language ability is closely tied to **ethnic/cultural identity**, and maintenance depends on family and community institutions (temples, Samaj, weekend schools). There's a noted dearth of resources and study for the Indian diaspora — a real market gap. Motivates VaatChat's heritage fast-track, identity-anchored goals, family/community mode, and cultural authenticity.
  - Georgetown — Factors affecting proficiency among Gujarati heritage learners on three continents: https://repository.digital.georgetown.edu/handle/10822/559499
  - Identity threat & heritage-language maintenance, 2nd-gen Indian diaspora (Sydney): https://www.tandfonline.com/doi/full/10.1080/19438192.2024.2363685
