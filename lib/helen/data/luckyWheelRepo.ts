import { WHEEL_COOLDOWN_HOURS } from "../domain";
import { readJSON, writeJSON } from "./storage";

const KEY = "helen-wheel-last-spin-at";

export function getLastSpinAt(): number | null {
  return readJSON<number>(KEY);
}

export function recordSpin(): void {
  writeJSON(KEY, Date.now());
}

/** 0 once the cooldown has elapsed (or the wheel has never been spun). */
export function msUntilNextSpin(): number {
  const last = getLastSpinAt();
  if (last === null) return 0;
  const cooldownMs = WHEEL_COOLDOWN_HOURS * 60 * 60 * 1000;
  return Math.max(0, last + cooldownMs - Date.now());
}

const FIRST_POPUP_KEY = "helen-wheel-first-popup-shown";

/** Whether the one-time "your first spin is ready" auto-popup (45s after
 *  signup) has already been shown — after this, the wheel is only ever
 *  opened by the user tapping its button on Home. */
export function hasShownFirstWheelPopup(): boolean {
  return readJSON<boolean>(FIRST_POPUP_KEY) === true;
}

export function markFirstWheelPopupShown(): void {
  writeJSON(FIRST_POPUP_KEY, true);
}
