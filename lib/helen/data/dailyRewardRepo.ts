import { readJSON, writeJSON } from "./storage";

const KEY = "helen-pending-daily-reward";

export interface PendingDailyReward {
  xp: number;
  /** 1-7, which day of the current 7-day cycle this login just completed. */
  streakDay: number;
  weeklyBonus: boolean;
}

export function setPendingDailyReward(reward: PendingDailyReward): void {
  writeJSON(KEY, reward);
}

/** Reads and clears in one step — the reward should only ever be shown once. */
export function consumePendingDailyReward(): PendingDailyReward | null {
  const reward = readJSON<PendingDailyReward>(KEY);
  if (reward) writeJSON(KEY, null);
  return reward;
}
