import type { AppRating } from "../types";
import { readJSON, writeJSON } from "./storage";

const KEY = "helen-app-ratings";

function getRatings(): AppRating[] {
  return readJSON<AppRating[]>(KEY) ?? [];
}

export function getMyRating(memberId: number): number | null {
  return getRatings().find((r) => r.memberId === memberId)?.stars ?? null;
}

/** One rating per member — rating again replaces the previous one. */
export function submitRating(memberId: number, stars: number): void {
  const list = getRatings().filter((r) => r.memberId !== memberId);
  list.push({ memberId, stars, createdAt: new Date().toISOString() });
  writeJSON(KEY, list);
}

export function getAverageRating(): { average: number; count: number } {
  const list = getRatings();
  if (list.length === 0) return { average: 0, count: 0 };
  const sum = list.reduce((s, r) => s + r.stars, 0);
  return { average: sum / list.length, count: list.length };
}
