import Stripe from "stripe";

// `managed_payments` is a newer Stripe account feature (auto tax on ad-hoc
// price_data line items) not yet in this SDK version's types — both checkout
// routes pass `managed_payments: { enabled: false }` to opt out of it until
// the project has real tax/VAT handling (see docs/GOING-LIVE.md).
export type SessionCreateParams = Stripe.Checkout.SessionCreateParams & {
  managed_payments?: { enabled: boolean };
};

let cached: Stripe | null = null;

/** Throws until STRIPE_SECRET_KEY is set — see supabase/schema.sql and docs/GOING-LIVE.md. */
export function getStripeClient(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Stripe is not configured: set STRIPE_SECRET_KEY");
  }
  cached = new Stripe(key);
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
