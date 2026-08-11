export const GUEST_TRIAL_COOKIE = "omnimind_guest_trial_started";
export const GUEST_TRIAL_MINUTES = 5;

export function guestTrialRemainingMs(startedAtIso: string): number {
  const startedAt = Date.parse(startedAtIso);
  if (Number.isNaN(startedAt)) return 0;
  const elapsed = Date.now() - startedAt;
  return Math.max(0, GUEST_TRIAL_MINUTES * 60_000 - elapsed);
}
