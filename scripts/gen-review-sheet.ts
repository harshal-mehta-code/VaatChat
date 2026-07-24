// ─────────────────────────────────────────────────────────────────────────
// Native-verification review sheet generator.
//
// Emits a single self-contained page — public/content-review.html — listing
// EVERY piece of Gujarati content in the app, grouped by area, with its audio
// playable inline. A native speaker opens it on the deployed app
// (https://<deploy>/content-review.html) or locally via `npm run start`, hears
// each clip, and flags anything wrong. Flags + notes persist in the browser
// (localStorage) and export as plain text to paste back.
//
// Audio uses the app's own absolute /audio/* paths, so it plays same-origin
// wherever the page is served — no CSP or cross-host issues.
//
//   node --experimental-strip-types scripts/gen-review-sheet.ts
//   (aliased as `npm run gen:review`)
// ─────────────────────────────────────────────────────────────────────────

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ITEMS, UNITS } from "../lib/content/units.ts";
import { FREQUENCY_ITEMS, FREQ_TIER_SIZE } from "../lib/content/frequency.ts";
import { VOWELS, CONSONANTS, barakshariGrid } from "../lib/content/akshar.ts";
import { SCENARIOS } from "../lib/content/scenarios.ts";
import { GRAMMAR_MODULES, grammarAudioPath } from "../lib/content/grammar.ts";
import { barakshariAudioPath } from "../lib/content/audio-paths.ts";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let rowCount = 0;

/** One reviewable line: big Gujarati, roman, English, optional context + audio. */
function row(opts: {
  id: string;
  guj: string;
  roman?: string;
  eng?: string;
  extra?: string;
  audio?: string;
}): string {
  rowCount++;
  const { id, guj, roman = "", eng = "", extra = "", audio } = opts;
  const player = audio
    ? `<audio preload="none" controls src="${esc(audio)}"></audio>`
    : `<span class="noaudio">— no audio —</span>`;
  return `<tr data-row="${esc(id)}">
    <td class="play">${player}</td>
    <td class="guj">${esc(guj)}</td>
    <td class="roman">${esc(roman)}</td>
    <td class="eng">${esc(eng)}${extra ? `<div class="extra">${esc(extra)}</div>` : ""}</td>
    <td class="verdict">
      <button type="button" class="ok" data-v="ok" title="Looks right">✓</button>
      <button type="button" class="bad" data-v="bad" title="Needs fixing">✗</button>
      <input type="text" class="note" placeholder="correction / note" />
    </td>
  </tr>`;
}

function tableOpen(): string {
  return `<table><thead><tr>
    <th>Audio</th><th>Gujarati</th><th>Roman</th><th>English / context</th><th>Verdict</th>
  </tr></thead><tbody>`;
}
const tableClose = "</tbody></table>";

function section(title: string, subtitle: string, body: string, open = true): string {
  return `<details ${open ? "open" : ""}><summary><span class="stitle">${esc(
    title,
  )}</span> <span class="ssub">${esc(subtitle)}</span></summary>${body}</details>`;
}

// ── Build the sheet body ─────────────────────────────────────────────────────
const parts: string[] = [];

// Vocab, grouped by unit.
for (const unit of [...UNITS].sort((a, b) => a.order - b.order)) {
  const tag = `u${unit.order}`;
  const items = ITEMS.filter((i) => i.tags?.includes(tag));
  const rows = items
    .map((i) => row({ id: i.id, guj: i.gujarati, roman: i.roman, eng: i.english, extra: i.note, audio: i.audio }))
    .join("");
  parts.push(
    section(
      `Unit ${unit.order}: ${unit.title}`,
      `${unit.gujaratiTitle} · ${items.length} words`,
      tableOpen() + rows + tableClose,
    ),
  );
}

// Frequency bank, grouped by tier.
{
  const tiers = new Map<string, typeof FREQUENCY_ITEMS>();
  FREQUENCY_ITEMS.forEach((it, idx) => {
    const t = `Tier ${Math.floor(idx / FREQ_TIER_SIZE) + 1}`;
    (tiers.get(t) ?? tiers.set(t, []).get(t)!).push(it);
  });
  const body = [...tiers.entries()]
    .map(
      ([t, items]) =>
        `<h3 class="grp">${esc(t)}</h3>` +
        tableOpen() +
        items.map((i) => row({ id: i.id, guj: i.gujarati, roman: i.roman, eng: i.english, extra: i.note, audio: i.audio })).join("") +
        tableClose,
    )
    .join("");
  parts.push(section("Core words (frequency bank)", `${FREQUENCY_ITEMS.length} high-frequency words`, body));
}

// Akshar — vowels + consonants.
{
  const letterRows = (arr: typeof VOWELS) =>
    tableOpen() +
    arr
      .map((a) => row({ id: `akshar-${a.id}`, guj: a.char, roman: a.roman, eng: a.sound, extra: `mnemonic: ${a.mnemonic}`, audio: a.audio }))
      .join("") +
    tableClose;
  parts.push(
    section(
      "Akshar — letters",
      `${VOWELS.length} vowels · ${CONSONANTS.length} consonants`,
      `<h3 class="grp">Vowels (સ્વર)</h3>${letterRows(VOWELS)}<h3 class="grp">Consonants (વ્યંજન)</h3>${letterRows(CONSONANTS)}`,
    ),
  );
}

