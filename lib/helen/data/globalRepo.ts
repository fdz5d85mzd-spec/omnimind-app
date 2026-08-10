import { BASE_GLOBAL } from "../domain";
import { readJSON, writeJSON } from "./storage";

const KEY = "helen-global-count";

/**
 * Mock: increments a browser-local counter and returns the new Member ID.
 * Real backend: replace with a Postgres sequence (or SELECT ... FOR UPDATE)
 * so concurrent signups never race for the same ID — see supabase/schema.sql.
 */
export function incrementGlobalAndGetId(): number {
  const count = (readJSON<number>(KEY) ?? BASE_GLOBAL) + 1;
  writeJSON(KEY, count);
  return count;
}

export function getGlobalCount(): number {
  return readJSON<number>(KEY) ?? BASE_GLOBAL;
}
