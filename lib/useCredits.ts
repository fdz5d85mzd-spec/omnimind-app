"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type CreditState = {
  creditBalance: number;
  plan: string;
  cooldownUntil: string | null;
  creditsRenewAt: string | null;
  allowance: number;
} | null;

const REFRESH_EVENT = "omnimind:credits-refresh";

// Call after any action that spends credits so every mounted useCredits()
// instance (e.g. the sidebar balance) updates immediately, instead of
// waiting up to `pollMs` for its next scheduled poll.
export function notifyCreditsChanged() {
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

export function useCredits(pollMs = 12000) {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<CreditState>(null);

  useEffect(() => {
    if (!session?.user) {
      setCredits(null);
      return;
    }
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/credits");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCredits(data);
      } catch {
        // transient — next poll will retry
      }
    }
    poll();
    const interval = setInterval(poll, pollMs);
    window.addEventListener(REFRESH_EVENT, poll);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener(REFRESH_EVENT, poll);
    };
  }, [session?.user, pollMs]);

  return credits;
}
