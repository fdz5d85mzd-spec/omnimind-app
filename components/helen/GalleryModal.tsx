"use client";

import { SHOP_ITEMS } from "@/lib/helen/domain";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";

interface GalleryModalProps {
  open: boolean;
  onClose: () => void;
  ownedItems: string[];
}

export function GalleryModal({ open, onClose, ownedItems }: GalleryModalProps) {
  const { t } = useLanguage();
  if (!open) return null;

  const owned = SHOP_ITEMS.filter((item) => ownedItems.includes(item.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[340px] rounded-2xl border border-helen-gold/15 bg-helen-ink-2 p-6">
        <h3 className="mb-1 text-center font-helen-display text-lg font-semibold">{t.galleryTitle}</h3>
        <p className="mb-4 text-center text-xs text-helen-dim">{t.gallerySub}</p>

        {owned.length === 0 ? (
          <p className="mb-5 text-center text-xs text-helen-dim">{t.galleryEmptyNote}</p>
        ) : (
          <div className="mb-5 grid grid-cols-3 gap-2.5">
            {owned.map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-1 rounded-xl bg-helen-card py-3.5">
                <span className="text-3xl">{item.icon}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl border border-white/15 py-[15px] text-[14.5px] font-medium text-helen-dim"
        >
          {t.closeLabel}
        </button>
      </div>
    </div>
  );
}
