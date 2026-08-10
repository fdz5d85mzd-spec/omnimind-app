"use client";

import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";
import type { Missions } from "@/lib/helen/types";

export default function MissionsTab() {
  const { t } = useLanguage();
  const { profile, claimReward } = useProfile();

  if (!profile) return null;

  const rows: { key: keyof Missions; label: string }[] = [
    { key: "feed", label: t.missionFeed },
    { key: "play", label: t.missionPlay },
    { key: "clean", label: t.missionClean },
    { key: "share", label: t.missionShare },
  ];
  const allDone =
    profile.missions.feed && profile.missions.play && profile.missions.clean && profile.missions.share;

  return (
    <>
      <div className="mb-4 font-helen-display text-[17px] font-semibold">{t.missionsTitle}</div>
      {rows.map((row) => {
        const done = profile.missions[row.key];
        return (
          <div key={row.key} className="mb-2 flex items-center gap-2.5 rounded-[10px] bg-helen-card p-3 text-[13px]">
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                done ? "border-helen-sage bg-helen-sage text-helen-ink" : "border-helen-dim"
              }`}
            >
              {done && "✓"}
            </div>
            <span className={done ? "text-helen-dim line-through" : ""}>{row.label}</span>
          </div>
        );
      })}
      <div className="flex-1" />
      <button
        type="button"
        disabled={profile.rewardClaimedToday}
        onClick={claimReward}
        className="w-full rounded-xl bg-helen-coral py-[15px] text-[14.5px] font-bold text-helen-ink disabled:opacity-60"
      >
        {profile.rewardClaimedToday ? t.rewardClaimedLabel : t.claimRewardBtn}
      </button>
      {allDone && <div className="mt-2.5 text-center text-xs text-helen-gold">{t.allMissionsDone}</div>}
    </>
  );
}