// Barakshari — big, collapsed by default.
{
  const grid = barakshariGrid();
  const total = grid.reduce((n, r) => n + r.cells.length, 0);
  const body = grid
    .map(
      (r) =>
        `<h3 class="grp">${esc(r.consonant.char)} (${esc(r.consonant.roman)})</h3>` +
        tableOpen() +
        r.cells
          .map((c) => row({ id: `bk-${c.consonantId}-${c.vowelId}`, guj: c.combined, roman: c.roman, audio: barakshariAudioPath(c) }))
          .join("") +
        tableClose,
    )
    .join("");
  parts.push(section("Barakshari — consonant × vowel grid", `${total} combined syllables (systematic — spot-check)`, body, false));
}

// Grammar — rules, contrasts, and discovery examples all reviewable.
for (const mod of [...GRAMMAR_MODULES].sort((a, b) => a.order - b.order)) {
  const conceptBlocks = mod.concepts
    .map((c) => {
      const exRows = c.discovery.examples
        .map((ex, i) => row({ id: grammarAudioPath(c.id, i), guj: ex.gujarati, roman: ex.roman, eng: ex.english, extra: ex.note, audio: ex.audio }))
        .join("");
      const prose =
        row({ id: `rule-${c.id}`, guj: "— RULE —", eng: c.discovery.rule }) +
        (c.contrast ? row({ id: `contrast-${c.id}`, guj: "— CONTRAST —", eng: c.contrast }) : "");
      return `<h3 class="grp">${esc(c.title)} <span class="ssub">${esc(c.blurb)}</span></h3>` + tableOpen() + exRows + prose + tableClose;
    })
    .join("");
  parts.push(section(`Vyakaran: ${mod.title}`, `${mod.gujaratiTitle} · ${mod.concepts.length} concepts`, conceptBlocks, false));
}

// Vaat — scenario lines + learner replies.
for (const s of SCENARIOS) {
  const rows: string[] = [];
  for (const node of Object.values(s.nodes)) {
    rows.push(row({ id: `sc-${s.id}-${node.id}`, guj: node.line.gujarati, roman: node.line.roman, eng: `${s.character}: ${node.line.english}`, audio: node.line.audio }));
    node.choices.forEach((ch, i) =>
      rows.push(row({ id: `sc-${s.id}-${node.id}-c${i}`, guj: ch.say.gujarati, roman: ch.say.roman, eng: `↳ you: ${ch.say.english}`, audio: ch.say.audio })),
    );
  }
  parts.push(section(`Vaat: ${s.title}`, `${s.emoji} ${s.character} (${s.characterGuj})`, tableOpen() + rows.join("") + tableClose, false));
}

