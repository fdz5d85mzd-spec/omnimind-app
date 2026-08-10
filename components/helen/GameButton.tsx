"use client";

interface GameButtonProps {
  icon: string;
  label: string;
  tone: "coral" | "sage" | "gold";
  onClick?: () => void;
  done?: boolean;
  className?: string;
}

const TONE_GRADIENT: Record<GameButtonProps["tone"], string> = {
  coral: "linear-gradient(180deg, #FF9776 0%, #F2795C 55%, #D65E42 100%)",
  sage: "linear-gradient(180deg, #ABCB88 0%, #8FAE72 55%, #6E8F52 100%)",
  gold: "linear-gradient(180deg, #F5CC70 0%, #E8B54D 55%, #C4922F 100%)",
};

export function GameButton({ icon, label, tone, onClick, done, className }: GameButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={done}
      className={`group relative flex-1 overflow-hidden rounded-2xl border border-black/10 pb-2.5 pt-3 shadow-[0_6px_0_rgba(0,0,0,0.25),0_10px_16px_rgba(0,0,0,0.35)] transition-transform active:translate-y-[3px] active:shadow-[0_2px_0_rgba(0,0,0,0.25)] disabled:translate-y-[3px] disabled:opacity-60 disabled:shadow-[0_2px_0_rgba(0,0,0,0.25)] disabled:active:translate-y-[3px] ${className ?? ""}`}
      style={{ background: TONE_GRADIENT[tone] }}
    >
      <span className="pointer-events-none absolute inset-x-1 top-1 h-1/2 rounded-xl bg-gradient-to-b from-white/50 to-white/0" />
      <span className="relative flex flex-col items-center gap-1">
        <span className="text-[22px] leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
          {done ? "✓" : icon}
        </span>
        <span className="text-[11px] font-extrabold tracking-wide text-helen-ink drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">
          {label}
        </span>
      </span>
    </button>
  );
}
