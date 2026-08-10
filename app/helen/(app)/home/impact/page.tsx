"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getVotes } from "@/lib/helen/data/votesRepo";
import {
  CYCLE_POOL,
  IMPACT_SHARE,
  MEMBERSHIP_PRICE_EUR,
  cycleForCount,
  orgsForCycle,
  queueAfterCycle,
  splitPool,
} from "@/lib/helen/domain";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";
import type { VoteMap } from "@/lib/helen/types";
import { useRealStats } from "@/lib/helen/useRealStats";

export default function ImpactTab() {
  const { t } = useLanguage();
  const { profile, vote } = useProfile();
  const { globalCount, shopRevenue } = useRealStats();
  const [votes, setVotes] = useState<VoteMap>({});

  useEffect(() => {
    setVotes(getVotes());
    const interval = setInterval(() => setVotes(getVotes()), 20000);
    return () => clearInterval(interval);
  }, []);

  if (!profile) return null;

  const currentCycle = cycleForCount(globalCount);
  // Membership dues + a slice of shop revenue both feed the fund — see
  // lib/domain.ts's contributionFor and lib/ProfileProvider.tsx's purchaseItem.
  const totalMembershipRevenue = globalCount * MEMBERSHIP_PRICE_EUR;
  const totalFund = Math.round((totalMembershipRevenue + shopRevenue) * IMPACT_SHARE);
  const activeOrgs = orgsForCycle(currentCycle);
  const splits = splitPool(CYCLE_POOL, activeOrgs, votes, currentCycle);
  const alreadyVoted = profile.votedCycle === currentCycle;
  const queue = queueAfterCycle(currentCycle);

  const firstGoalPct = Math.min(100, Math.round((totalFund / CYCLE_POOL) * 100));
  const firstGoalReached = totalFund >= CYCLE_POOL;

  const pastCycles = [];
  for (let c = currentCycle - 1; c >= 0 && c >= currentCycle - 4; c--) {
    pastCycles.push({ cycle: c, splits: splitPool(CYCLE_POOL, orgsForCycle(c), votes, c) });
  }

  function handleVote(orgId: number) {
    vote(currentCycle, orgId);
    setVotes(getVotes());
  }

  return (
    <>
      <div className="mb-1 font-helen-display text-[17px] font-semibold">{t.charityTitle}</div>
      <p className="mb-4 text-xs text-helen-dim">{t.charitySub}</p>

      <div className="mb-3.5 rounded-xl bg-helen-card p-4.5 text-center">
        <div className="font-helen-num text-[28px] font-bold text-helen-sage">
          {totalFund.toLocaleString("en-US")} €
        </div>
        <div className="mt-1.5 text-xs text-helen-sage">
          {t.cycleLabel} #{currentCycle + 1} — {CYCLE_POOL.toLocaleString("en-US")} € {t.fundPoolLabel}
        </div>
      </div>
      <div className="mb-3.5 rounded-xl bg-helen-card p-3.5">
        <div className="mb-1.5 flex items-center justify-between font-helen-num text-[11px]">
          <span className="text-helen-paper">{t.fundingGoalTitle}</span>
          <span className="text-helen-gold">
            {totalFund.toLocaleString("en-US")} / {CYCLE_POOL.toLocaleString("en-US")} €
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-helen-gold transition-[width]" style={{ width: `${firstGoalPct}%` }} />
        </div>
        <p className="mt-1.5 text-[11px] text-helen-dim">
          {firstGoalReached ? t.fundingGoalReachedNote : t.fundingGoalSub}
        </p>
      </div>
      <div className="mb-3.5 rounded-lg bg-helen-sage/10 px-2.5 py-2 text-[11px] text-helen-dim">
        {t.demoOrgsNote}
      </div>

      <div className="mb-1.5 font-helen-display text-sm font-semibold">{t.activeVoteTitle}</div>
      {splits.map((s) => {
        const pct = Math.round((s.amount / CYCLE_POOL) * 100);
        const isMine = alreadyVoted && profile.votedOrgId === s.org.id;
        return (
          <div key={s.org.id} className="mb-2.5 rounded-[10px] bg-helen-card p-3">
            <div className="mb-1.5 flex items-start justify-between gap-2.5">
              <div>
                <div className="text-[13px] font-semibold">{s.org.name}</div>
                <div className="mt-0.5 text-[10px] text-helen-dim">
                  {s.org.category} · {s.org.region}
                </div>
              </div>
              <button
                type="button"
                disabled={alreadyVoted}
                onClick={() => handleVote(s.org.id)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold disabled:cursor-default disabled:opacity-50 ${
                  isMine ? "bg-helen-sage text-helen-ink" : "bg-helen-coral text-helen-ink"
                }`}
              >
                {isMine ? t.votedLabel : t.voteBtn}
              </button>
            </div>
            <div className="my-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full bg-helen-sage" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-helen-dim">
              <span>{s.votes} votes</span>
              <span>{Math.round(s.amount).toLocaleString("en-US")} €</span>
            </div>
          </div>
        );
      })}
      <p className="mt-1 text-[11px] text-helen-dim">{t.guaranteedNote}</p>

      <div className="mb-1.5 mt-3.5 font-helen-display text-sm font-semibold">{t.queueTitle}</div>
      {queue.map((o) => (
        <div key={o.id} className="flex justify-between border-b border-white/[0.06] py-1.5 text-xs text-helen-dim">
          <span>{o.name}</span>
          <span>{o.category}</span>
        </div>
      ))}

      <div className="mb-1.5 mt-3.5 font-helen-display text-sm font-semibold">{t.pastCyclesTitle}</div>
      {pastCycles.map(({ cycle, splits: pastSplits }) => (
        <div key={cycle} className="mb-2 rounded-[10px] bg-helen-card px-3 py-2.5">
          <div className="mb-1.5 font-helen-num text-[11px] text-helen-gold">
            {t.cycleLabel} #{cycle + 1}
          </div>
          {pastSplits.map((s) => (
            <div key={s.org.id} className="flex justify-between py-0.5 text-xs">
              <span>{s.org.name}</span>
              <span className="font-helen-num text-helen-sage">{Math.round(s.amount).toLocaleString("en-US")} €</span>
            </div>
          ))}
        </div>
      ))}

      <Link
        href="/helen/apply-charity"
        className="mt-4 block rounded-xl border border-helen-gold/25 bg-helen-gold/10 px-4 py-3 text-center text-[12px] font-semibold text-helen-gold"
      >
        {t.applyCharityLink}
      </Link>
    </>
  );
}
