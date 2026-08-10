import { readJSON, writeJSON } from "./storage";

const KEY = "helen-muted";

export function getMuted(): boolean {
  return readJSON<boolean>(KEY) ?? false;
}

export function setMuted(muted: boolean): void {
  writeJSON(KEY, muted);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("helen-muted-change", { detail: muted }));
  }
}
