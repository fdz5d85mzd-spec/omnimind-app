const REF_KEY = "helen_ref_code";

/** Sticky across the join funnel: captured once on landing, read back at
 * checkout, regardless of how many pages sit between the two. */
export function getReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REF_KEY);
}

export function captureReferralCode(search: string): void {
  if (typeof window === "undefined") return;
  const ref = new URLSearchParams(search).get("ref");
  if (ref) window.localStorage.setItem(REF_KEY, ref.trim().toUpperCase());
}
