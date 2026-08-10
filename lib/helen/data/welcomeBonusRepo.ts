import { readJSON, writeJSON } from "./storage";

const KEY = "helen-welcome-bonus-shown-member-id";

/** The signup bonus popup on /card must only ever appear once per member,
 *  even if the user revisits /card later — tracked by member id rather than
 *  a plain boolean so a browser that's hosted multiple members over time
 *  (shared device, re-signup after clearing storage) still gets it once each. */
export function hasShownWelcomeBonus(memberId: number): boolean {
  return readJSON<number>(KEY) === memberId;
}

export function markWelcomeBonusShown(memberId: number): void {
  writeJSON(KEY, memberId);
}
