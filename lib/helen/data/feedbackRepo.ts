import type { FeedbackEntry } from "../types";
import { readJSON, writeJSON } from "./storage";

const KEY = "helen-feedback";

export function getFeedback(): FeedbackEntry[] {
  const list = readJSON<FeedbackEntry[]>(KEY) ?? [];
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addFeedback(memberId: number, text: string): FeedbackEntry {
  const entry: FeedbackEntry = {
    id: `${memberId}-${Date.now()}`,
    memberId,
    text,
    votes: 0,
    createdAt: new Date().toISOString(),
  };
  const list = readJSON<FeedbackEntry[]>(KEY) ?? [];
  list.push(entry);
  writeJSON(KEY, list);
  return entry;
}

export function upvoteFeedback(id: string): void {
  const list = readJSON<FeedbackEntry[]>(KEY) ?? [];
  const next = list.map((e) => (e.id === id ? { ...e, votes: e.votes + 1 } : e));
  writeJSON(KEY, next);
}
