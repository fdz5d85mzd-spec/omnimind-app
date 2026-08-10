import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient, isStripeConfigured } from "@/lib/helen/stripe/server";

export type Totals = { grossCents: number; count: number };

export type RevenueSnapshot = {
  stripeConfigured: boolean;
  today: Totals;
  month: Totals;
  allTime: Totals;
  users: number | null;
  newToday: number | null;
  new7d: number | null;
  voxProjects: number | null;
};

async function sumSucceededCharges(stripe: Stripe, sinceUnixSeconds: number): Promise<Totals> {
  let grossCents = 0;
  let count = 0;
  const params: Stripe.ChargeListParams = { limit: 100 };
  if (sinceUnixSeconds > 0) params.created = { gte: sinceUnixSeconds };
  for await (const charge of stripe.charges.list(params)) {
    if (charge.status === "succeeded" && charge.paid && !charge.refunded) {
      grossCents += charge.amount;
      count += 1;
    }
  }
  return { grossCents, count };
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
      today: { grossCents: 0, count: 0 },
      month: { grossCents: 0, count: 0 },
      allTime: { grossCents: 0, count: 0 },
      users,
      newToday,
      new7d,
      voxProjects,
    };
  }

  const stripe = getStripeClient();
  const [today, month, allTime] = await Promise.all([
    sumSucceededCharges(stripe, startOfToday),
    sumSucceededCharges(stripe, startOfMonth),
    sumSucceededCharges(stripe, 0),
  ]);

  return { stripeConfigured: true, today, month, allTime, users, newToday, new7d, voxProjects };
}
