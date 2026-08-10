import { getSupabaseBrowserClient } from "./client";
import type { Profile, TierName } from "../types";

/** Mirrors the `members` table in supabase/schema.sql. `creature_rarity` is
 *  legacy — the rarity system was retired, but the column stays as-is
 *  (avoids a migration) and is now read purely as a hatched/not-hatched
 *  flag: any non-null value means hatched. */
interface MemberRow {
  id: number;
  tier: string;
  username: string | null;
  creature_rarity: string | null;
  streak_count: number;
  happiness: number;
  invites_count: number;
  last_active_date: string;
  reward_claimed_today: boolean;
  mission_feed: boolean;
  mission_play: boolean;
  mission_share: boolean;
  created_at: string;
}

function mapRowToProfile(row: MemberRow): Profile {
  return {
    memberId: row.id,
    tier: row.tier as TierName,
    username: row.username,
    hatched: row.creature_rarity !== null,
    // Not in supabase/schema.sql yet, same treatment as carePoints below.
    creatureName: null,
    streak: row.streak_count,
    happiness: row.happiness,
    invites: row.invites_count,
    // `clean` mission, care points, and shop ownership aren't in
    // supabase/schema.sql yet (added after the schema was written) — default
    // them until columns/tables exist for them, same treatment as votedCycle
    // below.
    carePoints: 0,
    ownedItems: [],
    lastActiveDate: row.last_active_date,
    rewardClaimedToday: row.reward_claimed_today,
    missions: { feed: row.mission_feed, play: row.mission_play, clean: false, share: row.mission_share },
    // Per-cycle vote state lives in the `votes` table, not on the member row —
    // callers that need it should query `votes` directly (see lib/domain.ts's
    // cycle helpers for how cycle/org ids are derived).
    votedCycle: null,
    votedOrgId: null,
    createdAt: row.created_at,
  };
}

/**
 * Fetches the member row the Stripe webhook creates after a real payment.
 * Returns null if it hasn't landed yet (the webhook can trail the redirect
 * back from Stripe by a moment) — callers should offer a retry rather than
 * looping indefinitely.
 */
export async function fetchMemberByUserId(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("members")
    .select(
      "id, tier, username, creature_rarity, streak_count, happiness, invites_count, last_active_date, reward_claimed_today, mission_feed, mission_play, mission_share, created_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRowToProfile(data as MemberRow) : null;
}
