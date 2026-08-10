"use client";

import { useState } from "react";
import { contributionFor, cycleForCount, padId } from "@/lib/helen/domain";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";
import { useRealLeaderboard } from "@/lib/helen/useRealLeaderboard";
import { useRealStats } from "@/lib/helen/useRealStats";

type RankView = "founders" | "contributors";

export default function RankTab() {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const { globalCount } = useRealStats();
  const list = useRealLeaderboard();
  const [view, setView] = useState<RankView>("founders");

  if (!profile) return null;

  const founders = [...list].sort((a, b) => a.id - b.id);
  const contributors = [...list].sort((a, b) => b.totalContributed - a.totalContributed);
  const sorted = view === "founders" ? founders : contributors;
  const top = sorted.slice(0, 10);
  const myRank = sorted.findIndex((e) => e.id === profile.memberId) + 1;
  const meInTop = top.some((e) => e.id === profile.memberId);
  const cycle = cycleForCount(globalCount);

  return (
    <>
      <div className="mb-3 flex gap-1.5">
        {(["founders", "contributors"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${
              view === v ? "bg-helen-card text-helen-gold" : "text-helen-dim"
            }`}
          >
            {v === "founders" ? t.foundersTabLabel : t.contributorsTabLabel}
          </button>
        ))}
      </div>

      <div className="mb-1 font-helen-display text-[17px] font-semibold">
        {view === "founders" ? t.leaderboardTitle : t.topContributorsTitle}
      </div>
      <p className="mb-1 text-xs text-helen-dim">{view === "founders" ? t.leaderboardSub : t.topContributorsSub}</p>
      {view === "contributors" && (
        <p className="mb-4 text-[11px] text-helen-gold">
          {cycle !== null ? `${t.cycleLabel} #${cycle + 1} · ` : ""}
          {t.cycleRewardNote}
        </p>
      )}
      {view === "founders" && <div className="mb-4" />}

      {top.map((entry, i) => (
        <div
          key={entry.id}
          className={`mb-2 flex items-center gap-2.5 rounded-[10px] bg-helen-card px-3 py-2.5 ${
            entry.id === profile.memberId ? "border border-helen-gold" : ""
          }`}
        >
          <div className="w-6 font-helen-num font-bold text-helen-gold">
            {view === "contributors" && i < 3 ? "🏆" : `#${i + 1}`}
          </div>
          <div className="flex-1 font-helen-num text-[13px]">
            {entry.username ?? `Member ${padId(entry.id)}`}
            <div className="text-[9px] text-helen-dim">{entry.tier}</div>
          </div>
          {view === "contributors" && (
            <div className="font-helen-num text-xs text-helen-sage">{entry.totalContributed.toFixed(2)} €</div>
          )}
        </div>
      ))}
      {!meInTop && myRank > 0 && (
        <div className="mb-2 flex items-center gap-2.5 rounded-[10px] border border-helen-gold bg-helen-card px-3 py-2.5">
          <div className="w-6 font-helen-num font-bold text-helen-gold">#{myRank}</div>
          <div className="flex-1 font-helen-num text-[13px]">
            {profile.username ?? `Member ${padId(profile.memberId)}`} ({t.yourRankLabel})
            <div className="text-[9px] text-helen-dim">{profile.tier}</div>
          </div>
          {view === "contributors" && (
            <div className="font-helen-num text-xs text-helen-sage">
              {contributionFor(profile.ownedItems).toFixed(2)} €
            </div>
          )}
        </div>
      )}
    </>
  );
}
