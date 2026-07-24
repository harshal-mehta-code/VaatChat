// ─────────────────────────────────────────────────────────────────────────
// Audio integrity check — guarantees every audio path the app references
// actually exists in public/. Run it after adding content so an audio button is
// never wired to a track that isn't there (which would silently fall back to
// browser TTS and, on many devices, play nothing).
//
//   npm run check:audio
//
// Exits non-zero and lists any missing files.
// ─────────────────────────────────────────────────────────────────────────

import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ITEMS } from "../lib/content/units.ts";
import { FREQUENCY_ITEMS } from "../lib/content/frequency.ts";
import { VOWELS, CONSONANTS, barakshariGrid } from "../lib/content/akshar.ts";
import { SCENARIOS } from "../lib/content/scenarios.ts";
import { barakshariAudioPath } from "../lib/content/audio-paths.ts";
import { GRAMMAR_MODULES } from "../lib/content/grammar.ts";

interface Ref {
  audio: string;
  label: string;
}

/** Every audio path the app can reference, straight from content. */
function collectRefs(): Ref[] {
  const refs: Ref[] = [];
  const add = (audio: string | undefined, label: string) => {
    if (audio) refs.push({ audio, label });
  };

  for (const it of ITEMS) add(it.audio, `word: ${it.roman}`);
  for (const it of FREQUENCY_ITEMS) add(it.audio, `freq: ${it.roman}`);
  for (const a of [...VOWELS, ...CONSONANTS]) add(a.audio, `letter: ${a.roman}`);
  for (const { cells } of barakshariGrid()) {
    for (const cell of cells) add(barakshariAudioPath(cell), `barakshari: ${cell.roman}`);
  }
  for (const s of SCENARIOS) {
    for (const node of Object.values(s.nodes)) {
      add(node.line.audio, `${s.character}: ${node.line.roman}`);
      for (const c of node.choices) add(c.say.audio, `reply: ${c.say.roman}`);
    }
  }
  for (const mod of GRAMMAR_MODULES) {
    for (const concept of mod.concepts) {
      for (const ex of concept.discovery.examples) add(ex.audio, `grammar: ${ex.roman}`);
    }
  }
  return refs;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const publicDir = path.join(root, "public");
  const refs = collectRefs();

  const missing: Ref[] = [];
  for (const ref of refs) {
    if (!(await exists(path.join(publicDir, ref.audio)))) missing.push(ref);
  }

  if (missing.length === 0) {
    console.log(`✓ All ${refs.length} referenced audio files exist.`);
    return;
  }

  console.error(`✗ ${missing.length} of ${refs.length} referenced audio files are MISSING:\n`);
  for (const m of missing) console.error(`  ${m.audio.padEnd(36)} (${m.label})`);
  console.error(`\nGenerate them with: npm run gen:audio  (needs GOOGLE_TTS_API_KEY)`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
