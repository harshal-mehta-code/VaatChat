// ─────────────────────────────────────────────────────────────────────────
// Vaat Mode provider interface — the swap point for conversation backends.
//
//   scripted (MVP, free & safe)  →  free-tier LLM (Gemini/Groq)  →  Apple
//   on-device + optional Claude (iOS).
//
// The UI talks only to this interface, so upgrading the "brain" never touches
// the screens. MVP ships the scripted provider; an LLM provider can implement
// the same shape behind a serverless route later.
// ─────────────────────────────────────────────────────────────────────────

import type { DialogueChoice, DialogueNode, Scenario } from "./types";

export interface VaatTurn {
  node: DialogueNode;
  /** Choices the learner can say next. Empty → conversation complete. */
  choices: DialogueChoice[];
  done: boolean;
}

export interface VaatProvider {
  /** Human label for debugging / settings. */
  readonly name: string;
  /** Begin a scenario; returns the opening turn. */
  start(scenario: Scenario): VaatTurn;
  /** Advance from a node given the learner's chosen reply. */
  advance(scenario: Scenario, choice: DialogueChoice): VaatTurn;
}

/** The free, offline, zero-hallucination default: walk the authored tree. */
export class ScriptedVaatProvider implements VaatProvider {
  readonly name = "scripted";

  start(scenario: Scenario): VaatTurn {
    const node = scenario.nodes[scenario.startNodeId];
    return { node, choices: node.choices, done: node.choices.length === 0 };
  }

  advance(scenario: Scenario, choice: DialogueChoice): VaatTurn {
    if (!choice.next) {
      // Terminal choice — reuse the current node shape but mark complete.
      const node = scenario.nodes[scenario.startNodeId];
      return { node, choices: [], done: true };
    }
    const node = scenario.nodes[choice.next];
    return { node, choices: node.choices, done: node.choices.length === 0 };
  }
}

export const defaultVaatProvider: VaatProvider = new ScriptedVaatProvider();
