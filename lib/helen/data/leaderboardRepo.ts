import type { LeaderboardEntry } from "../types";
import { readJSON, writeJSON } from "./storage";

const KEY = "helen-leaderboard";

export function getLeaderboard(): LeaderboardEntry[] {
  const list = readJSON<LeaderboardEntry[]>(KEY) ?? [];
  // Backfill for entries saved before totalContributed/username existed.
  return list.map((e) => ({ ...e, totalContributed: e.totalContributed ?? 0, username: e.username ?? null }));
}

export function addToLeaderboard(entry: LeaderboardEntry): void {
  const list = getLeaderboard();
  list.push(entry);
  writeJSON(KEY, list);
}

/** Keeps the Top Contributors view current as the local member's spend changes. */
export function updateContribution(id: number, totalContributed: number): void {
  const list = getLeaderboard();
  const next = list.map((e) => (e.id === id ? { ...e, totalContributed } : e));
  writeJSON(KEY, next);
}
