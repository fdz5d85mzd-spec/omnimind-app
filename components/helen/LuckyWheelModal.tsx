"use client";

import { useEffect, useState } from "react";
import { getLastSpinAt, msUntilNextSpin, recordSpin } from "@/lib/helen/data/luckyWheelRepo";
import { rollWheelSegmentIndex, WHEEL_SEGMENTS } from "@/lib/helen/domain";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";
import { playPokeSound, playRewardSound } from "@/lib/helen/sound";

interface LuckyWheelModalProps {
  open: boolean;
  onClose: () => void;
  /** The one-time 45s-after-signup auto-open uses a slightly different
   *  welcoming header than every subsequent manual open. */
  firstTime?: boolean;
}

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;
const SEGMENT_COLORS = ["#E8722F", "#8FAE72", "#E8B54D", "#7A5C99", "#E8722F", "#8FAE72", "#E8B54D", "#7A5C99"];
const SPIN_MS = 3200;

function formatCountdown(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function LuckyWheelModal({ open, onClose, firstTime }: LuckyWheelModalProps) {
  const { t } = useLanguage();
  const { spinWheel } = useProfile();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setRemainingMs(msUntilNextSpin());
  }, [open]);

  useEffect(() => {
    const countdownRunning = open && remainingMs > 0;
    if (!countdownRunning) return;
    const id = setInterval(() => {
      setRemainingMs(msUntilNextSpin());
    }, 1000);
    return () => clearInterval(id);
  }, [open, remainingMs]);

  if (!open) return null;

  const canSpin = getLastSpinAt() === null || remainingMs <= 0;

  function handleSpin() {
    if (!canSpin || spinning) return;
    setSpinning(true);
    setResult(null);
    const index = rollWheelSegmentIndex();
    const targetCenter = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const baseRotation = (360 - targetCenter) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = ((baseRotation - currentMod) % 360 + 360) % 360;
    const spins = 6;
    setRotation((r) => r + spins * 360 + delta);

    setTimeout(() => {
      const xpWon = WHEEL_SEGMENTS[index].xp;
      spinWheel(xpWon);
      recordSpin();
      setResult(xpWon);
      setSpinning(false);
      setRemainingMs(msUntilNextSpin());
      if (xpWon > 0) playRewardSound();
      else playPokeSound();
    }, SPIN_MS);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !spinning) onClose();
      }}
    >
      <div className="w-full max-w-[320px] rounded-2xl border border-helen-gold/25 bg-helen-ink-2 p-6 text-center">
        <h3 className="mb-1 font-helen-display text-lg font-semibold">
          {firstTime ? t.luckyWheelFirstPopupTitle : t.luckyWheelTitle}
        </h3>
        <p className="mb-5 text-xs text-helen-dim">{firstTime ? t.luckyWheelFirstPopupSub : t.luckyWheelSub}</p>

        <div className="relative mx-auto mb-5 h-[220px] w-[220px]">
          <div
            className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "16px solid #E8B54D",
            }}
          />
          <div
            className="relative h-full w-full overflow-hidden rounded-full border-4 border-helen-gold/40 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15,0.8,0.15,1)` : "none",
              background: `conic-gradient(${WHEEL_SEGMENTS.map(
                (_, i) => `${SEGMENT_COLORS[i]} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`,
              ).join(", ")})`,
            }}
          >
            {WHEEL_SEGMENTS.map((seg, i) => {
              const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 font-helen-num text-[13px] font-bold text-helen-ink"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-78px) rotate(${-angle}deg) translate(-50%, -50%)`,
                  }}
                >
                  {seg.label}
                </div>
              );
            })}
          </div>
        </div>

        {result !== null && (
          <p className="mb-4 text-sm font-semibold text-helen-gold">
            {result > 0 ? `🪙 ${t.luckyWheelWinNote} +${result} XP` : t.luckyWheelLoseNote}
          </p>
        )}

        {canSpin ? (
          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning}
            className="w-full rounded-xl bg-helen-coral py-[13px] text-[14px] font-bold text-helen-ink disabled:opacity-60"
          >
            {spinning ? t.luckyWheelSpinningLabel : t.luckyWheelSpinBtn}
          </button>
        ) : (
          <div className="w-full rounded-xl bg-white/[0.06] py-[13px] text-[13px] font-semibold text-helen-dim">
            {t.luckyWheelNextSpinLabel} {formatCountdown(remainingMs)}
          </div>
        )}

        {!spinning && (
          <button type="button" onClick={onClose} className="mt-3 text-xs font-semibold text-helen-dim">
            {t.closeLabel}
          </button>
        )}
      </div>
    </div>
  );
}
