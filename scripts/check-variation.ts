// ─────────────────────────────────────────────────────────────────────────
// Variation check — is a second sitting actually a different sitting?
//
//   npm run check:variation
//
// Two things can quietly go wrong once sessions are planned rather than baked,
// and neither shows up as a crash:
//
//   Too little variation — a seed that isn't really per-session, a pool too
//   small to draw from, and the app is back to the answer always being third.
//   Silent, and the whole reason this file exists.
//
//   Too much — a phase order that drifts, so you're asked to recall a word
//   before you've met it, or a lesson that quietly doubles in length.
//
// Also checks the distractor pools themselves, which is really a content
// check: a "wrong" answer that means the same thing as the right one is the
// one kind of distractor that teaches nothing.
// ─────────────────────────────────────────────────────────────────────────

import { planLesson, SESSION_SHAPE } from "../lib/core/session.ts";
import { makeRng, shuffled, sample } from "../lib/core/variation.ts";
import { planMix } from "../lib/core/mix.ts";
import { UNITS } from "../lib/content/units.ts";
import { ITEMS_BY_ID } from "../lib/content/units.ts";
import { GRAMMAR_MODULES, drillPool } from "../lib/content/grammar.ts";

const failures: string[] = [];
function expect(label: string, ok: boolean, detail = "") {
  if (!ok) failures.push(detail ? `${label} — ${detail}` : label);
}

const LESSONS = UNITS.flatMap((u) => u.lessons);
const SEEDS = ["a1", "b2", "c3", "d4", "e5", "f6", "g7", "h8"];

// ── The pedagogy holds: phases keep their order, every time ───────────────

const PHASE_RANK: Record<string, number> = {
  intro: 0,
  predict: 0, // a promoted intro — same phase
  recall: 1,
  listen: 2,
  speak: 3,
};

for (const lesson of LESSONS) {
  for (const seed of SEEDS) {
    const plan = planLesson(lesson.exercises, makeRng(seed));

    let rank = -1;
    for (const ex of plan) {
      const r = PHASE_RANK[ex.kind];
      expect(`${lesson.id}: unknown exercise kind "${ex.kind}"`, r !== undefined);
      if (r === undefined) continue;
      expect(
        `${lesson.id}/${seed}: phases out of order`,
        r >= rank,
        `${ex.kind} came after a later phase`,
      );
      rank = Math.max(rank, r);
    }

    // Every word is still met and still recalled — variation selects *which*
    // items get the optional drills, never which ones get taught.
    const items = new Set(lesson.exercises.map((e) => e.itemId));
    for (const kind of ["intro", "recall"] as const) {
      const covered = new Set(
        plan.filter((e) => e.kind === kind || (kind === "intro" && e.kind === "predict")).map((e) => e.itemId),
      );
      expect(
        `${lesson.id}/${seed}: ${kind} phase skipped an item`,
        covered.size === items.size,
        `${covered.size}/${items.size}`,
      );
    }

    // Caps hold, so a session can't balloon.
    for (const [kind, cap] of Object.entries(SESSION_SHAPE)) {
      const n = plan.filter((e) => e.kind === kind).length;
      expect(`${lesson.id}/${seed}: too many ${kind}`, n <= (cap as number), `${n} > ${cap}`);
    }

    // A predict needs something to guess among.
    for (const ex of plan) {
      if (ex.kind === "predict") {
        expect(
          `${lesson.id}/${seed}: predict with no options`,
          (ex.distractorIds?.length ?? 0) > 0,
          ex.itemId,
        );
      }
    }
  }
}

// ── There is actually variation ───────────────────────────────────────────

for (const lesson of LESSONS) {
  const signatures = new Set(
    SEEDS.map((s) => planLesson(lesson.exercises, makeRng(s)).map((e) => e.id).join("|")),
  );
  // Eight seeds landing on fewer than four distinct orders means the seed isn't
  // reaching the plan.
  expect(
    `${lesson.id}: sessions barely differ`,
    signatures.size >= Math.min(4, SEEDS.length),
    `${signatures.size} distinct orders from ${SEEDS.length} seeds`,
  );

  // ...and the same holds for which items get the optional drills.
  const listens = new Set(
    SEEDS.map((s) =>
      planLesson(lesson.exercises, makeRng(s))
        .filter((e) => e.kind === "listen")
        .map((e) => e.itemId)
        .sort()
        .join(","),
    ),
  );
  const listenCap = SESSION_SHAPE.listen ?? 3;
  const itemCount = new Set(lesson.exercises.map((e) => e.itemId)).size;
  if (itemCount > listenCap) {
    expect(
      `${lesson.id}: the same items always get the listening drill`,
      listens.size > 1,
      `${itemCount} items, ${listenCap} slots, 1 combination`,
    );
  }
}

// Option order has to move too — that's the one a learner notices first.
{
  const positions = new Set(
    SEEDS.map((seed) => shuffled(["a", "b", "c", "d"], makeRng(`${seed}:same-exercise`)).indexOf("a")),
  );
  expect(
    "the right answer sits in the same place every time",
    positions.size > 1,
    `${positions.size} distinct positions`,
  );
}

// ── Distractor pools: big enough, and never accidentally right ────────────

