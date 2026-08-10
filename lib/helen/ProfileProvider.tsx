"use client";

import { track } from "@vercel/analytics";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CARE_POINTS_PER_ACTION, contributionFor, SHOP_ITEMS } from "./domain";
import { consumePendingDailyReward, type PendingDailyReward } from "./data/dailyRewardRepo";
import { incrementGlobalAndGetId } from "./data/globalRepo";
import { addToLeaderboard, updateContribution } from "./data/leaderboardRepo";
import { createProfile, getProfile, saveProfile } from "./data/profileRepo";
import { addShopRevenue } from "./data/shopRevenueRepo";
import { castVote } from "./data/votesRepo";
import { fetchMemberByUserId } from "./supabase/members";
import { fetchOwnedItemIds } from "./supabase/purchases";
import type { Profile } from "./types";

interface ProfileContextValue {
  profile: Profile | null;
  ready: boolean;
  /** Set once, right after a fresh day's login XP (and possibly a 7-day
   *  streak bonus) has just been granted — consume it once to show the
   *  reward, then call clearPendingDailyReward(). */
  pendingDailyReward: PendingDailyReward | null;
  clearPendingDailyReward: () => void;
  join: (username: string) => Profile;
  hatch: () => void;
  setCreatureName: (name: string) => void;
  feed: () => void;
  play: () => void;
  clean: () => void;
  claimReward: () => void;
  share: () => void;
  vote: (cycle: number, orgId: number) => void;
  /** Grants the XP won from a lucky-wheel spin — cooldown/eligibility is
   *  tracked separately in lib/data/luckyWheelRepo.ts, not here. */
  spinWheel: (xpWon: number) => void;
  /** Mock purchase: instant, mirrors the checkout page's "try real Stripe,
   *  fall back to mock" pattern — swap for a real Checkout Session + webhook
   *  the same way membership checkout was wired up once ready to go live. */
  purchaseItem: (itemId: string) => Promise<void>;
  /** For the real-Stripe path: pulls the member row the webhook created and
   *  mirrors it into local state/localStorage. Returns null if it hasn't
   *  landed yet — see app/card/page.tsx for the retry UI. */
  hydrateFromRemote: (userId: string) => Promise<Profile | null>;
  /** Same idea as hydrateFromRemote but for a shop purchase — merges owned
   *  item ids from Supabase instead of replacing the whole profile. Returns
   *  true once the specific item shows up owned (webhook may still be
   *  in flight) — see app/home/shop/page.tsx for the retry UI. */
  syncOwnedItems: (itemId: string) => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [pendingDailyReward, setPendingDailyReward] = useState<PendingDailyReward | null>(null);

  useEffect(() => {
    setProfile(getProfile());
    setPendingDailyReward(consumePendingDailyReward());
    setReady(true);
  }, []);

  const clearPendingDailyReward = useCallback(() => setPendingDailyReward(null), []);

  const persist = useCallback((next: Profile) => {
    saveProfile(next);
    setProfile(next);
    updateContribution(next.memberId, contributionFor(next.ownedItems));
  }, []);

  const join = useCallback((username: string): Profile => {
    const id = incrementGlobalAndGetId();
    const trimmedUsername = username.trim().slice(0, 20) || null;
    const next = createProfile(id, trimmedUsername);
    addToLeaderboard({
      id: next.memberId,
      tier: next.tier,
      username: trimmedUsername,
      totalContributed: contributionFor([]),
    });
    setProfile(next);
    track("membership_joined", { tier: next.tier });
    return next;
  }, []);

  const hatch = useCallback(() => {
    if (!profile) return;
    persist({ ...profile, hatched: true });
    track("creature_hatched");
  }, [profile, persist]);

  const setCreatureName = useCallback(
    (name: string) => {
      if (!profile) return;
      persist({ ...profile, creatureName: name.trim().slice(0, 24) || null });
    },
    [profile, persist],
  );

