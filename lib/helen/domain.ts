import type { CreatureStage, Org, ShopItem, TierName, VoteMap, VoteSplit } from "./types";

/** Fallback for local/offline dev only (no Supabase configured) — production
 *  always reads the real count via /api/stats, see lib/useRealStats.ts. */
export const BASE_GLOBAL = 0;
export const MEMBERSHIP_PRICE_EUR = 1;
export const IMPACT_SHARE = 0.15;
/** Below this, the creature shows visible neglect (dimmed + a nudge to feed/play). */
export const LOW_HAPPINESS_THRESHOLD = 30;
/** Care points earned per feed/play/clean action. */
export const CARE_POINTS_PER_ACTION = 5;
/** One-time care points granted the moment someone joins. */
export const SIGNUP_BONUS_XP = 20;
/** Care points granted automatically once per day just for opening the app. */
export const DAILY_LOGIN_XP = 3;
/** Extra care points granted on top of the daily login XP when a 7-day
 *  login streak completes (streak is a multiple of 7). */
export const WEEKLY_STREAK_BONUS_XP = 25;

/** Hours between lucky-wheel spins. */
export const WHEEL_COOLDOWN_HOURS = 24;

export interface WheelSegment {
  xp: number;
  label: string;
}

/**
 * Visual wedges (equal size) — the actual odds of landing on each one are
 * set by the weights in WHEEL_WEIGHTS below, not by wedge size. Expected
 * value works out to ~5.5 XP/spin, in line with DAILY_LOGIN_XP's scale —
 * this only ever grants internal XP, never a direct real-money payout (see
 * the manual-review redemption model), so there's no uncapped exposure, but
 * keeping the average modest is still good practice.
 */
export const WHEEL_SEGMENTS: WheelSegment[] = [
  { xp: 5, label: "+5" },
  { xp: 0, label: "😅" },
  { xp: 10, label: "+10" },
  { xp: 5, label: "+5" },
  { xp: 15, label: "+15" },
  { xp: 0, label: "😅" },
  { xp: 8, label: "+8" },
  { xp: 25, label: "+25" },
];

const WHEEL_WEIGHTS = [18, 20, 14, 18, 8, 12, 8, 2];

/** Picks a WHEEL_SEGMENTS index using WHEEL_WEIGHTS. */
export function rollWheelSegmentIndex(): number {
  const total = WHEEL_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WHEEL_WEIGHTS.length; i++) {
    if (r < WHEEL_WEIGHTS[i]) return i;
    r -= WHEEL_WEIGHTS[i];
  }
  return 0;
}

/**
 * Cosmetic items. Prices go through the same Stripe Checkout pattern as the
 * €1 membership (see app/api/shop-checkout/route.ts), and — like
 * membership — a slice at IMPACT_SHARE is meant to feed the Impact Fund
 * (see contributionFor below and app/home/impact/page.tsx's fund total).
 */
export const SHOP_ITEMS: ShopItem[] = [
  { id: "party-hat", icon: "🎩", priceEur: 0.99 },
  { id: "golden-bowl", icon: "🥇", priceEur: 1.99 },
  { id: "rainbow-trail", icon: "🌈", priceEur: 2.99 },
  { id: "confetti-burst", icon: "🎉", priceEur: 0.99 },
  { id: "cozy-blanket", icon: "🧶", priceEur: 1.49 },
  { id: "star-crown", icon: "👑", priceEur: 3.99, requiredLevel: 2 },
  { id: "diamond-collar", icon: "💎", priceEur: 4.99, requiredLevel: 3 },
  { id: "magic-cape", icon: "🦸", priceEur: 7.99, requiredLevel: 4 },
  { id: "royal-throne", icon: "🪑", priceEur: 12.99, requiredLevel: 5 },
  { id: "phoenix-wings", icon: "🔥", priceEur: 15.99, requiredLevel: 5 },
  { id: "cosmic-aura", icon: "🌌", priceEur: 19.99, requiredLevel: 6 },
  { id: "founder-statue", icon: "🗿", priceEur: 24.99, requiredLevel: 6 },
];

/** Total ever contributed by a member: the €1 membership plus every shop item they own. */
export function contributionFor(ownedItemIds: string[]): number {
  const shopTotal = ownedItemIds.reduce((sum, id) => {
    const item = SHOP_ITEMS.find((i) => i.id === id);
    return sum + (item?.priceEur ?? 0);
  }, 0);
  return MEMBERSHIP_PRICE_EUR + shopTotal;
}

const TIER_RANGES: { max: number; name: TierName }[] = [
  { max: 100, name: "LEGENDARY FOUNDER" },
  { max: 10000, name: "EARLY FOUNDER" },
  { max: 100000, name: "PIONEER MEMBER" },
  { max: Infinity, name: "GLOBAL MEMBER" },
];

export function tierFor(id: number): TierName {
  return (TIER_RANGES.find((r) => id <= r.max) ?? TIER_RANGES[TIER_RANGES.length - 1]).name;
}

