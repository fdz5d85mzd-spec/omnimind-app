import { DAILY_LOGIN_XP, SIGNUP_BONUS_XP, WEEKLY_STREAK_BONUS_XP, tierFor, todayStr } from "../domain";
import type { Profile } from "../types";
import { setPendingDailyReward } from "./dailyRewardRepo";
import { readJSON, writeJSON } from "./storage";

const KEY = "helen-profile";

/** Backfills fields added after a profile may have already been created/saved. */
function withDefaults(profile: Profile): Profile {
  return {
    ...profile,
    carePoints: profile.carePoints ?? 0,
    ownedItems: profile.ownedItems ?? [],
    creatureName: profile.creatureName ?? null,
    username: profile.username ?? null,
    // Pre-migration local profiles had `creature: Rarity | null` instead of
    // `hatched: boolean` — treat any non-null legacy value as already hatched.
    hatched: profile.hatched ?? Boolean((profile as unknown as { creature?: unknown }).creature),
    missions: { ...profile.missions, clean: profile.missions.clean ?? false },
  };
}

export function getProfile(): Profile | null {
  const profile = readJSON<Profile>(KEY);
  if (!profile) return null;
  return applyDailyReset(withDefaults(profile));
}

export function saveProfile(profile: Profile): void {
  writeJSON(KEY, profile);
}

export function createProfile(memberId: number, username: string | null = null): Profile {
  const today = todayStr();
  const profile: Profile = {
    memberId,
    tier: tierFor(memberId),
    username,
    hatched: false,
    creatureName: null,
    streak: 1,
    happiness: 50,
    invites: 0,
    carePoints: SIGNUP_BONUS_XP,
    ownedItems: [],
    lastActiveDate: today,
    rewardClaimedToday: false,
    missions: { feed: false, play: false, clean: false, share: false },
    votedCycle: null,
    votedOrgId: null,
    createdAt: today,
  };
  saveProfile(profile);
  return profile;
}

function isYesterday(dateStr: string, today: string): boolean {
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return dateStr === yesterday.toISOString().slice(0, 10);
}

/** Happiness lost per care action (feed/play/clean) skipped on the previous day. */
const CARE_DECAY_PER_MISSED_ACTION = 10;

/**
 * Streak increments only when the previous visit was exactly yesterday; a gap
 * resets it to 1. Happiness decays for each of feed/play/clean that went
 * undone the prior day — neglecting the creature has a real, visible cost,
 * which is what gives the daily missions their pull to come back.
 */
function applyDailyReset(profile: Profile): Profile {
  const today = todayStr();
  if (profile.lastActiveDate === today) return profile;
  const consecutive = isYesterday(profile.lastActiveDate, today);
  const missedActions =
    (profile.missions.feed ? 0 : 1) +
    (profile.missions.play ? 0 : 1) +
    (profile.missions.clean ? 0 : 1);
  const nextStreak = consecutive ? profile.streak + 1 : 1;
  // Day 7, 14, 21... of an unbroken streak gets a bonus on top of the
  // ordinary daily login XP — a gap resets the streak to 1, so this can
  // only ever fire once every 7 *consecutive* days, never more often.
  const weeklyBonus = nextStreak % 7 === 0;
  const loginXp = DAILY_LOGIN_XP + (weeklyBonus ? WEEKLY_STREAK_BONUS_XP : 0);
  const updated: Profile = {
    ...profile,
    streak: nextStreak,
    happiness: Math.max(0, profile.happiness - missedActions * CARE_DECAY_PER_MISSED_ACTION),
    carePoints: profile.carePoints + loginXp,
    lastActiveDate: today,
    rewardClaimedToday: false,
    missions: { feed: false, play: false, clean: false, share: false },
  };
  saveProfile(updated);
  setPendingDailyReward({ xp: loginXp, streakDay: ((nextStreak - 1) % 7) + 1, weeklyBonus });
  return updated;
}
