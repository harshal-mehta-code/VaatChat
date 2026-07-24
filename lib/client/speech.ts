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

// Only ever cache a *found* voice — never cache a null result, because
// getVoices() is populated asynchronously and returns [] on the first call in
// many browsers. Caching null there would permanently fall back to the wrong
// voice (a common cause of "odd pronunciation").
let cachedGuVoice: SpeechSynthesisVoice | null = null;

function pickGuVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  if (cachedGuVoice) return cachedGuVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // not loaded yet; try again next call
  const found =
    // Prefer a genuine Gujarati voice; among those, prefer a richer/neural one.
    voices.find((v) => v.lang?.toLowerCase().startsWith("gu") && /google|neural|natural|wavenet/i.test(v.name)) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith("gu")) ??
    // Hindi shares most phonology with Gujarati — a closer fallback than English.
    voices.find((v) => v.lang?.toLowerCase().startsWith("hi")) ??
    null;
  if (found) cachedGuVoice = found;
  return found;
}

// Refresh the cache when the browser finishes loading its voice list.
if (typeof window !== "undefined" && ttsSupported()) {
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedGuVoice = null;
      pickGuVoice();
    };
  } catch {
    /* noop */
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Single-owner playback: at most one sound at a time, and a new request always
// cleanly supersedes the previous one.
//
// `token` is what makes playback consistent. Every stopAudio() bumps it, so any
// callback still holding an older token knows it has been superseded and bows
// out silently — instead of (as a subtle earlier bug did) firing a stray TTS
// fallback that stops the sound the *newer* request just started. That race was
// exactly why a button tap sometimes played nothing: an in-flight autoplay's
// rejected play() promise would stomp the tap's audio.
// ─────────────────────────────────────────────────────────────────────────

let currentAudio: HTMLAudioElement | null = null;
let token = 0;

/** Stop whatever is playing (recorded audio and/or TTS) and invalidate any
 *  in-flight playback callbacks. */
export function stopAudio(): void {
  token++;
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      /* noop */
    }
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  if (ttsSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* noop */
    }
  }
}

/** Dispatch a TTS utterance, but only if `myToken` is still the active request.
 *  Assumes the caller already stopped previous playback. */
function speakNow(text: string, myToken: number, rate: number): void {
  if (!ttsSupported() || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  const v = pickGuVoice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? "gu-IN";
  u.rate = rate;
  // A tiny defer avoids a Chrome/mobile quirk where speak() right after
  // cancel() silently drops the utterance.
  window.setTimeout(() => {
    if (myToken !== token) return; // superseded — stay silent
    try {
      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
  }, 30);
}

/** Speak Gujarati text via the browser. Returns false if TTS is unavailable. */
export function speak(gujaratiText: string, rate = 0.85): boolean {
  if (!ttsSupported()) return false;
  stopAudio(); // interrupt anything already playing
  speakNow(gujaratiText, token, rate);
  return true;
}

/**
 * Play an item's audio: prefer the recorded file, fall back to TTS of the
 * Gujarati text ONLY if the file genuinely can't play. Resolves when playback
 * starts (or the fallback is dispatched). Safe to call rapidly — each call
 * cleanly supersedes the last, so the last tap always wins.
 */
export function playAudio(
  src: string | undefined,
  gujaratiFallback: string,
  rate = 0.85,
): Promise<void> {
  return new Promise((resolve) => {
    stopAudio(); // interrupt any in-progress clip so nothing overlaps
    const myToken = token;
    if (!src) {
      speakNow(gujaratiFallback, myToken, rate);
      resolve();
      return;
    }
    const a = new Audio(src);
    a.preload = "auto";
    currentAudio = a;
    a.onended = () => {
      if (currentAudio === a) currentAudio = null;
    };
    a.play()
      .then(() => resolve())
      .catch(() => {
        // A newer sound has taken over → this rejection is just our own
        // interruption; do nothing (don't stomp the newer sound).
        if (myToken !== token) {
          resolve();
          return;
        }
        // Genuine failure to play the file → fall back to TTS.
        if (currentAudio === a) currentAudio = null;
        speakNow(gujaratiFallback, myToken, rate);
        resolve();
      });
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