let pools = 0;
let thin = 0;
for (const lesson of LESSONS) {
  for (const ex of lesson.exercises) {
    const ids = ex.distractorIds ?? [];
    if (ids.length === 0) continue;
    pools++;
    const target = ITEMS_BY_ID[ex.itemId];
    expect(`${ex.id}: unknown item`, Boolean(target));
    if (!target) continue;

    for (const id of ids) {
      const d = ITEMS_BY_ID[id];
      expect(`${ex.id}: distractor "${id}" doesn't exist`, Boolean(d));
      if (!d) continue;
      expect(`${ex.id}: distractor ${d.gujarati} means the same as the answer`, d.english !== target.english);
      expect(`${ex.id}: the answer is in its own distractor pool`, d.id !== target.id);
    }
    expect(`${ex.id}: duplicate distractors`, new Set(ids).size === ids.length);
    // Fewer than 4 candidates for 3 slots means no real choice.
    if (ids.length < 4) thin++;
  }
}

// ── Grammar drills shuffle too ────────────────────────────────────────────

const CONCEPTS = GRAMMAR_MODULES.flatMap((m) => m.concepts);
for (const concept of CONCEPTS) {
  // The pool is authored drills plus the ones derived from the concept's own
  // verified examples (npm run check:drills covers that they're well-formed).
  const pool = drillPool(concept);
  if (pool.length < 3) continue;
  const orders = new Set(SEEDS.map((s) => shuffled(pool, makeRng(s)).map((e) => e.id).join("|")));
  expect(`${concept.id}: drills barely reorder`, orders.size >= 3, `${orders.size} orders`);
}

// ── The daily mix ─────────────────────────────────────────────────────────
//
// Two ways this goes wrong quietly: it offers a leg the learner has nothing to
// do (a writing leg on day one, a grammar leg before any concept), or it stops
// varying and becomes the same four things in the same order every day — which
// is the exact failure this whole file exists to catch.

{
  const DAYS = ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"];

  const beginner = { deck: 0, writable: 0, concepts: 0 };
  const seasoned = { deck: 40, writable: 20, concepts: 6 };

  for (const [label, avail] of [
    ["day one", beginner],
    ["seasoned", seasoned],
  ] as const) {
    for (const seed of DAYS) {
      const mix = planMix(avail, makeRng(seed));
      expect(`${label}/${seed}: empty mix`, mix.length > 0);
      for (const leg of mix) {
        expect(`${label}/${seed}: leg of no length`, leg.size > 0, leg.kind);
        if (leg.kind === "review") {
          expect(`${label}/${seed}: review leg with no deck`, avail.deck > 0);
        }
        if (leg.kind === "write") {
          expect(`${label}/${seed}: writing leg with nothing started`, avail.writable > 0);
        }
        if (leg.kind === "grammar") {
          expect(`${label}/${seed}: grammar leg with no concept behind it`, avail.concepts > 0);
        }
      }
      const kinds = mix.map((l) => l.kind);
      expect(`${label}/${seed}: the same leg twice`, new Set(kinds).size === kinds.length, kinds.join(","));
    }
  }

  // Due cards are the one thing with a real cost to skipping, so they lead.
  for (const seed of DAYS) {
    const mix = planMix(seasoned, makeRng(seed));
    expect(`${seed}: review isn't first`, mix[0]?.kind === "review", mix[0]?.kind);
  }

  // ...and everything after it moves.
  const shapes = new Set(
    DAYS.map((s) => planMix(seasoned, makeRng(s)).map((l) => l.kind).join("|")),
  );
  expect(
    "the daily mix is the same every day",
    shapes.size >= 4,
    `${shapes.size} shapes from ${DAYS.length} days`,
  );
}

// ── Report ────────────────────────────────────────────────────────────────

const sampleLesson = LESSONS[0];
console.log(`Lessons              : ${LESSONS.length} planned across ${SEEDS.length} seeds each`);
console.log(
  `Session length       : ${planLesson(sampleLesson.exercises, makeRng("x")).length} steps from a ${sampleLesson.exercises.length}-exercise grid (${sampleLesson.id})`,
);
console.log(`Distractor pools     : ${pools}, ${thin} with fewer than 4 candidates`);
console.log(
  `Daily mix            : ${
    new Set(
      ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"].map((s) =>
        planMix({ deck: 40, writable: 20, concepts: 6 }, makeRng(s))
          .map((l) => l.kind)
          .join("|"),
      ),
    ).size
  } distinct shapes from 8 sittings`,
);
console.log(
  `Grammar concepts     : ${CONCEPTS.length}, ${CONCEPTS.reduce((n, c) => n + drillPool(c).length, 0)} drills in their pools`,
);

if (thin > pools * 0.25) {
  console.error(
    `\n✗ ${thin} of ${pools} distractor pools have fewer than 4 candidates for 3 slots — there's no real choice left to make.`,
  );
  process.exit(1);
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} variation check(s) failed:\n`);
  for (const f of failures.slice(0, 30)) console.error(`  ${f}`);
  if (failures.length > 30) console.error(`  …and ${failures.length - 30} more`);
  process.exit(1);
}

console.log(`\n✓ Sessions vary, phases hold their order, and no distractor is secretly right.`);

// Referenced so the import isn't dropped as unused by a future edit.
void sample;
