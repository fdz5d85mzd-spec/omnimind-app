"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { playRewardSound } from "@/lib/helen/sound";

interface RewardPopupProps {
  open: boolean;
  xp: number;
  title: string;
  note?: string;
  onClose: () => void;
}

/** Shared celebratory popup for the signup bonus and daily/weekly login
 *  rewards — plays playRewardSound() the moment it becomes visible. */
export function RewardPopup({ open, xp, title, note, onClose }: RewardPopupProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (open) playRewardSound();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-helen-card-in w-full max-w-[300px] rounded-2xl border border-helen-gold/35 bg-gradient-to-br from-[#3A2C4A] to-helen-ink p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="mb-2 text-4xl">🪙</div>
        <div className="mb-1.5 font-helen-num text-2xl font-bold text-helen-gold">+{xp} XP</div>
        <p className={note ? "mb-1 text-sm font-semibold text-helen-paper" : "mb-5 text-sm font-semibold text-helen-paper"}>
          {title}
        </p>
        {note && <p className="mb-5 text-xs text-helen-dim">{note}</p>}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-helen-coral py-[13px] text-[14px] font-bold text-helen-ink"
        >
          {t.closeLabel}
        </button>
      </div>
    </div>
  );
}
