// Credit cost is proportional to actual output — not a flat fee per
// message. The backend's /agent/run/stream `done` event already includes
// the full answer text, so cost is derived from real character count
// (a token-count-based metric isn't available yet — the LLM layer doesn't
// currently capture provider usage data — but this is a genuine proxy for
// work done, not an arbitrary per-message charge).
export const CHARS_PER_CREDIT = 400;
export const FREE_STARTING_CREDITS = 200;
export const FREE_COOLDOWN_HOURS = 4;
export const FREE_REFILL_CREDITS = 50;

export function creditsForAnswer(chars: number): number {
  return Math.max(1, Math.ceil(chars / CHARS_PER_CREDIT));
}

export type CreditGate =
  | { allowed: true }
  | { allowed: false; reason: "cooldown"; retryAt: string }
  | { allowed: false; reason: "no_credits" };

export function checkCreditGate(user: { plan: string; creditBalance: number; cooldownUntil: Date | null }): CreditGate {
  if (user.cooldownUntil && user.cooldownUntil.getTime() > Date.now()) {
    return { allowed: false, reason: "cooldown", retryAt: user.cooldownUntil.toISOString() };
  }
  if (user.plan === "free" && user.creditBalance <= 0) {
    return { allowed: false, reason: "no_credits" };
  }
  // Paid plans with a depleted balance still need a real "add credits" flow
  // (payment processing) before they can go negative — until that's wired
  // up, treat a depleted paid balance the same as free (blocked, no fake
  // unlimited access) rather than silently letting cost run away.
  if (user.plan !== "free" && user.creditBalance <= 0) {
    return { allowed: false, reason: "no_credits" };
  }
  return { allowed: true };
}
