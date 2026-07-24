// ─────────────────────────────────────────────────────────────────────────
// Vaat Mode — scripted branching dialogue (free, offline, zero-hallucination).
//
// Every line is hand-authored so a beginner never hears wrong Gujarati. A
// pluggable provider (see lib/core/vaat.ts) lets us later swap in a free-tier
// LLM for open-ended chat without touching the UI.
//
// ✅ Lines & audio native-verified by the owner (raised in Gujarat) on 2026-07-24.
// ─────────────────────────────────────────────────────────────────────────

import type { Scenario } from "../core/types";

/** Chat with Ba — a warm first conversation reusing Unit 1 & 2 vocabulary. */
export const BA_SCENARIO: Scenario = {
  id: "ba-chai",
  character: "Ba",
  characterGuj: "બા",
  emoji: "👵🏽",
  title: "Chai with Ba",
  blurb: "Ba's happy to see you. Say hello, tell her your name, and stay for tea.",
  startNodeId: "n1",
  nodes: {
    n1: {
      id: "n1",
      line: {
        id: "ba-l1",
        gujarati: "કેમ છો, બેટા?",
        roman: "Kem cho, beta?",
        english: "How are you, dear?",
        note: "'Beta' is an affectionate 'dear/child'.",
        audio: "/audio/vaat/ba-l1.mp3",
      },
      choices: [
        {
          say: { id: "ba-c1a", gujarati: "મજામાં, આભાર!", roman: "Majaamã, aabhaar!", english: "I'm well, thank you!", audio: "/audio/vaat/ba-c1a.mp3" },
          next: "n2",
          feedback: "Perfect — warm and polite. 👌",
        },
        {
          say: { id: "ba-c1b", gujarati: "નમસ્તે બા!", roman: "Namaste Ba!", english: "Hello Ba!", audio: "/audio/vaat/ba-c1b.mp3" },
          next: "n2",
          feedback: "A lovely greeting back.",
        },
      ],
    },
    n2: {
      id: "n2",
      line: {
        id: "ba-l2",
        gujarati: "તમારું નામ શું છે?",
        roman: "Tamaaru naam shu chhe?",
        english: "What's your name?",
        audio: "/audio/vaat/ba-l2.mp3",
      },
      choices: [
        {
          say: { id: "ba-c2a", gujarati: "મારું નામ ... છે.", roman: "Maaru naam ... chhe.", english: "My name is ...", audio: "/audio/vaat/ba-c2a.mp3" },
          next: "n3",
          feedback: "Great — you introduced yourself!",
        },
      ],
    },
    n3: {
      id: "n3",
      line: {
        id: "ba-l3",
        gujarati: "મળીને આનંદ થયો! જમ્યા?",
        roman: "Malīne aanand thayo! Jamya?",
        english: "Nice to meet you! Have you eaten?",
        note: "Offering food is how Gujarati love is spoken. 🙂",
        audio: "/audio/vaat/ba-l3.mp3",
      },
      choices: [
        {
          say: { id: "ba-c3a", gujarati: "ના, ભૂખ લાગી છે.", roman: "Na, bhookh laagi chhe.", english: "No, I'm hungry.", audio: "/audio/vaat/ba-c3a.mp3" },
          next: "n4",
          feedback: "Say no more — Ba is already reaching for a thali. 😄",
        },
        {
          say: { id: "ba-c3b", gujarati: "હા, આભાર.", roman: "Ha, aabhaar.", english: "Yes, thank you.", audio: "/audio/vaat/ba-c3b.mp3" },
          next: "n4b",
          feedback: "Polite — but Ba will still offer chai!",
        },
      ],
    },
    n4: {
      id: "n4",
      line: {
        id: "ba-l4",
        gujarati: "લે, થાળી ખા. ચા જોઈએ છે?",
        roman: "Le, thaali khaa. Chaa joie chhe?",
        english: "Here, eat a thali. Would you like tea?",
        audio: "/audio/vaat/ba-l4.mp3",
      },
      choices: [
        {
          say: { id: "ba-c4a", gujarati: "હા, મને ચા જોઈએ છે.", roman: "Ha, mane chaa joie chhe.", english: "Yes, I'd like some tea.", audio: "/audio/vaat/ba-c4a.mp3" },
          next: "n5",
          feedback: "You just ordered chai in Gujarati. ☕",
        },
      ],
    },
    n4b: {
      id: "n4b",
      line: {
        id: "ba-l4b",
        gujarati: "તો થોડી ચા તો પી લે!",
        roman: "To thodi chaa to pi le!",
        english: "Then at least have a little tea!",
        audio: "/audio/vaat/ba-l4b.mp3",
      },
      choices: [
        {
          say: { id: "ba-c4ba", gujarati: "સારું, આભાર બા.", roman: "Saaru, aabhaar Ba.", english: "Alright, thank you Ba.", audio: "/audio/vaat/ba-c4ba.mp3" },
          next: "n5",
          feedback: "You can't out-hospitality a Gujarati Ba. 😌",
        },
      ],
    },
    n5: {
      id: "n5",
      line: {
        id: "ba-l5",
        gujarati: "સ્વાદિષ્ટ છે ને? બહુ સરસ!",
        roman: "Swaadisht chhe ne? Bahu saras!",
        english: "It's delicious, isn't it? Wonderful!",
        audio: "/audio/vaat/ba-l5.mp3",
      },
      choices: [
        {
          say: { id: "ba-c5a", gujarati: "હા, મને ભાવે છે!", roman: "Ha, mane bhaave chhe!", english: "Yes, I love it!", audio: "/audio/vaat/ba-c5a.mp3" },
          feedback: "🎉 You held a whole conversation with Ba. That's the goal.",
        },
      ],
    },
  },
};

export const SCENARIOS: Scenario[] = [BA_SCENARIO];
export const SCENARIOS_BY_ID: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);
