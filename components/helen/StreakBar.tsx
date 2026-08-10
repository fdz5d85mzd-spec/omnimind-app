"use client";

import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";

interface StreakBarProps {
  /** Day 1-7 of the current 7-day cycle that's already been credited —
   *  everything up to and including this day renders as filled. */
  currentDay: number;
}

/** Compact 7-slot login streak tracker shown on the home screen — ticks one
 *  slot per consecutive daily login, resets visually at the start of a new
 *  cycle since currentDay wraps back to 1. */
export function StreakBar({ currentDay }: StreakBarProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-2.5 rounded-xl bg-black/30 px-3 py-2.5 backdrop-blur-sm">
      <div className="mb-1.5 flex items-center justify-between font-helen-num text-[10px] text-helen-dim">
        <span>🔥 {t.streakBarTitle}</span>
        <span className="text-helen-gold">
          {t.streakDayLabel} {currentDay}/7
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const filled = day <= currentDay;
          const isSeventh = day === 7;
          return (
            <div
              key={day}
              className={`flex h-6 flex-1 items-center justify-center rounded-md text-[10px] font-bold transition-colors ${
                filled
                  ? isSeventh
                    ? "bg-helen-gold text-helen-ink"
                    : "bg-helen-gold/60 text-helen-ink"
                  : "bg-white/10 text-helen-dim"
              }`}
            >
              {filled ? "✓" : isSeventh ? "🎁" : day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
