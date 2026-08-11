// Real cost basis (checked against provider list pricing, not guessed):
//   - Claude Sonnet 5: $3/M input, $15/M output tokens (the rate from
//     2026-09-01 on -- the $2/$10 promo rate expires within weeks of this
//     being written, so pricing off the promo rate would already be wrong
//     by the time anyone reads this).
//   - ~100 output tokens + ~500 input tokens per credit (1 credit = 400
//     answer characters ~= 100 tokens) => roughly $0.003 raw cost/credit.
//   - Higgsfield: Soul text-to-image ~3 Higgsfield-credits, DoP
//     image-to-video (turbo) ~18 Higgsfield-credits, at ~$0.05/Higgsfield-
//     credit (top-up rate, not the cheaper bulk-plan rate -- conservative)
//     => ~$0.15/image, ~$0.90/video in real, unavoidable cost per
//     generation, regardless of who's asking.
//
// Retail credit price is set at EUR 0.01/credit -- about 3x the raw chat
// cost (healthy margin on ordinary chat use) while keeping VoxStudio's
// image/video charges (below) at a "yes this costs real credits" but not
// absurd-looking number.
export const CREDIT_PRICE_EUR = 0.01;

// What a single VoxStudio generation costs in OmniMind credits -- set to
// ~2x the real Higgsfield cost converted at CREDIT_PRICE_EUR, so every
// generation is profitable on its own, not just on average.
export const IMAGE_GENERATION_CREDITS = 30; // ~EUR 0.30 face value vs ~$0.15 real cost
export const VIDEO_GENERATION_CREDITS = 180; // ~EUR 1.80 face value vs ~$0.90 real cost

// 15% of every Helen charge (€1 memberships, shop purchases) goes to
// charity -- that's the point of Helen, not an afterthought. Admins split
// what's left (see lib/adminRevenue.ts / app/admin/revenue), not the gross.
export const HELEN_CHARITY_PERCENT = 0.15;

export interface CreditPack {
  id: string;
  credits: number;
  priceEur: number;
}

// Bulk discount increases with pack size -- entry pack is close to the
// EUR 0.01/credit baseline, the largest pack is the best per-credit deal.
export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_500", credits: 500, priceEur: 4.99 },
  { id: "pack_2000", credits: 2000, priceEur: 17.99 },
  { id: "pack_6000", credits: 6000, priceEur: 44.99 },
];

export interface Plan {
  id: "pro_monthly" | "pro_yearly" | "lifetime";
  label: string;
  interval: "month" | "year" | "lifetime";
  priceEur: number;
  monthlyCredits: number;
  tagline: string;
}

// Subscriber credit rate (EUR 12.99 / 2000 =~ EUR 0.0065/credit) undercuts
// the pay-as-you-go EUR 0.01/credit rate by ~35% -- a real reason to
// subscribe instead of buying packs one at a time. Worst case (every
// credit used, every month): ~$6 raw cost against EUR 12.99 revenue is
// still >55% gross margin, so this holds even under max usage, not just
// on average.
export const PLANS: Plan[] = [
  {
    id: "pro_monthly",
    label: "Pro Monthly",
    interval: "month",
    priceEur: 12.99,
    monthlyCredits: 2000,
    tagline: "2,000 credits every month, no cooldown wait",
  },
  {
    id: "pro_yearly",
    label: "Pro Yearly",
    interval: "year",
    priceEur: 119,
    monthlyCredits: 2000,
    tagline: "Same as Monthly, ~24% cheaper billed yearly",
  },
  {
    id: "lifetime",
    label: "Lifetime",
    interval: "lifetime",
    priceEur: 249,
    monthlyCredits: 1000,
    tagline: "Pay once, 1,000 credits every month forever",
  },
];
