import crypto from 'node:crypto';
import { ensureSchema, sql } from '../../../lib/orpheus/_db.js';
import { GB, oneTimePrice, PLANS } from '../../../lib/orpheus/_plans.js';
import { requireStripe } from '../../../lib/orpheus/_stripe.js';
import { json } from '../../../lib/orpheus/_security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  try {
    await ensureSchema();
    const stripe = requireStripe();
    const id = crypto.randomUUID();
    const plan = req.body?.plan;
    const requestedGb = Number(req.body?.gb);
    let config;
    let kind;

    if (plan && PLANS[plan]) {
      config = PLANS[plan];
      kind = 'subscription';
    } else if (Number.isInteger(requestedGb) && requestedGb >= 1 && requestedGb <= 1024) {
      config = { name: `Atlas ${requestedGb === 1024 ? '1 TB' : `${requestedGb} GB`} transfer`, price: oneTimePrice(requestedGb), maxTransfer: requestedGb * GB, monthlyQuota: requestedGb * GB };
      kind = 'one_time';
    } else {
      return json(res, 400, { error: 'Invalid plan or transfer size.' });
    }

    await sql`INSERT INTO entitlements (id, kind, plan, max_transfer_bytes, monthly_quota_bytes)
      VALUES (${id}, ${kind}, ${plan || null}, ${config.maxTransfer}, ${config.monthlyQuota})`;

    const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const origin = `${protocol}://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: kind === 'subscription' ? 'subscription' : 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: config.price,
          product_data: { name: config.name, description: kind === 'one_time' ? 'One private transfer, available for 7 days' : `${config.monthlyQuota / GB} GB monthly transfer volume` },
          ...(kind === 'subscription' ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      }],
      metadata: { type: 'orpheus_entitlement', entitlementId: id, kind, plan: plan || '', gb: String(config.maxTransfer / GB) },
      subscription_data: kind === 'subscription' ? { metadata: { type: 'orpheus_entitlement', source: 'orpheus', entitlementId: id, plan } } : undefined,
      payment_intent_data: kind === 'one_time' ? { metadata: { source: 'orpheus' } } : undefined,
      managed_payments: { enabled: false },
      success_url: `${origin}/api/orpheus/activate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/atlas#pricing`,
      allow_promotion_codes: kind === 'subscription',
    });
    await sql`UPDATE entitlements SET stripe_checkout_session_id = ${session.id} WHERE id = ${id}`;
    return json(res, 200, { url: session.url });
  } catch (error) {
    console.error('checkout_error', error);
    return json(res, 503, { error: error.message || 'Checkout is unavailable.' });
  }
}
