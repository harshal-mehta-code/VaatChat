// ─────────────────────────────────────────────────────────────────────────
// Milestone check — is the journey actually walkable?
//
//   npm run check:milestones
//
// A milestone is a promise: do this, and the app will say you've done it. The
// ways that promise breaks are quiet ones — a criterion that outruns the
// content (know 100 words when only 80 exist), one that's earned the moment you
// open the app, one whose bar can never be reached at all. None of them crash;
// they just make the journey a lie.
//
// So this walks a learner from nothing to everything and asserts the shape of
// the walk: nothing earned at the start, everything earned at the end, every
// milestone measurable in between, and always exactly one sensible next thing
// to aim for.
// ─────────────────────────────────────────────────────────────────────────

import {
  MILESTONES,
  milestoneStates,
  nextMilestone,
  earnedMilestoneIds,
  uncelebrated,
  type MilestoneCatalog,
} from "../lib/core/milestones.ts";
import { freshProgress, writingCardId, type Progress } from "../lib/core/progress.ts";
import { newCard, reviewCard } from "../lib/core/srs.ts";
import { milestoneCatalog, nameLetterIds } from "../lib/content/milestones.ts";
import { ITEMS } from "../lib/content/units.ts";
import { FREQUENCY_ITEMS } from "../lib/content/frequency.ts";
import { transliterateRoman } from "../lib/core/translit.ts";

const failures: string[] = [];
function expect(label: string, ok: boolean, detail = "") {
  if (!ok) failures.push(detail ? `${label} — ${detail}` : label);
}

const blank = freshProgress();
const cat = milestoneCatalog(blank);

// ── Shape ─────────────────────────────────────────────────────────────────

{
  const ids = MILESTONES.map((m) => m.id);
  expect("duplicate milestone ids", new Set(ids).size === ids.length);
  for (const m of MILESTONES) {
    expect(`${m.id}: no emoji`, Boolean(m.emoji));
    expect(`${m.id}: no title`, Boolean(m.title));
    expect(`${m.id}: no requirement`, Boolean(m.requirement));
    // A title should read as something you can do, not a score. Cheap proxy:
    // it must not be a bare number, which is what the old XP rewards were.
    expect(`${m.id}: title is a number, not a capability`, !/^\d/.test(m.title), m.title);
  }
}

// ── Nothing is earned on day one ──────────────────────────────────────────

for (const s of milestoneStates(blank, cat)) {
  expect(`${s.milestone.id}: earned before doing anything`, !s.earned, `${s.have}/${s.need}`);
  expect(`${s.milestone.id}: bar of zero`, s.need > 0);
  expect(`${s.milestone.id}: starts part-done`, s.have === 0, `${s.have}`);
}
expect("something to aim for on day one", Boolean(nextMilestone(blank, cat)));

// ── Every bar is inside what the content can supply ───────────────────────
//
// The one that would bite: "a hundred words" when the bank holds ninety.

{
  const vocabulary = new Set([...ITEMS, ...FREQUENCY_ITEMS].map((i) => i.id)).size;
  const hundred = MILESTONES.find((m) => m.id === "hundred-words")!;
  const { need } = hundred.measure(blank, cat);
  expect(
    "the word-count milestone outruns the word bank",
    need <= vocabulary,
    `needs ${need}, ${vocabulary} words exist`,
  );
  // Two milestones in the same pillar with the same bar are the same
  // achievement wearing two names. This is how a content gap shows up as a
  // journey defect: with one Vaat scenario, "finish a conversation" and "finish
  // every conversation" are indistinguishable.
  const seen = new Map<string, string>();
  for (const m of MILESTONES) {
    const key = `${m.pillar}:${m.measure(blank, cat).need}`;
    const other = seen.get(key);
    expect(`${m.id} and ${other} are the same milestone`, other === undefined, key);
    seen.set(key, m.id);
  }

  expect("no letters to learn", cat.letterIds.length > 0);
  expect("no writable letters", cat.writableLetterIds.length > 0);
  expect("no scenarios", cat.scenarioCount > 0);
  expect("no grammar concepts", cat.conceptCount > 0);
}

// ── A learner who does everything earns everything ────────────────────────

