import { ensureSchema, sql } from '../../../lib/orpheus/_db.js';
import { randomKey, hash } from '../../../lib/orpheus/_security.js';
import { requireStripe } from '../../../lib/orpheus/_stripe.js';

export default async function handler(req, res) {
  const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const origin = `${protocol}://${req.headers.host}`;
  try {
    await ensureSchema();
    const stripe = requireStripe();
    const sessionId = String(req.query.session_id || '');
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
    if (session.status !== 'complete' || !['paid', 'no_payment_required'].includes(session.payment_status)) throw new Error('Payment is not complete.');
    const entitlementId = session.metadata?.entitlementId;
    if (!entitlementId) throw new Error('Payment allowance was not found.');
    const accessToken = randomKey();
    const subscription = typeof session.subscription === 'object' ? session.subscription : null;
    const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
    await sql`UPDATE entitlements SET status = 'active', access_token_hash = ${hash(accessToken)}, stripe_customer_id = ${String(session.customer || '') || null}, stripe_subscription_id = ${subscription?.id || null}, current_period_end = ${periodEnd}
      WHERE id = ${entitlementId} AND stripe_checkout_session_id = ${session.id}`;
    res.statusCode = 302;
    res.setHeader('Set-Cookie', `orpheus_entitlement=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);
    res.setHeader('Location', `${origin}/orpheus?billing=success#pricing`);
    return res.end();
  } catch (error) {
    console.error('activation_error', error);
    res.statusCode = 302;
    res.setHeader('Location', `${origin}/orpheus?billing=failed#pricing`);
    return res.end();
  }
}
