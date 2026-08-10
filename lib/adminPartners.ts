import { prisma } from "@/lib/prisma";
import { getStripeClient, isStripeConfigured } from "@/lib/helen/stripe/server";

export type PartnerSummary = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  commissionPct: number;
  active: boolean;
  createdAt: string;
  attributedGrossCents: number;
  attributedCharges: number;
  commissionOwedCents: number;
};

/** Validates a ref code from an untrusted client against real, active
 * partners -- returns the canonical code to tag the Stripe session with,
 * or null if it doesn't match anything (an invalid/typo'd code is silently
 * dropped rather than blocking checkout). */
export async function resolveActivePartnerCode(rawCode: string | null | undefined): Promise<string | null> {
  const code = rawCode?.trim().toUpperCase();
  if (!code) return null;
  const partner = await prisma.partner.findUnique({ where: { referralCode: code } });
  return partner?.active ? partner.referralCode : null;
}

function randomPartnerCode(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "PARTNER";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suffix}`;
}

export async function createPartner(name: string, email: string, commissionPct: number) {
  return prisma.partner.create({
    data: { name, email, commissionPct, referralCode: randomPartnerCode(name) },
  });
}

export async function deactivatePartner(id: string) {
  return prisma.partner.update({ where: { id }, data: { active: false } });
}

/** Sums real Stripe PaymentIntents tagged { ref_code: partner.referralCode }
 * -- that's where the tag actually lands (see app/helen/api/checkout's
 * payment_intent_data), not on the Charge or the Session, both of which
 * have their own independent metadata that Stripe does not auto-copy from
 * the PaymentIntent. Every number here is traceable back to a real,
 * succeeded payment; nothing is estimated. */
export async function listPartnersWithCommission(): Promise<PartnerSummary[]> {
  const partners = await prisma.partner.findMany({ orderBy: { createdAt: "desc" } });
  if (partners.length === 0) return [];

  const byCode = new Map(partners.map((p) => [p.referralCode, { grossCents: 0, count: 0 }]));

  if (isStripeConfigured()) {
    const stripe = getStripeClient();
    for await (const pi of stripe.paymentIntents.list({ limit: 100 })) {
      if (pi.status !== "succeeded") continue;
      const refCode = pi.metadata?.ref_code;
      const bucket = refCode ? byCode.get(refCode) : undefined;
      if (bucket) {
        bucket.grossCents += pi.amount_received;
        bucket.count += 1;
      }
    }
  }

  return partners.map((p) => {
    const bucket = byCode.get(p.referralCode) ?? { grossCents: 0, count: 0 };
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      referralCode: p.referralCode,
      commissionPct: p.commissionPct,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      attributedGrossCents: bucket.grossCents,
      attributedCharges: bucket.count,
      commissionOwedCents: Math.round((bucket.grossCents * p.commissionPct) / 100),
    };
  });
}