/** Two correct sightings on separate days — what `itemStatus` calls "known". */
function learn(p: Progress, id: string): Progress {
  let card = reviewCard(newCard(), "good", new Date("2026-01-01"));
  card = reviewCard(card, "good", new Date("2026-01-05"));
  return { ...p, cards: { ...p.cards, [id]: card } };
}

{
  let p = freshProgress();
  // ...knows every letter, by sight and by hand
  for (const id of cat.letterIds) p = learn(p, id);
  for (const id of cat.writableLetterIds) p = learn(p, writingCardId(id));
  // ...knows every word
  for (const item of [...ITEMS, ...FREQUENCY_ITEMS]) p = learn(p, item.id);
  // ...and has been everywhere
  p = {
    ...p,
    completedLessons: ["l1"],
    completedScenarios: Array.from({ length: cat.scenarioCount }, (_, i) => `s${i}`),
    completedGrammar: Array.from({ length: cat.conceptCount }, (_, i) => `c${i}`),
    typedWords: Array.from({ length: 10 }, (_, i) => `w${i}`),
    name: "Smita",
    nameGujarati: transliterateRoman("smita"),
  };

  const full = milestoneCatalog(p);
  const earned = new Set(earnedMilestoneIds(p, full));
  for (const m of MILESTONES) {
    const s = milestoneStates(p, full).find((x) => x.milestone.id === m.id)!;
    expect(
      `${m.id}: unreachable — done everything and still not earned`,
      earned.has(m.id),
      s.blocked ?? `${s.have}/${s.need}`,
    );
  }
  expect("nothing left to aim for", nextMilestone(p, full) === undefined);
  expect(
    "a finished learner has nothing to celebrate",
    uncelebrated(p, full).length === MILESTONES.length,
  );
}

// ── The name milestone: pending without a name, real with one ─────────────

{
  const noName = milestoneStates(blank, cat).find((s) => s.milestone.id === "your-name")!;
  expect("the name milestone measures a name we don't have", Boolean(noName.blocked));
  expect("a blocked milestone counts as earned", !noName.earned);

  const withName = { ...freshProgress(), nameGujarati: transliterateRoman("smita") };
  const catWith = milestoneCatalog(withName);
  expect(
    "a name yields no letters to write",
    catWith.nameLetterIds.length > 0,
    `${withName.nameGujarati}`,
  );
  const named = milestoneStates(withName, catWith).find((s) => s.milestone.id === "your-name")!;
  expect("the name milestone is still blocked with a name on file", !named.blocked);
  expect("a named learner has already written their name", !named.earned);

  // Every letter of a transliterated name has to be one we can teach, or the
  // milestone would sit at 4/5 forever with no way to move.
  for (const roman of ["smita", "harshal", "priya", "meera", "kavita", "jay", "ravi"]) {
    const ids = nameLetterIds(transliterateRoman(roman));
    expect(`"${roman}" has no writable letters`, ids.length > 0, transliterateRoman(roman));
    for (const id of ids) {
      expect(
        `"${roman}": ${id} has no stroke data`,
        cat.writableLetterIds.includes(id),
      );
    }
  }
}

// ── Celebration is once ───────────────────────────────────────────────────

{
  let p = { ...freshProgress(), completedLessons: ["l1"] };
  expect("finishing a lesson earns nothing", uncelebrated(p, cat).length === 1);
  p = { ...p, celebratedMilestones: ["first-lesson"] };
  expect("celebrated twice", uncelebrated(p, cat).length === 0);
}

// ── Report ────────────────────────────────────────────────────────────────

console.log(`Milestones           : ${MILESTONES.length}`);
console.log(
  `Content behind them  : ${cat.letterIds.length} letters (${cat.writableLetterIds.length} writable), ` +
    `${cat.lessonCount} lessons, ${cat.conceptCount} concepts, ${cat.scenarioCount} scenarios`,
);
console.log(`First one up         : ${nextMilestone(blank, cat)?.milestone.title}`);

if (failures.length) {
  console.error(`\n✗ ${failures.length} problem(s) in the journey:\n`);
  for (const f of failures.slice(0, 30)) console.error(`  ${f}`);
  if (failures.length > 30) console.error(`  …and ${failures.length - 30} more`);
  process.exit(1);
}

console.log(`\n✓ Every milestone is reachable, none is free, and the order holds.`);
