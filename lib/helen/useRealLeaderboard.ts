"use client";

import { useEffect, useState } from "react";
import { getLeaderboard } from "./data/leaderboardRepo";
import type { LeaderboardEntry } from "./types";

/** Real member leaderboard via /api/stats-style aggregation (/api/leaderboard)
 *  — falls back to the local mock (lib/data/leaderboardRepo.ts) only when
 *  Supabase isn't configured (local dev). See app/home/rank/page.tsx. */
export function useRealLeaderboard(): LeaderboardEntry[] {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => getLeaderboard());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/helen/api/leaderboard");
        if (!res.ok) return;
        const data = (await res.json()) as { configured: boolean; entries: LeaderboardEntry[] };
        if (!cancelled && data.configured) setEntries(data.entries);
      } catch {
        // Supabase not reachable — keep whatever we already have.
      }
    }

    load();
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return entries;
}
