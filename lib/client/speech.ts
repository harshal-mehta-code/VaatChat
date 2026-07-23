"use client";

// ─────────────────────────────────────────────────────────────────────────
// Audio + speech helpers (browser, free).
//  - playItem(): play native-recorded audio if present, else Web Speech TTS.
//  - speak():    Web Speech synthesis in Gujarati (gu-IN) with graceful
//                fallback when no Gujarati voice is installed.
//  - listenOnce(): one-shot speech recognition for "say it back" exercises.
//
// All of this is best-effort: Gujarati TTS/STT support varies by browser/OS,
// so callers must handle the "unsupported" path (self-compare with audio).
// The iOS app will replace these with Apple's on-device Speech + AVSpeech.
// ─────────────────────────────────────────────────────────────────────────

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function sttSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

let cachedGuVoice: SpeechSynthesisVoice | null | undefined;

function guVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  if (cachedGuVoice !== undefined) return cachedGuVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedGuVoice =
    voices.find((v) => v.lang?.toLowerCase().startsWith("gu")) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith("hi")) ?? // Hindi is a closer fallback than English
    null;
  return cachedGuVoice;
}

/** Speak Gujarati text via the browser. Returns false if TTS is unavailable. */
export function speak(gujaratiText: string, rate = 0.9): boolean {
  if (!ttsSupported()) return false;
  const u = new SpeechSynthesisUtterance(gujaratiText);
  const v = guVoice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? "gu-IN";
  u.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

/**
 * Play an item's audio: prefer the recorded file, fall back to TTS of the
 * Gujarati text. Resolves when playback starts (or TTS is dispatched).
 */
export function playAudio(src: string | undefined, gujaratiFallback: string): Promise<void> {
  return new Promise((resolve) => {
    if (src) {
      const a = new Audio(src);
      a.play()
        .then(() => resolve())
        .catch(() => {
          // File missing (placeholder) → TTS fallback.
          speak(gujaratiFallback);
          resolve();
        });
      return;
    }
    speak(gujaratiFallback);
    resolve();
  });
}

export interface ListenResult {
  transcript: string;
  supported: boolean;
}

/** One-shot Gujarati speech recognition. Resolves with the transcript. */
export function listenOnce(timeoutMs = 6000): Promise<ListenResult> {
  return new Promise((resolve) => {
    if (!sttSupported()) {
      resolve({ transcript: "", supported: false });
      return;
    }
    const Ctor =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition })
        .webkitSpeechRecognition;
    if (!Ctor) {
      resolve({ transcript: "", supported: false });
      return;
    }
    const rec = new Ctor();
    rec.lang = "gu-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let settled = false;
    const done = (transcript: string) => {
      if (settled) return;
      settled = true;
      try {
        rec.stop();
      } catch {
        /* noop */
      }
      resolve({ transcript, supported: true });
    };
    rec.onresult = (e: SpeechRecognitionEvent) => done(e.results[0]?.[0]?.transcript ?? "");
    rec.onerror = () => done("");
    rec.onend = () => done("");
    setTimeout(() => done(""), timeoutMs);
    try {
      rec.start();
    } catch {
      resolve({ transcript: "", supported: false });
    }
  });
}
