"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getMuted } from "@/lib/helen/data/settingsRepo";

const TARGET_VOLUME = 0.07;
const FADE_MS = 1500;

/** A real, very quiet garden ambience (soft birdsong + a light breeze) —
 *  plays only on the /home scene, as a subtle bed rather than discrete
 *  synthesized chirps popping in and out. */
function ambienceWantedOn(pathname: string): boolean {
  return pathname === "/helen/home";
}

function fadeTo(audio: HTMLAudioElement, target: number, onDone?: () => void) {
  const start = audio.volume;
  const startTime = performance.now();
  function step(now: number) {
    const t = Math.min(1, Math.max(0, (now - startTime) / FADE_MS));
    audio.volume = Math.min(1, Math.max(0, start + (target - start) * t));
    if (t < 1) requestAnimationFrame(step);
    else onDone?.();
  }
  requestAnimationFrame(step);
}

export function AmbientNature() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const audio = new Audio("/helen/audio/garden-ambience.m4a");
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    function tryPlay() {
      if (!getMuted() && ambienceWantedOn(window.location.pathname)) {
        audio.play().catch(() => {});
        fadeTo(audio, TARGET_VOLUME);
      }
    }

    function onFirstInteraction() {
      tryPlay();
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
    if (ambienceWantedOn(pathname)) {
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