  const feed = useCallback(() => {
    if (!profile || profile.missions.feed) return;
    persist({
      ...profile,
      happiness: Math.min(100, profile.happiness + 15),
      carePoints: profile.carePoints + CARE_POINTS_PER_ACTION,
      missions: { ...profile.missions, feed: true },
    });
  }, [profile, persist]);

  const play = useCallback(() => {
    if (!profile || profile.missions.play) return;
    persist({
      ...profile,
      happiness: Math.min(100, profile.happiness + 10),
      carePoints: profile.carePoints + CARE_POINTS_PER_ACTION,
      missions: { ...profile.missions, play: true },
    });
  }, [profile, persist]);

  const clean = useCallback(() => {
    if (!profile || profile.missions.clean) return;
    persist({
      ...profile,
      happiness: Math.min(100, profile.happiness + 10),
      carePoints: profile.carePoints + CARE_POINTS_PER_ACTION,
      missions: { ...profile.missions, clean: true },
    });
  }, [profile, persist]);

  const claimReward = useCallback(() => {
    if (!profile || profile.rewardClaimedToday) return;
    persist({
      ...profile,
      happiness: Math.min(100, profile.happiness + 20),
      rewardClaimedToday: true,
    });
  }, [profile, persist]);

  const share = useCallback(() => {
    if (!profile) return;
    persist({
      ...profile,
      invites: profile.invites + 1,
      missions: { ...profile.missions, share: true },
    });
  }, [profile, persist]);

  const vote = useCallback(
    (cycle: number, orgId: number) => {
      if (!profile || profile.votedCycle === cycle) return;
      castVote(cycle, orgId);
      persist({ ...profile, votedCycle: cycle, votedOrgId: orgId });
      track("vote_cast", { cycle, orgId });
    },
    [profile, persist],
  );

  const spinWheel = useCallback(
    (xpWon: number) => {
      if (!profile) return;
      persist({ ...profile, carePoints: profile.carePoints + xpWon });
      track("wheel_spun", { xpWon });
    },
    [profile, persist],
  );

  const purchaseItem = useCallback(
    async (itemId: string) => {
      if (!profile || profile.ownedItems.includes(itemId)) return;
      await new Promise((r) => setTimeout(r, 700));
      const price = SHOP_ITEMS.find((i) => i.id === itemId)?.priceEur ?? 0;
      addShopRevenue(price);
      persist({ ...profile, ownedItems: [...profile.ownedItems, itemId] });
      track("shop_purchase", { itemId, priceEur: price });
    },
    [profile, persist],
  );

  const hydrateFromRemote = useCallback(async (userId: string): Promise<Profile | null> => {
    const remote = await fetchMemberByUserId(userId);
    if (remote) persist(remote);
    return remote;
  }, [persist]);

  const syncOwnedItems = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!profile) return false;
      // Defense in depth: only ever accept ids that are real shop items —
      // a broken RLS policy on shop_purchases (schema drift) should never be
      // able to hand this member items it doesn't actually own.
      const validItemIds = new Set(SHOP_ITEMS.map((i) => i.id));
      const ownedIds = (await fetchOwnedItemIds(profile.memberId)).filter((id) => validItemIds.has(id));
      const newlyOwned = ownedIds.filter((id) => !profile.ownedItems.includes(id));
      newlyOwned.forEach((id) => {
        const price = SHOP_ITEMS.find((i) => i.id === id)?.priceEur ?? 0;
        addShopRevenue(price);
      });
      persist({ ...profile, ownedItems: Array.from(new Set([...profile.ownedItems, ...ownedIds])) });
      return ownedIds.includes(itemId);
    },
    [profile, persist],
  );

  return (
    <ProfileContext.Provider
      value={{
        profile,
        ready,
        pendingDailyReward,
        clearPendingDailyReward,
        join,
        hatch,
        setCreatureName,
        feed,
        play,
        clean,
        claimReward,
        share,
        vote,
        spinWheel,
        purchaseItem,
        hydrateFromRemote,
        syncOwnedItems,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
