"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { playConfirmSound } from "@/lib/helen/sound";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/helen/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      playConfirmSound();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[340px] rounded-2xl border border-helen-gold/15 bg-helen-ink-2 p-6">
        {status === "sent" ? (
          <>
            <p className="mb-5 text-center text-sm text-helen-paper">{t.helpSentNote}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-helen-coral py-[13px] text-[14px] font-bold text-helen-ink"
            >
              {t.closeLabel}
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="mb-1 text-center font-helen-display text-lg font-semibold">{t.helpTitle}</h3>
            <p className="mb-4 text-center text-xs text-helen-dim">{t.helpSub}</p>

            <label className="mb-1 block text-[12px] font-semibold text-helen-paper">{t.helpEmailLabel}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-3 w-full rounded-lg border border-white/10 bg-helen-card px-3 py-2.5 text-[13px] text-helen-paper outline-none"
            />

            <label className="mb-1 block text-[12px] font-semibold text-helen-paper">{t.helpMessageLabel}</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.helpMessagePlaceholder}
              maxLength={4000}
              rows={4}
              className="mb-4 w-full rounded-lg border border-white/10 bg-helen-card px-3 py-2.5 text-[13px] text-helen-paper outline-none"
            />

            <button
              type="submit"
              disabled={status === "sending"}
              className="mb-2 w-full rounded-xl bg-helen-coral py-[13px] text-[14px] font-bold text-helen-ink disabled:opacity-60"
            >
              {status === "sending" ? "…" : t.helpSendBtn}
            </button>
            {status === "error" && <p className="mb-2 text-center text-xs text-helen-coral">{t.helpErrorNote}</p>}
            <button type="button" onClick={onClose} className="w-full text-center text-xs font-semibold text-helen-dim">
              {t.closeLabel}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