/** How many signups remain before the tier the *next* member would land in
 *  closes — real, honest scarcity for the /live broadcast screen (see
 *  app/live/page.tsx), not a fabricated countdown. Null once past every
 *  capped tier (GLOBAL MEMBER has no ceiling). */
export function nextTierUrgency(memberCount: number): { tierName: TierName; spotsLeft: number } | null {
  const tier = TIER_RANGES.find((r) => memberCount + 1 <= r.max);
  if (!tier || tier.max === Infinity) return null;
  return { tierName: tier.name, spotsLeft: tier.max - memberCount };
}

export interface WorldStage {
  label: "VILLAGE" | "CITY" | "KINGDOM" | "WORLD";
  heights: number[];
}

export function worldStageFor(count: number): WorldStage {
  if (count < 10000) return { label: "VILLAGE", heights: [18, 26, 20] };
  if (count < 100000) return { label: "CITY", heights: [30, 45, 26, 50, 34] };
  if (count < 500000)
    return { label: "KINGDOM", heights: [40, 55, 30, 60, 35, 48, 28] };
  return { label: "WORLD", heights: [35, 50, 60, 40, 55, 45, 60, 38, 50] };
}

export const ORG_QUEUE: Org[] = [
  { id: 0, name: "Clearwater Wells Initiative", category: "Clean water", region: "East Africa" },
  { id: 1, name: "Bright Path Schools", category: "Education", region: "South Asia" },
  { id: 2, name: "Reforest the Andes", category: "Reforestation", region: "South America" },
  { id: 3, name: "Rapid Relief Corps", category: "Disaster relief", region: "Global" },
  { id: 4, name: "Ocean Guardians", category: "Marine conservation", region: "Pacific Islands" },
  { id: 5, name: "Mobile Health Units", category: "Medical aid", region: "Sub-Saharan Africa" },
];

/** Members per fund cycle; cycle pool = CYCLE_SIZE members worth of impact share. */
export const CYCLE_SIZE = 20000;
export const CYCLE_POOL = CYCLE_SIZE * IMPACT_SHARE;

export function cycleForCount(count: number): number {
  return Math.floor(count / CYCLE_SIZE);
}

export function orgsForCycle(cycle: number): Org[] {
  const start = (cycle * 3) % ORG_QUEUE.length;
  return [0, 1, 2].map((i) => ORG_QUEUE[(start + i) % ORG_QUEUE.length]);
}

export function queueAfterCycle(cycle: number): Org[] {
  const activeIds = orgsForCycle(cycle).map((o) => o.id);
  return ORG_QUEUE.filter((o) => !activeIds.includes(o.id));
}

/** Guaranteed minimum per org (15% of pool each) + vote-weighted remainder. */
export function splitPool(
  pool: number,
  orgs: Org[],
  votes: VoteMap,
  cycle: number,
): VoteSplit[] {
  const counts = orgs.map((o) => votes[`${cycle}_${o.id}`] ?? 0);
  const totalVotes = counts.reduce((a, b) => a + b, 0);
  const guaranteed = pool * 0.15;
  const remaining = pool - guaranteed * orgs.length;
  return orgs.map((o, i) => {
    const share = totalVotes > 0 ? counts[i] / totalVotes : 1 / orgs.length;
    return { org: o, votes: counts[i], amount: guaranteed + remaining * share };
  });
}

export interface CreatureLevel {
  level: number;
  scale: number;
  stage: CreatureStage;
}

/** Care-points thresholds for each level. */
const LEVEL_THRESHOLDS = [0, 50, 150, 350, 700, 1200];

/** Art only has 4 growth stages (Baby/Standing/Adolescent/Final) — levels
 *  past 4 keep the final-stage art, they just keep unlocking pricier shop
 *  items (see SHOP_ITEMS' requiredLevel up to 6). */
const MAX_CREATURE_STAGE = 4;

export function levelFor(carePoints: number): CreatureLevel {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (carePoints >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return {
    level,
    scale: 1 + (level - 1) * 0.09,
    stage: Math.min(level, MAX_CREATURE_STAGE) as CreatureStage,
  };
}

export interface XpProgress {
  /** Care points earned since the current level started. */
  into: number;
  /** Care points needed to reach the next level (null once maxed out). */
  span: number | null;
  /** 0–1 progress toward the next level (1 when maxed). */
  pct: number;
  maxed: boolean;
}

/** Progress toward the next level, for a clear XP bar in the UI. */
export function xpProgressFor(carePoints: number): XpProgress {
  const { level } = levelFor(carePoints);
  const floor = LEVEL_THRESHOLDS[level - 1];
  const ceiling = LEVEL_THRESHOLDS[level] ?? null;
  if (ceiling === null) return { into: carePoints - floor, span: null, pct: 1, maxed: true };
  const span = ceiling - floor;
  return { into: carePoints - floor, span, pct: (carePoints - floor) / span, maxed: false };
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function padId(id: number): string {
  return `#${String(id).padStart(6, "0")}`;
}
