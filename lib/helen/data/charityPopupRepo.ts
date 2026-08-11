import { readJSON, writeJSON } from "./storage";

const KEY = "helen-charity-popup-shown";

/** Whether the one-time "15% of every euro goes to the Impact Fund" popup
 *  has already been shown on this device -- after this it's still visible
 *  on the checkout page and the Impact tab, just not as an interrupting
 *  popup on Home. */
export function hasShownCharityPopup(): boolean {
  return readJSON<boolean>(KEY) === true;
}

export function markCharityPopupShown(): void {
  writeJSON(KEY, true);
}
