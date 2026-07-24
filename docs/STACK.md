# Stack & infrastructure — decisions, limits, and what to revisit before launch

> Written while wiring up accounts, so the reasoning survives to the day it
> actually matters: the point where this stops being a two-person app and goes
> in front of strangers.

**Status:** current as of 2026-07-24.
**⚠️ Free-tier numbers below drift.** Providers revise them regularly and some
figures here are from memory. Treat every quota as "roughly, last we looked" and
confirm in the dashboard before making a decision that depends on it.

---

## What's running today

| Layer | Choice | Why |
|---|---|---|
| Hosting | **Vercel** | Next.js App Router, branch previews, zero-config deploys |
| Auth | **Supabase Auth** (magic link) | No password to forget; installed natively via Vercel Marketplace |
| Database | **Supabase Postgres** | One `public.progress` row per learner, whole `Progress` object as jsonb |
| Audio | Baked mp3 files in `public/` | Generated once by `npm run gen:audio`; **no API key at runtime** |
| Progress store | localStorage, cloud as reconciler | See below — this is the important one |
| SRS | `ts-fsrs` | Local, no service |
| Handwriting scoring | Local geometry (`lib/core/strokes.ts`) | Pure math, offline, no ML service |

**The architectural commitment worth protecting:** the app is fully usable with
no account and no network. localStorage is the source of truth; the cloud is a
background reconciler on top (`lib/client/useCloudSync.ts`). Nothing is behind a
login. Any future stack change has to preserve that, or the app gets worse in the
exact situation people learn in — a commute, a waiting room, a plane.

`lib/core/*` stays free of React, DOM, and any provider SDK. That's what makes
the merge logic testable without a database and reusable by a native client.

---

## Known limits, and which ones bite

### 1. Supabase's built-in email sender is throttled — **this is the real one**

Magic links go through a shared Supabase SMTP service that is rate-limited to a
*small number of emails per hour* (on the order of a couple; it has been revised
downward more than once). Supabase's own documentation treats the built-in
sender as development-only.

- **Symptom when hit:** sign-in silently fails with a generic "try again later".
  A tester has no idea why and will not try twice.
- **Threshold:** invisible for one or two people. Breaks the moment you invite a
  handful of testers on the same evening.
- **Fix:** custom SMTP. **Resend** free tier (~3,000/month, ~100/day last we
  looked) covers this many times over. Roughly 20 minutes: provision, then set
  SMTP host/user/pass under Supabase → Project Settings → Auth → SMTP.
- **Do it anyway, eventually:** custom SMTP is also what makes the email say
  *VaatChat* instead of *Supabase*, which matters the first time a stranger gets
  one.

**Trigger to act: before the first person outside the household signs in.**

### 2. Free Supabase projects pause after ~7 days idle

Needs a click in the dashboard to wake. Harmless during quiet development,
invisible once anyone uses the app daily. Not worth engineering around.

### 3. Redirect URLs must be allow-listed

Magic links bounce unless Supabase knows the URLs you sign in from. Under
**Authentication → URL Configuration**: set **Site URL** to production, and add
the production domain plus the Vercel preview pattern to **Redirect URLs**.
Without this, sign-in only works on `localhost:3000`.

---

## Would Firebase have been better?

Asked honestly during setup, and the honest answer is: **for the email limit
specifically, yes.** Worth recording rather than pretending the choice was
obvious.

| | Supabase (chosen) | Firebase (Spark) |
|---|---|---|
| Passwordless email | Shared SMTP, tightly throttled | Sent by Google, no meaningful cap |
| Idle pausing | Pauses after ~7 days | Doesn't pause |
| Storage headroom for us | 500 MB — vastly more than needed | 1 GiB + generous daily read/write quotas |
| Fit for a single JSON blob | Fine (jsonb) | Arguably more natural (document store) |
| Relational queries later | Native SQL | Awkward and costly |
| Portability | Postgres — dump and move to any host | Firestore is proprietary; leaving is a rewrite |
| Vercel integration | Native Marketplace, env vars auto-wired | Manual config |
| iOS story | Swift SDK, less mature | Excellent — offline persistence and sync built in |

**Why we're staying anyway:**

1. The email limit is fixed by a 20-minute config change we wanted regardless.
2. Postgres keeps doors open that Firestore closes — family mode, cohort stats,
   and any leaderboard are relational queries.
3. Switching would mean redoing the data layer, the auth flow, and the RLS
   isolation proof (`npm run check:rls`) as Firestore rules. Real cost, for a
   problem SMTP already solves.

**Where Firebase genuinely wins is iOS.** If a native client ever happens, its
offline persistence and sync would replace a meaningful chunk of hand-rolled
work. That's a real re-evaluation point, not a settled question — see
`docs/PLAN.md` for the platform reasoning, including the correction that Apple's
on-device speech recognition almost certainly does **not** cover Gujarati, which
removes the main reason we'd originally written down for going native.

---

## Checklist before this is public-facing

Roughly in order of when they start to matter.

**Before the first outside tester**
- [ ] Custom SMTP (Resend) so sign-in emails actually arrive, and come from us
- [ ] Redirect URLs + Site URL configured for production and previews
- [ ] Confirm the free-tier numbers above still hold

**Before anyone who isn't a friend**
- [ ] Privacy policy — what's stored (an email and learning progress), where it
      lives, how to delete it
- [ ] Account deletion that actually deletes: the `progress` row cascades on user
      delete, but the *user* needs a delete path
- [ ] Rate limiting / abuse consideration on auth
- [ ] Decide on analytics, and keep it to learning outcomes rather than vanity
      metrics (`docs/PLAN.md` §10)

**Before charging money**
- [ ] Payments — Stripe via Vercel Marketplace (`payments` category; no product
      catalog, so `commerce` is the wrong fit)
- [ ] Supabase paid tier — the pausing and quota story changes entirely
- [ ] Native voice recordings to replace neural TTS, if audio quality becomes a
      selling point
- [ ] Content depth: the honest blocker. See `docs/PLAN.md` — the path currently
      runs out in a few weeks, and no amount of infrastructure fixes that

---

## Operational notes

- **Secrets** live in `.env.local`, pulled by `vercel env pull --yes`, gitignored.
  Nothing secret is committed. The publishable key plus RLS is the whole
  browser-side access model; the service-role key is used only by local scripts.
- **Migrations**: `npm run migrate` applies `supabase/migrations/*.sql` in order,
  each in a transaction, recorded so re-running is a no-op.
- **Guards** worth running before a deploy that touches data or content:
  `npm run check:sync` (merge algebra), `npm run check:rls` (learner isolation,
  against the live database), `npm run check:audio`, `npm run check:strokes`,
  `npm run typecheck`, `npm run build`.
