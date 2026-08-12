import { hash } from './_security.js';
import { FREE_LIMIT } from './_plans.js';
import { sql } from './_db.js';

function cookieValue(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  const item = cookies.find((entry) => entry.trim().startsWith(`${name}=`));
  return item ? decodeURIComponent(item.trim().slice(name.length + 1)) : null;
}

export async function getEntitlement(req) {
  const token = cookieValue(req, 'orpheus_entitlement');
  if (!token) return { kind: 'free', maxTransfer: FREE_LIMIT, monthlyQuota: FREE_LIMIT };
  const rows = await sql`SELECT id, kind, plan, status, max_transfer_bytes, monthly_quota_bytes, used_bytes, current_period_end, consumed_at
    FROM entitlements WHERE access_token_hash = ${hash(token)} LIMIT 1`;
  const item = rows[0];
  if (!item || item.status !== 'active' || (item.current_period_end && new Date(item.current_period_end) <= new Date())) {
    return { kind: 'free', maxTransfer: FREE_LIMIT, monthlyQuota: FREE_LIMIT };
  }
  return {
    id: item.id,
    kind: item.kind,
    plan: item.plan,
    maxTransfer: Number(item.max_transfer_bytes),
    monthlyQuota: Number(item.monthly_quota_bytes),
    used: Number(item.used_bytes),
    consumedAt: item.consumed_at,
  };
}

export async function reserveUsage(tx, entitlement, bytes) {
  if (bytes > entitlement.maxTransfer) throw new Error(`This allowance supports up to ${(entitlement.maxTransfer / 1024 ** 3).toFixed(2)} GB per transfer.`);
  if (entitlement.kind === 'free') return;
  const locked = await tx`SELECT kind, status, monthly_quota_bytes, used_bytes, consumed_at FROM entitlements WHERE id = ${entitlement.id} FOR UPDATE`;
  const row = locked[0];
  if (!row || row.status !== 'active') throw new Error('Your payment allowance is not active.');
  if (row.kind === 'one_time') {
    if (row.consumed_at) throw new Error('This one-time transfer has already been used.');
    await tx`UPDATE entitlements SET consumed_at = NOW(), used_bytes = ${bytes} WHERE id = ${entitlement.id}`;
    return;
  }
  if (Number(row.used_bytes) + bytes > Number(row.monthly_quota_bytes)) throw new Error('Your monthly transfer allowance has been reached.');
  await tx`UPDATE entitlements SET used_bytes = used_bytes + ${bytes} WHERE id = ${entitlement.id}`;
}
