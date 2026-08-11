"use client";

import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";

interface CharityPopupProps {
  open: boolean;
  onClose: () => void;
}

/** One-time "where your euro goes" popup, shown once per device on first
 *  Home visit after joining -- see lib/helen/data/charityPopupRepo.ts. The
 *  15% figure is IMPACT_SHARE (lib/helen/domain.ts), the same number that
 *  drives the fund totals shown on the Impact tab, not a separate claim. */
export function CharityPopup({ open, onClose }: CharityPopupProps) {
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-helen-card-in w-full max-w-[320px] rounded-2xl border border-helen-gold/35 bg-gradient-to-br from-[#3A2C4A] to-helen-ink p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="mb-3 text-4xl">🌍</div>
        <h2 className="mb-2 font-helen-display text-lg font-semibold text-helen-gold">{t.charityPopupTitle}</h2>
        <p className="mb-5 text-[13px] leading-relaxed text-helen-dim">{t.charityNote}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-helen-coral py-[13px] text-[14px] font-bold text-helen-ink"
        >
          {t.charityPopupDismiss}
        </button>
      </div>
    </div>
  );
}
