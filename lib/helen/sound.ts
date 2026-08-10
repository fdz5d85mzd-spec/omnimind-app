import { getMuted } from "./data/settingsRepo";

/**
 * Small synthesized sound-effect kit (Web Audio API oscillators, no audio
 * files) — game-like chimes for creature care actions. Every call is a
 * no-op if the user has muted, or if the browser has no AudioContext
 * (SSR-safe by construction since this only ever runs from click handlers).
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

interface Note {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

function playNotes(notes: Note[]) {
  if (getMuted()) return;
  const audioCtx = getContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  for (const { freq, start, duration, type = "sine", gain = 0.12 } of notes) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = now + start;
    const t1 = t0 + duration;
    gainNode.gain.setValueAtTime(0, t0);
    gainNode.gain.linearRampToValueAtTime(gain, t0 + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t1);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }
}

export function playFeedSound() {
  playNotes([
    { freq: 523.25, start: 0, duration: 0.09, type: "triangle" },
    { freq: 659.25, start: 0.08, duration: 0.14, type: "triangle" },
  ]);
}

export function playPlaySound() {
  playNotes([
    { freq: 587.33, start: 0, duration: 0.07, type: "square", gain: 0.08 },
    { freq: 783.99, start: 0.06, duration: 0.07, type: "square", gain: 0.08 },
    { freq: 987.77, start: 0.12, duration: 0.12, type: "square", gain: 0.08 },
  ]);
}

export function playCleanSound() {
  playNotes([
    { freq: 1046.5, start: 0, duration: 0.06, type: "sine", gain: 0.07 },
    { freq: 1318.5, start: 0.05, duration: 0.06, type: "sine", gain: 0.07 },
    { freq: 1568.0, start: 0.1, duration: 0.1, type: "sine", gain: 0.07 },
  ]);
}

export function playBuySound() {
  playNotes([
    { freq: 783.99, start: 0, duration: 0.08, type: "triangle" },
    { freq: 1046.5, start: 0.07, duration: 0.16, type: "triangle" },
  ]);
}

export function playLoveSound() {
  playNotes([
    { freq: 523.25, start: 0, duration: 0.16, type: "triangle", gain: 0.1 },
    { freq: 659.25, start: 0.13, duration: 0.16, type: "triangle", gain: 0.1 },
    { freq: 783.99, start: 0.26, duration: 0.3, type: "triangle", gain: 0.1 },
  ]);
}

export function playLevelUpSound() {
  playNotes([
    { freq: 523.25, start: 0, duration: 0.1, type: "square", gain: 0.09 },
    { freq: 659.25, start: 0.09, duration: 0.1, type: "square", gain: 0.09 },
    { freq: 783.99, start: 0.18, duration: 0.1, type: "square", gain: 0.09 },
    { freq: 1046.5, start: 0.27, duration: 0.25, type: "square", gain: 0.09 },
  ]);
}

export function playPokeSound() {
  playNotes([{ freq: 880, start: 0, duration: 0.06, type: "sine", gain: 0.06 }]);
}

export function playChatOpenSound() {
  playNotes([
    { freq: 659.25, start: 0, duration: 0.07, type: "sine", gain: 0.07 },
    { freq: 987.77, start: 0.05, duration: 0.1, type: "sine", gain: 0.07 },
  ]);
}

export function playChatCloseSound() {
  playNotes([
    { freq: 783.99, start: 0, duration: 0.06, type: "sine", gain: 0.06 },
    { freq: 523.25, start: 0.04, duration: 0.09, type: "sine", gain: 0.06 },
  ]);
}

/** A soft "reply arrived" notification — plays right as the AI's text lands,
 *  just before its voice starts, so there's always an immediate audible cue. */
export function playMessageSound() {
  playNotes([
    { freq: 987.77, start: 0, duration: 0.05, type: "sine", gain: 0.06 },
    { freq: 1318.5, start: 0.04, duration: 0.08, type: "sine", gain: 0.06 },
  ]);
}

export function playConfirmSound() {
  playNotes([
    { freq: 659.25, start: 0, duration: 0.06, type: "triangle", gain: 0.08 },
    { freq: 987.77, start: 0.05, duration: 0.14, type: "triangle", gain: 0.08 },
  ]);
}

/** A little giggly "yay!" — the creature's own satisfied reaction to being
 *  fed or played with, layered right after the practical feed/play chime. */
export function playHappyReactionSound() {
  playNotes([
    { freq: 740, start: 0, duration: 0.07, type: "triangle", gain: 0.09 },
    { freq: 932, start: 0.06, duration: 0.07, type: "triangle", gain: 0.09 },
    { freq: 1109, start: 0.12, duration: 0.09, type: "triangle", gain: 0.09 },
    { freq: 1480, start: 0.21, duration: 0.16, type: "sine", gain: 0.08 },
  ]);
}

/** Real (non-synthesized) eggshell-cracking foley, played the moment the
 *  egg hatches — the synthesized oscillator kit above can't convincingly
 *  do a crack/break sound, same reasoning as the real nature ambience in
 *  components/AmbientNature.tsx. */
export function playEggCrackSound() {
  if (getMuted()) return;
  if (typeof window === "undefined") return;
  const audio = new Audio("/helen/audio/egg-crack.m4a");
  audio.volume = 0.8;
  audio.play().catch(() => {});
}

/** A bigger, more celebratory chime for real rewards — the signup XP bonus
 *  and the 7-day login streak bonus — distinct from the small everyday
 *  feed/play/clean confirm sound. */
export function playRewardSound() {
  playNotes([
    { freq: 587.33, start: 0, duration: 0.09, type: "triangle", gain: 0.09 },
    { freq: 739.99, start: 0.08, duration: 0.09, type: "triangle", gain: 0.09 },
    { freq: 932, start: 0.16, duration: 0.09, type: "triangle", gain: 0.09 },
    { freq: 1174.66, start: 0.24, duration: 0.28, type: "sine", gain: 0.09 },
  ]);
}
