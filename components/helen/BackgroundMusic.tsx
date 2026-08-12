"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getMuted } from "@/lib/helen/data/settingsRepo";
import { unlockSpeech } from "@/lib/helen/speech";

const TARGET_VOLUME = 0.28;
const FADE_MS = 900;

/** Music plays through onboarding (join/checkout/card/egg) and fades out
 *  once the member reaches the main app — the room for it there is sound
 *  effects and the creature's own voice, not a looping backing track. */
function musicWantedOn(pathname: string): boolean {
  return !pathname.startsWith("/helen/home");
}

function fadeTo(audio: HTMLAudioElement, target: number, onDone?: () => void) {
  const start = audio.volume;
  const startTime = performance.now();
  function step(now: number) {
    // Clamp both ends — requestAnimationFrame's timestamp can land a hair
    // before startTime on the very first frame (clock/precision skew),
    // which without the lower clamp produces a negative t and an
    // out-of-range volume that throws IndexSizeError.
    const t = Math.min(1, Math.max(0, (now - startTime) / FADE_MS));
    audio.volume = Math.min(1, Math.max(0, start + (target - start) * t));
    if (t < 1) requestAnimationFrame(step);
    else onDone?.();
  }
  requestAnimationFrame(step);
}

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const audio = new Audio("/helen/audio/ambient.m4a");
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    function tryPlay() {
      if (!getMuted() && musicWantedOn(window.location.pathname)) {
        audio.play().catch(() => {});
        fadeTo(audio, TARGET_VOLUME);
      }
    }

    function onFirstInteraction() {
      tryPlay();
      unlockSpeech();
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    }

    function onMutedChange(e: Event) {
      const muted = (e as CustomEvent<boolean>).detail;
      if (muted) fadeTo(audio, 0, () => audio.pause());
      else tryPlay();
    }

    window.addEventListener("pointerdown", onFirstInteraction);
    window.addEventListener("keydown", onFirstInteraction);
    window.addEventListener("helen-muted-change", onMutedChange);
    tryPlay();

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("helen-muted-change", onMutedChange);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicWantedOn(pathname)) {
      if (!getMuted()) {
        if (audio.paused) audio.play().catch(() => {});
        fadeTo(audio, TARGET_VOLUME);
      }
    } else {
      fadeTo(audio, 0, () => audio.pause());
    }
  }, [pathname]);

  return null;
}
