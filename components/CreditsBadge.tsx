"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCredits } from "@/lib/useCredits";
import { FREE_STARTING_CREDITS } from "@/lib/credits";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Always-visible balance indicator (not tucked away inside the account
// popover): a ring showing balance as a fraction of a full free refill,
// the exact number, and -- only while actually in cooldown -- a live
// countdown to the next automatic refill. Clicking it goes to Settings,
// where the full plan/credit picture lives.
export default function CreditsBadge({ className = "" }: { className?: string }) {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const credits = useCredits();
  const privileged = Boolean(session?.user?.isMaster || session?.user?.isAdmin);
  const [now, setNow] = useState(() => Date.now());

  const cooldownUntil = credits?.cooldownUntil ? new Date(credits.cooldownUntil).getTime() : null;
  const inCooldown = Boolean(cooldownUntil && cooldownUntil > now);

  useEffect(() => {
    if (!inCooldown) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [inCooldown]);

  if (!session?.user) return null;

  const balance = credits?.creditBalance ?? 0;
  const pct = privileged ? 100 : Math.max(0, Math.min(100, (balance / FREE_STARTING_CREDITS) * 100));
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <Link
      href="/settings"
      className={`flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-accent/30 px-2.5 py-1.5 transition-colors ${className}`}
      title={t.settingsPlanTitle}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0 -rotate-90">
        <circle cx="10" cy="10" r={radius} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/10" />
        <circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={!privileged && pct <= 20 ? "text-crimson" : "text-amber"}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="flex flex-col leading-tight min-w-0">
        <span className="text-xs font-semibold text-white tabular-nums whitespace-nowrap">
          {privileged ? t.creditsUnlimited : `${balance} ${t.settingsCreditsLabel}`}
        </span>
        {inCooldown && cooldownUntil && (
          <span className="text-[10px] text-mutedDark tabular-nums whitespace-nowrap">
            {t.creditsRefillsIn.replace("{time}", formatCountdown(cooldownUntil - now))}
          </span>
        )}
      </span>
    </Link>
  );
}
