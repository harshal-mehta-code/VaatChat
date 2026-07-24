// ─────────────────────────────────────────────────────────────────────────
// Batch audio generator.
//
// Produces the app's audio files from a neural TTS so pronunciation is smooth
// and consistent — a big step up from on-device browser TTS, and a good
// stand-in until human native recordings replace them file-for-file.
//
// Default provider: Google Cloud Text-to-Speech (genuine gu-IN neural voices).
// It reads the SAME content the app uses, so the two never drift.
//
// Usage:
//   node --experimental-strip-types scripts/generate-audio.ts --list      # dry run: list every file
//   GOOGLE_TTS_API_KEY=xxx node --experimental-strip-types scripts/generate-audio.ts
//   ...add --force to overwrite existing files.
//
// Voice override:  AUDIO_VOICE=gu-IN-Wavenet-B  (see cloud.google.com/text-to-speech/docs/voices)
//
// Swapping providers (Azure, ElevenLabs, …) means changing only `synthesize()`.
// ─────────────────────────────────────────────────────────────────────────

import { writeFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ITEMS } from "../lib/content/units.ts";
import { FREQUENCY_ITEMS } from "../lib/content/frequency.ts";
import { VOWELS, CONSONANTS, barakshariGrid } from "../lib/content/akshar.ts";
import { SCENARIOS } from "../lib/content/scenarios.ts";
import { barakshariAudioPath } from "../lib/content/audio-paths.ts";
import { GRAMMAR_MODULES } from "../lib/content/grammar.ts";

interface Clip {
  text: string; // Gujarati to speak
  out: string; // app path, e.g. "/audio/kem-cho.mp3"
  label: string; // for logs
}

/** Gather every audio clip the app references, straight from content. */
function collectClips(): Clip[] {
  const clips: Clip[] = [];
  const seen = new Set<string>();
  const add = (text: string, out: string | undefined, label: string) => {
    if (!out || seen.has(out)) return;
    seen.add(out);
    clips.push({ text, out, label });
  };

  for (const it of ITEMS) add(it.gujarati, it.audio, `word: ${it.roman}`);
  for (const it of FREQUENCY_ITEMS) add(it.gujarati, it.audio, `freq: ${it.roman}`);
  for (const a of [...VOWELS, ...CONSONANTS]) add(a.char, a.audio, `letter: ${a.roman}`);
  for (const { cells } of barakshariGrid()) {
    for (const cell of cells) add(cell.combined, barakshariAudioPath(cell), `barakshari: ${cell.roman}`);
  }
  for (const s of SCENARIOS) {
    for (const node of Object.values(s.nodes)) {
      add(node.line.gujarati, node.line.audio, `${s.character}: ${node.line.roman}`);
      for (const c of node.choices) add(c.say.gujarati, c.say.audio, `reply: ${c.say.roman}`);
    }
  }
  for (const mod of GRAMMAR_MODULES) {
    for (const concept of mod.concepts) {
      for (const ex of concept.discovery.examples) {
        add(ex.gujarati, ex.audio, `grammar: ${ex.roman}`);
      }
    }
  }
  return clips;
}

const VOICE = process.env.AUDIO_VOICE ?? "gu-IN-Wavenet-A";
const RATE = Number(process.env.AUDIO_RATE ?? "0.9");

/** Synthesize one clip → MP3 bytes. Change this function to swap providers. */
async function synthesize(text: string): Promise<Buffer> {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) throw new Error("GOOGLE_TTS_API_KEY is not set");
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "gu-IN", name: VOICE },
        audioConfig: { audioEncoding: "MP3", speakingRate: RATE },
      }),
    },
  );
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { audioContent: string };
  return Buffer.from(data.audioContent, "base64");
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
  const args = new Set(process.argv.slice(2));
  const listOnly = args.has("--list");
  const force = args.has("--force");

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const publicDir = path.join(root, "public");
  const clips = collectClips();

  console.log(`Found ${clips.length} audio clips referenced by the app.\n`);

  if (listOnly) {
    for (const c of clips) console.log(`  ${c.out.padEnd(34)} ${c.text}   (${c.label})`);
    console.log(`\nDry run only. Set GOOGLE_TTS_API_KEY and re-run (without --list) to generate.`);
    return;
  }

  if (!process.env.GOOGLE_TTS_API_KEY) {
    console.error("✗ GOOGLE_TTS_API_KEY not set. Get a key from Google Cloud (Text-to-Speech API),");
    console.error("  then: GOOGLE_TTS_API_KEY=xxx node --experimental-strip-types scripts/generate-audio.ts");
    console.error("  Or run with --list to preview what would be generated.");
    process.exit(1);
  }

  let made = 0;
  let skipped = 0;
  for (const c of clips) {
    const dest = path.join(publicDir, c.out);
    if (!force && (await exists(dest))) {
      skipped++;
      continue;
    }
    await mkdir(path.dirname(dest), { recursive: true });
    try {
      const bytes = await synthesize(c.text);
      await writeFile(dest, bytes);
      made++;
      console.log(`  ✓ ${c.out}`);
    } catch (err) {
      console.error(`  ✗ ${c.out} — ${(err as Error).message}`);
    }
  }
  console.log(`\nDone. Generated ${made}, skipped ${skipped} (already existed).`);
  console.log(`Voice: ${VOICE} @ rate ${RATE}. Files land in public/ and play automatically.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
