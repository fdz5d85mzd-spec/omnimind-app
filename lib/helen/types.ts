/** 1=Baby, 2=Standing, 3=Adolescent, 4=Final/Crowned. */
export type CreatureStage = 1 | 2 | 3 | 4;

export type TierName =
  | "LEGENDARY FOUNDER"
  | "EARLY FOUNDER"
  | "PIONEER MEMBER"
  | "GLOBAL MEMBER";

export interface Missions {
  feed: boolean;
  play: boolean;
  clean: boolean;
  share: boolean;
}

export interface Profile {
  memberId: number;
  tier: TierName;
  username: string | null;
  hatched: boolean;
  creatureName: string | null;
  streak: number;
  happiness: number;
  invites: number;
  carePoints: number;
  ownedItems: string[];
  lastActiveDate: string;
  rewardClaimedToday: boolean;
  missions: Missions;
  votedCycle: number | null;
  votedOrgId: number | null;
  createdAt: string;
}

export interface ShopItem {
  id: string;
  icon: string;
  priceEur: number;
  /** Minimum creature level required to buy; omitted/1 means unlocked from the start. */
  requiredLevel?: number;
}

export interface LeaderboardEntry {
  id: number;
  tier: TierName;
  username: string | null;
  totalContributed: number;
}

export interface Org {
  id: number;
  name: string;
  category: string;
  region: string;
}

export type VoteMap = Record<string, number>;

export interface VoteSplit {
  org: Org;
  votes: number;
  amount: number;
}

export interface FeedbackEntry {
  id: string;
  memberId: number;
  text: string;
  votes: number;
  createdAt: string;
}

export interface AppRating {
  memberId: number;
  stars: number;
  createdAt: string;
}
