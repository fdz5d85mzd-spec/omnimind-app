"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { playConfirmSound } from "@/lib/helen/sound";

interface RenameCreatureModalProps {
  open: boolean;
  onClose: () => void;
  currentName: string | null;
  onSave: (name: string) => void;
}

export function RenameCreatureModal({ open, onClose, currentName, onSave }: RenameCreatureModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(currentName ?? "");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[340px] rounded-2xl border border-helen-gold/15 bg-helen-ink-2 p-6 text-center">
        <h3 className="mb-3.5 font-helen-display text-lg font-semibold">{t.nameYourCreature}</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              playConfirmSound();
              onSave(name);
              onClose();
            }
          }}
          placeholder={t.namePlaceholder}
          maxLength={24}
          autoFocus
          className="mb-4 w-full rounded-xl bg-white/[0.06] px-4 py-3 text-center text-sm text-helen-paper outline-none placeholder:text-helen-dim"
        />
        <button
          type="button"
          onClick={() => {
            playConfirmSound();
            onSave(name);
            onClose();
          }}
          className="w-full rounded-xl bg-helen-coral py-[15px] text-[14.5px] font-bold text-helen-ink"
        >
          {t.saveNameBtn}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2.5 w-full rounded-xl border border-white/15 py-[15px] text-[14.5px] font-medium text-helen-dim"
        >
          {t.closeLabel}
        </button>
      </div>
    </div>
  );
}
