"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Thin wrapper over the browser's native SpeechRecognition — no API key,
// no external service. Only Chrome/Edge/Safari implement it today, so
// `supported` is feature-detected and callers should hide the mic entirely
// when it's false rather than show a button that silently does nothing.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

// `lang` should be a real BCP-47 locale (e.g. "el-GR"), not left to
// navigator.language -- the browser/OS locale frequently doesn't match
// what the person is actually speaking (an English-locale phone with a
// Greek speaker, for instance), and recognition accuracy falls apart
// when it's parsing the wrong language's phonemes. Pass the app's own
// selected language instead, which is a real, explicit signal.
export function useSpeechRecognition(onFinalText: (text: string) => void, lang?: string) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang || navigator.language || "en-US";

    recognition.onresult = (event: unknown) => {
      const e = event as { results: { transcript: string }[][] };
      const transcript = e.results?.[e.results.length - 1]?.[0]?.transcript;
      if (transcript) onFinalText(transcript.trim());
    };
    recognition.onerror = (event: unknown) => {
      const e = event as { error?: string };
      setError(e.error === "not-allowed" ? "Microphone access denied." : "Couldn't hear that — try again.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setSupported(true);
  }, [onFinalText, lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setError(null);
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      // start() throws if already started — ignore, state stays accurate via onend
    }
  }, [listening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, error, start, stop };
}
