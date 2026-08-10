import type Stripe from "stripe";
import { getStripeClient, isStripeConfigured } from "@/lib/helen/stripe/server";

export type PromoCodeSummary = {
  id: string;
  code: string;
  active: boolean;
  percentOff: number | null;
  timesRedeemed: number;
  maxRedemptions: number | null;
  expiresAt: string | null;
  createdAt: string;
};

function toSummary(pc: Stripe.PromotionCode, percentOff: number | null): PromoCodeSummary {
  return {
    id: pc.id,
    code: pc.code,
    active: pc.active,
    percentOff,
    timesRedeemed: pc.times_redeemed,
    maxRedemptions: pc.max_redemptions ?? null,
    expiresAt: pc.expires_at ? new Date(pc.expires_at * 1000).toISOString() : null,
    createdAt: new Date(pc.created * 1000).toISOString(),
  };
}

// Stripe's own Promotion Codes are the source of truth -- no local table to
// keep in sync, no risk of a code existing here but not actually working at
// checkout. allow_promotion_codes:true on both Helen checkout sessions
// (app/helen/api/checkout, app/helen/api/shop-checkout) is what lets a
// customer actually redeem one of these.
export async function listPromoCodes(): Promise<PromoCodeSummary[]> {
  if (!isStripeConfigured()) return [];
  const stripe = getStripeClient();
  const codes: PromoCodeSummary[] = [];
  for await (const pc of stripe.promotionCodes.list({ limit: 100, expand: ["data.promotion.coupon"] })) {
    const coupon = pc.promotion.coupon;
    const percentOff = coupon && typeof coupon !== "string" ? coupon.percent_off ?? null : null;
    codes.push(toSummary(pc, percentOff));
  }
  return codes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I -- easy to read aloud
  let s = "OMNI-";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function createPromoCodes(
  count: number,
  percentOff: number,
  maxRedemptionsEach: number | null,
  expiresInDays: number | null,
): Promise<PromoCodeSummary[]> {
  const stripe = getStripeClient();
  const created: PromoCodeSummary[] = [];
  const expiresAt = expiresInDays ? Math.floor(Date.now() / 1000) + expiresInDays * 86400 : undefined;

  for (let i = 0; i < count; i++) {
    // duration:"once" -- Helen only runs one-time charges today, not
    // subscriptions, so "applies to the customer's next N months" doesn't
    // apply here the way it would for a recurring product.
    const coupon = await stripe.coupons.create({ percent_off: percentOff, duration: "once" });
    const pc = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code: randomCode(),
      max_redemptions: maxRedemptionsEach ?? undefined,
      expires_at: expiresAt,
    });
    created.push(toSummary(pc, coupon.percent_off ?? null));
  }
  return created;
}

export async function deactivatePromoCode(id: string): Promise<void> {
  const stripe = getStripeClient();
  await stripe.promotionCodes.update(id, { active: false });
}
