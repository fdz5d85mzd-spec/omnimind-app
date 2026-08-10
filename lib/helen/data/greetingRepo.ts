import { readJSON, writeJSON } from "./storage";

const KEY = "helen-last-greeted";

export function getLastGreetedDate(): string | null {
  return readJSON<string>(KEY) ?? null;
}

export function setLastGreetedDate(date: string): void {
  writeJSON(KEY, date);
}
