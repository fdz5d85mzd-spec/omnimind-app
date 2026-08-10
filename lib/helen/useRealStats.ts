"use client";

import { useEffect, useState } from "react";
import { getGlobalCount } from "./data/globalRepo";
import { getShopRevenue } from "./data/shopRevenueRepo";

interface RealStats {
  globalCount: number;
  shopRevenue: number;
}

/**
 * Global member count + shop revenue behind the "Members worldwide" and
 * Impact Fund totals. These feed a public charity-funding commitment, so
 * they must reflect the real members/shop_purchases tables (via
 * /api/stats) rather than the per-browser localStorage mock counters in
 * lib/data/* — those only remain as the initial paint and the fallback for
 * local dev without Supabase configured.
 */
export function useRealStats(): RealStats {
  const [stats, setStats] = useState<RealStats>(() => ({
    globalCount: getGlobalCount(),
    shopRevenue: getShopRevenue(),
  }));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/helen/api/stats");
        if (!res.ok) return;
        const data = (await res.json()) as {
          configured: boolean;
          memberCount: number | null;
          shopRevenueEur: number | null;
        };
        if (!cancelled && data.configured && data.memberCount !== null && data.shopRevenueEur !== null) {
          setStats({ globalCount: data.memberCount, shopRevenue: data.shopRevenueEur });
        }
      } catch {
        // Supabase not reachable — keep whatever we already have (local
        // fallback or the last successfully fetched real numbers).
      }
    }

    load();
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return stats;
}
