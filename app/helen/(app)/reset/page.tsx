"use client";

import { useEffect, useState } from "react";

const KEYS = ["helen-profile", "helen-global-count", "helen-leaderboard", "helen-votes"];

/** Clears local mock data (not the Supabase auth session) so the app shows
 *  the join screen again — useful for re-testing the real payment flow
 *  without a stale local profile masking a failed webhook. */
export default function ResetPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    KEYS.forEach((k) => window.localStorage.removeItem(k));
    setDone(true);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="mb-4 text-[13px] text-helen-dim">
        {done ? "Local data cleared." : "Clearing…"}
      </p>
      {done && (
        <a href="/helen" className="text-sm font-semibold text-helen-gold">
          Go to HELEN →
        </a>
      )}
    </div>
  );
}
