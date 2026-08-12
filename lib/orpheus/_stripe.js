import Stripe from 'stripe';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
  : null;

export function requireStripe() {
  if (!stripe) throw new Error('Payments are not configured yet.');
  return stripe;
}
