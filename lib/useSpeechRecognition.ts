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
  const timeoutRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(Boolean(navigator.mediaDevices && "getUserMedia" in navigator.mediaDevices && "MediaRecorder" in window));
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang || navigator.language || "en-US";

    recognition.onresult = (event: unknown) => {
      const e = event as { results: { transcript: string }[][] };
      const transcript = e.results?.[e.results.length - 1]?.[0]?.transcript;
      if (transcript) onFinalText(transcript.trim());
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
    recognition.onerror = (event: unknown) => {
      const e = event as { error?: string };
      setError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "Microphone access is blocked. Allow it in your phone's app/site settings."
        : e.error === "network"
          ? "Voice recognition needs an internet connection."
          : "Couldn't hear that — tap the microphone and try again.");
      setListening(false);
    };
    recognition.onend = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setListening(false);
    };

    recognitionRef.current = recognition;
    setSupported(true);
  }, [onFinalText, lang]);

  const start = useCallback(async () => {
    if (listening) return;
    setError(null);
    if (!recognitionRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(stream);
        streamRef.current = stream;
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder.onstop = async () => {
          setListening(false);
          stream.getTracks().forEach((track) => track.stop());
          try {
            const form = new FormData();
            form.set("file", new Blob(chunks, { type: recorder.mimeType || "audio/webm" }), "voice.webm");
            const response = await fetch("/api/chat/transcribe", { method: "POST", body: form });
            const result = await response.json();
            if (!response.ok || !result.text) throw new Error();
            onFinalText(result.text);
          } catch { setError("I heard you, but couldn't transcribe that. Please try again."); }
        };
        recorder.start();
        setListening(true);
        timeoutRef.current = window.setTimeout(() => recorder.state === "recording" && recorder.stop(), 15000);
      } catch { setError("Microphone access is blocked. Allow it in your phone's app/site settings."); }
      return;
    }
    try {
      recognitionRef.current.start();
      setListening(true);
      timeoutRef.current = window.setTimeout(() => recognitionRef.current?.stop(), 15000);
    } catch {
      // start() throws if already started — ignore, state stays accurate via onend
    }
  }, [listening, onFinalText]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setListening(false);
  }, []);

  return { supported, listening, error, start, stop };
}
