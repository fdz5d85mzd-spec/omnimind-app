import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient, isStripeConfigured } from "@/lib/helen/stripe/server";
import { HELEN_CHARITY_PERCENT } from "@/lib/billing";

export type Totals = { grossCents: number; count: number };
export type PeriodSplit = { helen: Totals; other: Totals };

export type RevenueSnapshot = {
  stripeConfigured: boolean;
  stripeError: boolean;
  today: PeriodSplit;
  month: PeriodSplit;
  allTime: PeriodSplit;
  users: number | null;
  newToday: number | null;
  new7d: number | null;
  voxProjects: number | null;
};

export type HelenCharitySplit = { grossCents: number; charityCents: number; netCents: number };

export function splitHelenCharity(grossCents: number): HelenCharitySplit {
  const charityCents = Math.round(grossCents * HELEN_CHARITY_PERCENT);
  return { grossCents, charityCents, netCents: grossCents - charityCents };
}

const ZERO_TOTALS: Totals = { grossCents: 0, count: 0 };
const ZERO_SPLIT: PeriodSplit = { helen: ZERO_TOTALS, other: ZERO_TOTALS };

// Reads `source` off the PaymentIntent, not the Charge or the Session --
// Stripe does not auto-copy metadata between those three, and PaymentIntent
// is the one every checkout route in this app actually tags (see
// app/helen/api/checkout and app/api/billing/checkout). Same proven pattern
// as lib/adminPartners.ts's `ref_code` read. Untagged PaymentIntents (every
// charge before this split existed) default to Helen -- historically
// accurate, since Helen's €1 membership was the only thing this account
// ever charged for until OmniMind's own paid tiers shipped.
async function sumSucceededByPeriod(stripe: Stripe, sinceUnixSeconds: number): Promise<PeriodSplit> {
  const helen: Totals = { grossCents: 0, count: 0 };
  const other: Totals = { grossCents: 0, count: 0 };
  const params: Stripe.PaymentIntentListParams = { limit: 100 };
  if (sinceUnixSeconds > 0) params.created = { gte: sinceUnixSeconds };
  for await (const pi of stripe.paymentIntents.list(params)) {
    if (pi.status !== "succeeded") continue;
    const bucket = pi.metadata?.source === "helen" || !pi.metadata?.source ? helen : other;
    bucket.grossCents += pi.amount_received;
    bucket.count += 1;
  }
  return { helen, other };
}

// Real numbers only: every figure here comes from a live Stripe query or a
// live Prisma count, never a placeholder. On a Stripe account with no
// charges yet (or DATABASE_URL still unset), that honestly means zeros.
export async function getRevenueSnapshot(): Promise<RevenueSnapshot> {
  const now = new Date();
  const startOfToday = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
  const startOfMonth = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [users, newToday, new7d, voxProjects] = await Promise.all([
    prisma.user.count().catch(() => null),
    prisma.user.count({ where: { createdAt: { gte: dayAgo } } }).catch(() => null),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }).catch(() => null),
    prisma.voxProject.count().catch(() => null),
  ]);

  if (!isStripeConfigured()) {
    return {
      stripeConfigured: false,
      stripeError: false,
      today: ZERO_SPLIT,
      month: ZERO_SPLIT,
      allTime: ZERO_SPLIT,
      users,
      newToday,
      new7d,
      voxProjects,
    };
  }

  // A bad/expired key, a restricted key missing PaymentIntent read
  // permission, or a transient Stripe API error must never crash this
  // whole page -- Prisma's reads two lines up already get this same
  // treatment. Real revenue figures are worth waiting for, not worth an
  // "Application error" screen over.
  try {
    const stripe = getStripeClient();
    const [today, month, allTime] = await Promise.all([
      sumSucceededByPeriod(stripe, startOfToday),
      sumSucceededByPeriod(stripe, startOfMonth),
      sumSucceededByPeriod(stripe, 0),
    ]);
    return { stripeConfigured: true, stripeError: false, today, month, allTime, users, newToday, new7d, voxProjects };
  } catch (err) {
    console.error("getRevenueSnapshot: Stripe read failed", err);
    return {
      stripeConfigured: true,
      stripeError: true,
      today: ZERO_SPLIT,
      month: ZERO_SPLIT,
      allTime: ZERO_SPLIT,
      users,
      newToday,
      new7d,
      voxProjects,
    };
  }
}
