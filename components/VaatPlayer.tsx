"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DialogueChoice, LexItem, Scenario } from "@/lib/core/types";
import { defaultVaatProvider } from "@/lib/core/vaat";
import { useProgress } from "@/lib/client/useProgress";
import { playAudio } from "@/lib/client/speech";
import AudioButton from "./AudioButton";

interface VaatPlayerProps {
  scenario: Scenario;
}

interface ChatMessage {
  key: string;
  side: "character" | "learner";
  item: LexItem;
  feedback?: string;
}

export default function VaatPlayer({ scenario }: VaatPlayerProps) {
  const { completeScenario } = useProgress();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [choices, setChoices] = useState<DialogueChoice[]>([]);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const turn = defaultVaatProvider.start(scenario);
    setMessages([{ key: `${turn.node.line.id}-0`, side: "character", item: turn.node.line }]);
    setChoices(turn.choices);
    setDone(turn.done);
    void playAudio(turn.node.line.audio, turn.node.line.gujarati);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, choices]);

  function handleChoose(choice: DialogueChoice) {
    setMessages((prev) => [
      ...prev,
      { key: `${choice.say.id}-${prev.length}`, side: "learner", item: choice.say, feedback: choice.feedback },
    ]);
    setChoices([]);
    void playAudio(choice.say.audio, choice.say.gujarati);

    const turn = defaultVaatProvider.advance(scenario, choice);
    if (turn.done) {
      setDone(true);
      completeScenario(scenario.id);
      return;
    }
    setMessages((prev) => [
      ...prev,
      { key: `${turn.node.line.id}-${prev.length}`, side: "character", item: turn.node.line },
    ]);
    setChoices(turn.choices);
    void playAudio(turn.node.line.audio, turn.node.line.gujarati);
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col px-4 py-4">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/vaat" aria-label="Back to conversations" className="text-ink-soft">
          <span aria-hidden="true">←</span>
        </Link>
        <span className="text-2xl" aria-hidden="true">
          {scenario.emoji}
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">{scenario.title}</div>
          <div className="guj text-xs text-ink-soft">{scenario.characterGuj}</div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {messages.map((m) => (
          <div key={m.key} className={`flex ${m.side === "learner" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              <div
                className={`flex items-start gap-2 rounded-2xl px-4 py-3 shadow-[var(--shadow)] ${
                  m.side === "learner"
                    ? "rounded-br-sm bg-magenta text-on-accent"
                    : "rounded-bl-sm border border-line bg-surface text-ink"
                }`}
              >
                {m.side === "character" && (
                  <AudioButton src={m.item.audio} gujarati={m.item.gujarati} size="sm" />
                )}
                <div>
                  <div className="guj text-lg font-medium">{m.item.gujarati}</div>
                  <div className={`text-xs ${m.side === "learner" ? "text-on-accent/80" : "text-ink-soft"}`}>
                    {m.item.roman}
                  </div>
                  <div className={`text-xs ${m.side === "learner" ? "text-on-accent/80" : "text-ink-soft"}`}>
                    {m.item.english}
                  </div>
                </div>
                {m.side === "learner" && (
                  <AudioButton src={m.item.audio} gujarati={m.item.gujarati} size="sm" />
                )}
              </div>
              {m.feedback && (
                <p className="mt-1 px-2 text-right text-xs italic text-ink-soft">💬 {m.feedback}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!done && choices.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          {choices.map((choice) => (
            <button
              key={choice.say.id}
              type="button"
              onClick={() => handleChoose(choice)}
              className="rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
            >
              <div className="guj text-base font-medium text-ink">{choice.say.gujarati}</div>
              <div className="text-xs text-ink-soft">
                {choice.say.roman} — {choice.say.english}
              </div>
            </button>
          ))}
        </div>
      )}

      {done && (
        <div className="flex flex-col items-center gap-3 border-t border-line pt-4 text-center">
          <div className="text-4xl" aria-hidden="true">
            🎉
          </div>
          <p className="text-lg font-serif text-ink">Vaat complete! You held a real conversation.</p>
          <div className="flex w-full gap-2">
            <Link
              href="/vaat"
              className="flex-1 rounded-full border border-line bg-surface px-6 py-3 text-center text-sm font-semibold text-ink"
            >
              More conversations
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-full bg-marigold px-6 py-3 text-center text-sm font-semibold text-on-accent"
            >
              Back home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
