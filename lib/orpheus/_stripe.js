import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  ?.trim()
  .replace(/^['"]|['"]$/g, '')
  .replace(/\s+/g, '');

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2026-02-25.clover' })
  : null;

export function requireStripe() {
  if (!stripe) throw new Error('Payments are not configured yet.');
  return stripe;
}
