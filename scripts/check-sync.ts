// ─────────────────────────────────────────────────────────────────────────
// Merge rules for cross-device progress — checked, not assumed.
//
//   npm run check:sync
//
// This one guards data the learner can't get back. A bad merge doesn't crash or
// look wrong in the UI; it quietly drops a study session and nobody finds out.
// So the algebra gets asserted (order-independence, idempotence, associativity)
// alongside the scenarios that actually happen to someone with a phone and an
// iPad.
// ─────────────────────────────────────────────────────────────────────────

import { mergeProgress } from "../lib/core/sync.ts";

type Progress = Parameters<typeof mergeProgress>[0];
type CardState = Progress["cards"][string];

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function card(lastReview: string | null, reps: number, due: string): CardState {
  return {
    due,
    stability: 4,
    difficulty: 5,
    elapsed_days: 1,
    scheduled_days: 3,
    reps,
    lapses: 0,
    state: 2,
    ...(lastReview ? { last_review: lastReview } : {}),
  };
}

function profile(over: Partial<Progress> = {}): Progress {
  return {
    version: 1,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    onboarded: true,
    xp: 0,
    streak: { count: 0, lastActiveDay: null, graceUsed: false },
    cards: {},
    completedLessons: [],
    completedScenarios: [],
    aksharMastered: [],
    completedGrammar: [],
    ...over,
  };
}

// ── The scenario the whole feature exists for ──────────────────────────────
// Lunchtime on the phone, evening on the iPad. Neither device saw the other.
const phone = profile({
  updatedAt: "2026-07-24T12:30:00.000Z",
  xp: 120,
  cards: {
    "c-ka": card("2026-07-24T12:20:00.000Z", 5, "2026-07-27T00:00:00.000Z"),
    "c-ga": card("2026-07-24T12:25:00.000Z", 2, "2026-07-25T00:00:00.000Z"),
  },
  completedLessons: ["u1-l1", "u1-l2"],
  streak: { count: 4, lastActiveDay: "2026-07-24", graceUsed: false },
});
const ipad = profile({
  updatedAt: "2026-07-24T21:10:00.000Z",
  xp: 95,
  cards: {
    // Same card, reviewed again later in the day — the iPad has newer evidence.
    "c-ka": card("2026-07-24T21:00:00.000Z", 6, "2026-07-30T00:00:00.000Z"),
    // A card the phone never saw.
    "w-c-ma": card("2026-07-24T21:05:00.000Z", 1, "2026-07-25T00:00:00.000Z"),
  },
  completedLessons: ["u1-l1", "u2-l1"],
  streak: { count: 4, lastActiveDay: "2026-07-24", graceUsed: false },
});

console.log("\nphone + iPad, same day, neither saw the other:");
const m = mergeProgress(phone, ipad);
check("keeps the card only the phone has", Boolean(m.cards["c-ga"]));
check("keeps the card only the iPad has", Boolean(m.cards["w-c-ma"]));
check(
  "same card: the later review wins",
  m.cards["c-ka"].last_review === "2026-07-24T21:00:00.000Z" && m.cards["c-ka"].reps === 6,
  JSON.stringify(m.cards["c-ka"]),
);
check("no session is lost", Object.keys(m.cards).length === 3);
check("completed lessons union", same(m.completedLessons, ["u1-l1", "u1-l2", "u2-l1"]));
check("xp takes the higher", m.xp === 120, String(m.xp));
check("streak survives", m.streak.count === 4 && m.streak.lastActiveDay === "2026-07-24");

// ── The algebra ────────────────────────────────────────────────────────────
console.log("\nalgebraic properties (why re-syncing is safe):");
check("commutative — order doesn't matter", same(mergeProgress(phone, ipad), mergeProgress(ipad, phone)));
check("idempotent — merging the result again changes nothing", same(mergeProgress(m, m), m));
check("re-syncing a device it already saw is a no-op", same(mergeProgress(m, phone), m) && same(mergeProgress(m, ipad), m));

const laptop = profile({
  updatedAt: "2026-07-25T08:00:00.000Z",
  xp: 60,
  cards: { "c-ba": card("2026-07-25T07:55:00.000Z", 1, "2026-07-26T00:00:00.000Z") },
  completedGrammar: ["aa-te"],
  streak: { count: 5, lastActiveDay: "2026-07-25", graceUsed: true },
});
check(
  "associative — three devices merge to the same result either way",
  same(
    mergeProgress(mergeProgress(phone, ipad), laptop),
    mergeProgress(phone, mergeProgress(ipad, laptop)),
  ),
);

let repeated = mergeProgress(phone, ipad);
for (let i = 0; i < 25; i++) repeated = mergeProgress(repeated, i % 2 ? phone : ipad);
check("25 repeated syncs don't inflate xp", repeated.xp === 120, String(repeated.xp));
check("25 repeated syncs are stable", same(repeated, m));

// ── Edge cases ─────────────────────────────────────────────────────────────
console.log("\nedges:");
const fresh = profile({ updatedAt: undefined, onboarded: false });
check("a never-synced profile merges cleanly", mergeProgress(fresh, phone).xp === 120);
check("onboarding survives from either side", mergeProgress(fresh, phone).onboarded === true);
check(
  "account age is the earlier start",
  mergeProgress(profile({ createdAt: "2026-06-01T00:00:00.000Z" }), phone).createdAt ===
    "2026-06-01T00:00:00.000Z",
);
check(
  "a reviewed card beats a merely-created one",
  mergeProgress(
    profile({ cards: { x: card(null, 0, "2026-07-24T00:00:00.000Z") } }),
    profile({ cards: { x: card("2026-07-24T09:00:00.000Z", 1, "2026-07-28T00:00:00.000Z") } }),
  ).cards.x.reps === 1,
);
check(
  "spent grace stays spent",
  mergeProgress(phone, laptop).streak.graceUsed === true,
);
check(
  "the later day carries the streak",
  mergeProgress(phone, laptop).streak.lastActiveDay === "2026-07-25",
);
check("goal from the more recent device wins",
  mergeProgress(
    profile({ updatedAt: "2026-07-20T00:00:00.000Z", goal: "old goal" }),
    profile({ updatedAt: "2026-07-24T00:00:00.000Z", goal: "chat with Ba" }),
  ).goal === "chat with Ba");

if (failures > 0) {
  console.error(`\n✗ ${failures} merge rule(s) broken.\n`);
  process.exit(1);
}
console.log("\n✓ Progress merges safely across devices — no session can be dropped.\n");
