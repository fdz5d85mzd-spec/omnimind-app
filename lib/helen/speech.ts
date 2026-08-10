import { getMuted } from "./data/settingsRepo";
import type { LangCode } from "./i18n/types";

export const BCP47: Record<LangCode, string> = {
  el: "el-GR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  ru: "ru-RU",
  tr: "tr-TR",
  ar: "ar-SA",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
  hi: "hi-IN",
  pl: "pl-PL",
  nl: "nl-NL",
  sv: "sv-SE",
  ro: "ro-RO",
};

/**
 * iOS Safari (and some other mobile browsers) only allow speechSynthesis to
 * start if speak() has already been called at least once synchronously
 * inside a real user gesture (tap/click) — calling it for the first time
 * after an `await fetch(...)` (as our AI reply flow does) gets silently
 * blocked. Call this once, synchronously, from the very first tap anywhere
 * in the app to "prime" the engine for the rest of the session.
 */
export function unlockSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  if (synth.paused) synth.resume();
  // Speaking then immediately cancelling (same tick, before audio hardware
  // engages) is the standard iOS Safari unlock trick — a volume:0 utterance
  // alone isn't enough, WebKit needs a real speak() call inside the gesture.
  const utter = new SpeechSynthesisUtterance(" ");
  synth.speak(utter);
  synth.cancel();
}

/**
 * Speaks a line out loud as the creature's voice (Web Speech API — free,
 * no backend, no API key). Pitched up and sped up slightly for a small,
 * playful character voice. No-op if muted or unsupported.
 */
export function speakAsCreature(text: string, lang: LangCode) {
  if (getMuted()) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  if (synth.paused) synth.resume();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = BCP47[lang] ?? "en-US";
  // A big pitch shift reads as a cute character voice on the higher-quality
  // English default OS voices, but most non-English default voices (Greek
  // included) are lower-fidelity to begin with and turn squeaky/robotic
  // under the same shift — keep it much closer to natural for those.
  utter.pitch = lang === "en" ? 1.6 : 1.15;
  utter.rate = lang === "en" ? 1.05 : 1.0;
  utter.volume = 0.85;
  // A brief delay after cancel() avoids a well-known WebKit race where a
  // speak() called in the very same tick as cancel() is silently dropped.
  window.setTimeout(() => synth.speak(utter), 60);
}

let creatureAudioEl: HTMLAudioElement | null = null;
let creatureAudioUrl: string | null = null;

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  return new Blob([byteNumbers], { type: mimeType });
}

/**
 * Plays a base64-encoded MP3 (from the server-side ElevenLabs TTS call) as
 * the creature's real voice. Uses a Blob object URL rather than a `data:`
 * URI — large data: URIs are known to silently fail to play on some
 * WebKit/mobile Safari versions, while Blob URLs are the standard, reliable
 * pattern for dynamically-fetched audio. Reuses one <audio> element (paused
 * and swapped, not recreated) so overlapping replies don't pile up
 * concurrent elements, which iOS also caps aggressively. Falls back to
 * client-side speechSynthesis if playback still fails for any reason.
 * No-op if muted.
 */
export function playCreatureAudio(base64: string, fallbackText?: string, fallbackLang?: LangCode) {
  if (getMuted()) return;
  if (typeof window === "undefined") return;

  if (creatureAudioUrl) URL.revokeObjectURL(creatureAudioUrl);
  if (creatureAudioEl) {
    creatureAudioEl.pause();
    creatureAudioEl.removeAttribute("src");
  }

  const url = URL.createObjectURL(base64ToBlob(base64, "audio/mpeg"));
  creatureAudioUrl = url;
  const audio = creatureAudioEl ?? new Audio();
  creatureAudioEl = audio;
  audio.src = url;
  audio.volume = 0.95;
  audio.play().catch((err) => {
    console.error("playCreatureAudio failed:", err);
    if (fallbackText && fallbackLang) speakAsCreature(fallbackText, fallbackLang);
  });
}