const body = parts.join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>VaatChat — Content Review Sheet (DRAFT)</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 1rem; line-height: 1.4; max-width: 1100px; margin-inline: auto; }
  .banner { background: #fff3cd; color: #664d03; border: 1px solid #ffe69c; border-radius: 10px; padding: .75rem 1rem; font-size: .9rem; }
  @media (prefers-color-scheme: dark) { .banner { background: #3a2f00; color: #ffe08a; border-color: #6b5600; } }
  h1 { font-size: 1.5rem; margin: .5rem 0; }
  .tools { position: sticky; top: 0; z-index: 5; background: Canvas; padding: .6rem 0; border-bottom: 1px solid #8884; display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; }
  .tools button, .tools label { font-size: .85rem; padding: .35rem .7rem; border: 1px solid #8886; border-radius: 999px; background: transparent; cursor: pointer; }
  .count { font-weight: 600; }
  details { margin: .5rem 0; border: 1px solid #8883; border-radius: 12px; overflow: hidden; }
  summary { cursor: pointer; padding: .7rem 1rem; background: #8881; font-size: 1.05rem; }
  .stitle { font-weight: 700; }
  .ssub { color: #8886; font-weight: 400; font-size: .85em; }
  h3.grp { margin: 1rem 1rem .3rem; font-size: .95rem; color: #8887; }
  table { width: 100%; border-collapse: collapse; font-size: .95rem; }
  th, td { text-align: left; padding: .45rem .6rem; border-top: 1px solid #8882; vertical-align: middle; }
  th { font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; color: #8887; }
  td.guj { font-size: 1.5rem; white-space: nowrap; }
  td.roman { color: #8888; font-style: italic; white-space: nowrap; }
  td.eng { min-width: 12rem; }
  .extra { font-size: .8rem; color: #8887; margin-top: .15rem; }
  td.play audio { height: 32px; width: 150px; }
  .noaudio { font-size: .75rem; color: #c0392b; }
  td.verdict { white-space: nowrap; }
  .verdict button { font-size: 1rem; width: 2rem; height: 2rem; border: 1px solid #8885; border-radius: 8px; background: transparent; cursor: pointer; margin-right: .2rem; }
  .verdict input.note { width: 12rem; padding: .3rem .4rem; border: 1px solid #8884; border-radius: 8px; background: transparent; color: inherit; }
  tr.v-ok { background: #2ecc7115; }
  tr.v-bad { background: #e74c3c18; }
  tr.v-ok .ok { background: #2ecc71; color: #fff; border-color: #2ecc71; }
  tr.v-bad .bad { background: #e74c3c; color: #fff; border-color: #e74c3c; }
  .hidden { display: none; }
</style>
</head>
<body>
  <h1>VaatChat — Content Review Sheet</h1>
  <div class="banner">
    <strong>⚠️ DRAFT — everything here is an AI-drafted first pass.</strong>
    Play each clip and read each line. Tap <strong>✓</strong> if it's correct, <strong>✗</strong> if the
    Gujarati, romanization, meaning, or audio needs fixing — and type the fix in the note box.
    Your marks are saved in this browser. When done, hit <em>“Copy all issues”</em> and paste them back.
    ${rowCount} items total.
  </div>
  <div class="tools">
    <span class="count" id="progress"></span>
    <button type="button" id="filter-todo">Show only un-reviewed</button>
    <button type="button" id="filter-bad">Show only flagged (✗)</button>
    <button type="button" id="filter-all">Show all</button>
    <button type="button" id="copy">📋 Copy all issues</button>
    <button type="button" id="reset">Reset marks</button>
  </div>
  ${body}
<script>
(function () {
  var KEY = "vaatchat.review.v1";
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}

  var rows = Array.prototype.slice.call(document.querySelectorAll("tr[data-row]"));

  function apply(tr) {
    var id = tr.getAttribute("data-row");
    var s = state[id] || {};
    tr.classList.toggle("v-ok", s.v === "ok");
    tr.classList.toggle("v-bad", s.v === "bad");
    var note = tr.querySelector("input.note");
    if (note && document.activeElement !== note) note.value = s.note || "";
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); progress(); }
  function progress() {
    var done = rows.filter(function (tr) { var s = state[tr.getAttribute("data-row")]; return s && s.v; }).length;
    var bad = rows.filter(function (tr) { var s = state[tr.getAttribute("data-row")]; return s && s.v === "bad"; }).length;
    document.getElementById("progress").textContent = done + "/" + rows.length + " reviewed · " + bad + " flagged";
  }

  rows.forEach(function (tr) {
    var id = tr.getAttribute("data-row");
    apply(tr);
    tr.querySelectorAll(".verdict button").forEach(function (b) {
      b.addEventListener("click", function () {
        state[id] = state[id] || {};
        state[id].v = state[id].v === b.getAttribute("data-v") ? null : b.getAttribute("data-v");
        apply(tr); save();
      });
    });
    var note = tr.querySelector("input.note");
    if (note) note.addEventListener("input", function () { state[id] = state[id] || {}; state[id].note = note.value; save(); });
  });

  function setFilter(fn) { rows.forEach(function (tr) { tr.classList.toggle("hidden", !fn(tr)); }); }
  document.getElementById("filter-todo").onclick = function () { setFilter(function (tr) { var s = state[tr.getAttribute("data-row")]; return !(s && s.v); }); };
  document.getElementById("filter-bad").onclick = function () { setFilter(function (tr) { var s = state[tr.getAttribute("data-row")]; return s && s.v === "bad"; }); };
  document.getElementById("filter-all").onclick = function () { setFilter(function () { return true; }); };

  document.getElementById("copy").onclick = function () {
    var lines = rows.filter(function (tr) { var s = state[tr.getAttribute("data-row")]; return s && (s.v === "bad" || s.note); })
      .map(function (tr) {
        var id = tr.getAttribute("data-row");
        var s = state[id];
        var guj = tr.querySelector(".guj").textContent.trim();
        var eng = tr.querySelector(".eng").textContent.trim();
        return "[" + (s.v === "bad" ? "FIX" : "note") + "] " + id + "  " + guj + " — " + eng + (s.note ? "  →  " + s.note : "");
      });
    var text = lines.length ? lines.join("\\n") : "No issues flagged.";
    navigator.clipboard.writeText(text).then(function () { alert("Copied " + lines.length + " issue(s) to clipboard."); },
      function () { prompt("Copy the issues below:", text); });
  };
  document.getElementById("reset").onclick = function () {
    if (!confirm("Clear all your review marks?")) return;
    state = {}; save(); rows.forEach(apply);
  };
  progress();
})();
</script>
</body>
</html>`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "content-review.html");
await writeFile(out, html, "utf8");
console.log(`✓ Wrote ${rowCount} reviewable rows → public/content-review.html`);
console.log(`  Open it on the deployed app at /content-review.html, or run \`npm run start\` and visit http://localhost:3000/content-review.html`);
