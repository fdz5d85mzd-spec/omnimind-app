"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Mood = "happy" | "neutral" | "sad";

/** Feeds accumulated required to reach stage N (index 0 = stage 1). */
export const STAGE_THRESHOLDS = [0, 5, 15, 30, 50];
export const STAGE_COUNT = STAGE_THRESHOLDS.length;

/** Full hunger depletion (100 -> 0) over this many hours without a feed. */
const HUNGER_DECAY_HOURS = 12;

export function stageForFeeds(feeds: number): number {
  let stage = 1;
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (feeds >= STAGE_THRESHOLDS[i]) {
      stage = i + 1;
      break;
    }
  }
  return stage;
}

export function hungerFromLastFed(lastFedAt: number, now: number): number {
  const hours = (now - lastFedAt) / 3_600_000;
  return Math.max(0, Math.min(100, 100 - (hours / HUNGER_DECAY_HOURS) * 100));
}

export function moodFromHunger(hunger: number): Mood {
  if (hunger > 66) return "happy";
  if (hunger > 33) return "neutral";
  return "sad";
}

export function stageProgress(feeds: number): { current: number; needed: number; pct: number } {
  const stage = stageForFeeds(feeds);
  if (stage >= STAGE_COUNT) {
    return { current: 1, needed: 1, pct: 100 };
  }
  const prevThreshold = STAGE_THRESHOLDS[stage - 1];
  const nextThreshold = STAGE_THRESHOLDS[stage];
  const current = feeds - prevThreshold;
  const needed = nextThreshold - prevThreshold;
  return { current, needed, pct: Math.min(100, (current / needed) * 100) };
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

interface CreatureState {
  feedsCount: number;
  lastFedAt: number;
  streak: number;
  lastStreakDate: string | null;
  justLeveledUp: boolean;
  feed: () => void;
  clearLevelUp: () => void;
  reset: () => void;
}

/**
 * Local-only state for now (localStorage via persist) — this is the lab
 * skeleton/demo phase. Swapping the storage backend for a Supabase-synced
 * one later doesn't change any component code, since components only ever
 * read/call this hook.
 */
export const useCreatureStore = create<CreatureState>()(
  persist(
    (set, get) => ({
      feedsCount: 0,
      lastFedAt: Date.now(),
      streak: 0,
      lastStreakDate: null,
      justLeveledUp: false,

      feed: () => {
        const prevStage = stageForFeeds(get().feedsCount);
        const feedsCount = get().feedsCount + 1;
        const nextStage = stageForFeeds(feedsCount);

        const today = todayKey();
        const yesterday = todayKey(new Date(Date.now() - 86_400_000));
        const last = get().lastStreakDate;
        let streak = get().streak;
        if (last !== today) {
          streak = last === yesterday ? streak + 1 : 1;
        }

        set({
          feedsCount,
          lastFedAt: Date.now(),
          streak,
          lastStreakDate: today,
          justLeveledUp: nextStage > prevStage,
        });
      },

      clearLevelUp: () => set({ justLeveledUp: false }),

      reset: () =>
        set({
          feedsCount: 0,
          lastFedAt: Date.now(),
          streak: 0,
          lastStreakDate: null,
          justLeveledUp: false,
        }),
    }),
    { name: "helen-lab-creature" },
  ),
);
