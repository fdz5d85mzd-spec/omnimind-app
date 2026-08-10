import { BCP47 } from "./speech";
import type { LangCode } from "./i18n/types";

// The Web Speech API's SpeechRecognition isn't in TS's lib.dom.d.ts yet, and
// only ships prefixed (webkitSpeechRecognition) in Safari/Chrome.
interface MinimalSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getRecognitionCtor(): (new () => MinimalSpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => MinimalSpeechRecognition;
    webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceInputSupported(): boolean {
  return getRecognitionCtor() !== null;
}

/**
 * Starts listening for one spoken phrase. Calls onResult with the
 * transcript once the user stops talking, or onError if the mic is denied
 * or unsupported. Returns a cancel() function — calling it aborts
 * immediately (not just stop(), which would still fire a final onresult
 * with whatever was half-captured) so a mistaken tap never sends a
 * half-spoken phrase.
 */
export function startVoiceInput(
  lang: LangCode,
  onResult: (transcript: string) => void,
  onError: (reason: "unsupported" | "denied" | "no-speech" | "other") => void,
  onEnd: () => void,
): () => void {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    onError("unsupported");
    return () => {};
  }

  const recognition = new Ctor();
  recognition.lang = BCP47[lang] ?? "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let gotResult = false;
  let cancelled = false;

  recognition.onresult = (event) => {
    if (cancelled) return;
    const transcript = event.results[0]?.[0]?.transcript?.trim();
    if (transcript) {
      gotResult = true;
      onResult(transcript);
    }
  };
  recognition.onerror = (event) => {
    if (cancelled) return;
    if (event.error === "not-allowed" || event.error === "service-not-allowed") onError("denied");
    else if (event.error === "no-speech") onError("no-speech");
    else onError("other");
  };
  recognition.onend = () => {
    if (!gotResult && !cancelled) onEnd();
  };

  recognition.start();
  return () => {
    cancelled = true;
    recognition.abort();
  };
}
