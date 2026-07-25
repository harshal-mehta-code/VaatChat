// ─────────────────────────────────────────────────────────────────────────
// Derived-drill check — is the generated grammar practice actually safe?
//
//   npm run check:drills
//
// lib/core/grammar-drills.ts turns each concept's three authored drills into
// nine or twelve by recombining its own native-verified examples. The whole
// approach rests on one property:
//
//   **Every Gujarati string shown to a learner was authored and reviewed.**
//
// Nothing composed, nothing inflected, nothing guessed. That's a claim a
// comment can make and quietly stop being true, so this asserts it directly:
// every option, every tile, every frame is checked back against the strings the
// concept actually declares. A generator that started inventing morphology
// would fail here rather than teach someone a form nobody writes.
//
// Then the ordinary structural things — one right answer, a gap you can fill,
// tiles that reassemble into the sentence they came from — plus enough drills
// per concept that a sitting is never short and never the same twice.
// ─────────────────────────────────────────────────────────────────────────

import {
  BLANK,
  derivedDrills,
  siblingHighlights,
  verifiedStrings,
} from "../lib/core/grammar-drills.ts";
import { makeRng, shuffled } from "../lib/core/variation.ts";
import { GRAMMAR_MODULES } from "../lib/content/grammar.ts";

/** Must match DRILLS_PER_SESSION in components/GrammarRunner.tsx. */
const DRILLS_PER_SESSION = 5;

const failures: string[] = [];
function expect(label: string, ok: boolean, detail = "") {
  if (!ok) failures.push(detail ? `${label} — ${detail}` : label);
}

let derived = 0;
let authored = 0;
const perKind: Record<string, number> = {};

for (const module of GRAMMAR_MODULES) {
  for (const concept of module.concepts) {
    const siblings = siblingHighlights(module, concept.id);
    const drills = derivedDrills(concept, siblings);
    const allowed = verifiedStrings(concept, siblings);
    const sentences = new Set(concept.discovery.examples.map((e) => e.gujarati));
    const meaningOf = new Map(concept.discovery.examples.map((e) => [e.gujarati, e.english]));

    authored += concept.exercises.length;
    derived += drills.length;

    const pool = [...concept.exercises, ...drills];
    const ids = pool.map((d) => d.id);
    expect(`${concept.id}: duplicate drill ids`, new Set(ids).size === ids.length);
    expect(
      `${concept.id}: not enough drills for a session`,
      pool.length >= DRILLS_PER_SESSION,
      `${pool.length} < ${DRILLS_PER_SESSION}`,
    );

    // A sitting must be able to differ from the last one.
    const sittings = new Set(
      ["s1", "s2", "s3", "s4", "s5", "s6"].map((s) =>
        shuffled(pool, makeRng(s)).slice(0, DRILLS_PER_SESSION).map((d) => d.id).sort().join("|"),
      ),
    );
    expect(`${concept.id}: every sitting draws the same drills`, sittings.size >= 3, `${sittings.size}`);

    for (const drill of drills) {
      perKind[drill.kind] = (perKind[drill.kind] ?? 0) + 1;
      const at = `${drill.id}`;

      if (drill.kind === "build") {
        const answer = drill.answer ?? [];
        const roman = drill.answerRoman ?? [];
        expect(`${at}: tiles and romanization disagree`, answer.length === roman.length);
        expect(`${at}: too few tiles`, answer.length >= 3, `${answer.length}`);
        expect(`${at}: repeated tile makes grading ambiguous`, new Set(answer).size === answer.length);
        // The only safe answer is a sentence somebody wrote and checked.
        expect(
          `${at}: reassembles into a sentence that was never authored`,
          sentences.has(answer.join(" ")),
          answer.join(" "),
        );
        for (const t of answer) {
          expect(`${at}: tile "${t}" isn't from a verified example`, allowed.has(t));
        }
        expect(`${at}: no English prompt`, Boolean(drill.english));
        continue;
      }

      // choose / cloze
      const options = drill.options ?? [];
      expect(`${at}: too few options`, options.length >= 3, `${options.length}`);
      expect(
        `${at}: not exactly one correct option`,
        options.filter((o) => o.correct).length === 1,
        `${options.filter((o) => o.correct).length}`,
      );
      const texts = options.map((o) => o.text);
      expect(`${at}: duplicate options`, new Set(texts).size === texts.length, texts.join(" / "));
      for (const t of texts) {
        expect(`${at}: option "${t}" isn't from a verified example`, allowed.has(t));
      }

      if (drill.kind === "cloze") {
        const frame = drill.frame ?? "";
        expect(`${at}: frame has no gap`, frame.includes(BLANK));
        expect(
          `${at}: frame has more than one gap`,
          frame.split(BLANK).length === 2,
          frame,
        );
        // Filling the gap with the right answer has to give back the exact
        // sentence it was cut from — that's the whole safety argument.
        const correct = options.find((o) => o.correct)!;
        expect(
          `${at}: filling the gap doesn't reproduce a verified sentence`,
          sentences.has(frame.replace(BLANK, correct.text)),
          frame.replace(BLANK, correct.text),
        );
        // ...and no *wrong* option may produce something that means the same
        // thing, or the drill would have two right answers.
        //
        // Note it's meaning, not well-formedness. છોકરો, છોકરી and છોકરું are
        // all real words, and all three fit "છોક___" — the English is what
        // picks one, and having to read it is the lesson. A distractor that
        // makes no word at all would be the weaker drill, not the safer one.
        for (const o of options) {
          if (o.correct) continue;
          expect(
            `${at}: distractor "${o.text}" means the same as the answer`,
            meaningOf.get(frame.replace(BLANK, o.text)) !== drill.english,
            frame.replace(BLANK, o.text),
          );
        }
        expect(`${at}: no English to disambiguate the gap`, Boolean(drill.english));
      }

      expect(`${at}: no prompt`, Boolean(drill.prompt));
      expect(`${at}: no explanation`, Boolean(drill.explain));
    }
  }
}

// Nothing in a derived drill may be Latin text masquerading as Gujarati.
const GUJARATI = /[઀-૿]/;
for (const module of GRAMMAR_MODULES) {
  for (const concept of module.concepts) {
    for (const drill of derivedDrills(concept, siblingHighlights(module, concept.id))) {
      for (const o of drill.options ?? []) {
        expect(`${drill.id}: option "${o.text}" isn't Gujarati`, GUJARATI.test(o.text));
      }
      for (const t of drill.answer ?? []) {
        expect(`${drill.id}: tile "${t}" isn't Gujarati`, GUJARATI.test(t));
      }
    }
  }
}

const concepts = GRAMMAR_MODULES.flatMap((m) => m.concepts);
console.log(`Concepts             : ${concepts.length}`);
console.log(
  `Drills               : ${authored} authored + ${derived} derived = ${authored + derived} (${(
    (authored + derived) / concepts.length
  ).toFixed(1)} per concept, ${DRILLS_PER_SESSION} shown per sitting)`,
);
console.log(
  `By kind (derived)    : ${Object.entries(perKind)
    .map(([k, n]) => `${k} ${n}`)
    .join(", ")}`,
);

if (failures.length) {
  console.error(`\n✗ ${failures.length} problem(s) in the derived drills:\n`);
  for (const f of failures.slice(0, 30)) console.error(`  ${f}`);
  if (failures.length > 30) console.error(`  …and ${failures.length - 30} more`);
  process.exit(1);
}

console.log(`\n✓ Every generated drill is built from Gujarati somebody authored and checked.`);
