"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogoMark } from "@/components/Logo";
import { useCredits } from "@/lib/useCredits";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n/languages";
import type { LangCode } from "@/lib/i18n/types";

export function SettingsSignInGate() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass rounded-2xl p-8 text-center max-w-sm">
        <LogoMark size={28} />
        <h1 className="font-head text-xl font-semibold text-white mt-4 mb-2">{t.settingsSignInRequired}</h1>
        <p className="text-sm text-muted mb-4">{t.settingsSignInPrompt}</p>
        <Link href="/login" className="text-cyan hover:underline text-sm">
          {t.settingsSignInLink}
        </Link>
      </div>
    </div>
  );
}

export default function SettingsClient({ name, email }: { name: string | null; email: string | null }) {
  const { t, lang, setLang } = useLanguage();
  const credits = useCredits();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-card/30 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={20} />
          <span className="font-head font-semibold text-sm text-white">OmniMind</span>
        </Link>
        <Link
          href="/chat"
          className="text-xs font-bold text-white glass rounded-lg px-3.5 py-2 hover:bg-white/[0.08] transition-colors"
        >
          {t.navAskOmniMind}
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-6">
        <h1 className="font-head text-2xl font-semibold text-white">{t.settingsTitle}</h1>

        <section className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">{t.settingsProfileTitle}</h2>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] tracking-wide text-mutedDark uppercase mb-1">{t.settingsNameLabel}</p>
              <p className="text-sm text-white">{name || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] tracking-wide text-mutedDark uppercase mb-1">{t.settingsEmailLabel}</p>
              <p className="text-sm text-white">{email || "—"}</p>
            </div>
          </div>
        </section>

        <section className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1.5">{t.settingsLanguageTitle}</h2>
          <p className="text-xs text-mutedDark mb-4">{t.settingsLanguageSub}</p>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LangCode)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent/60 transition-colors"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-card2 text-white">
                {l.label}
              </option>
            ))}
          </select>
        </section>

        <section className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">{t.settingsPlanTitle}</h2>
          {credits ? (
            <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 mb-4">
              <span className="text-sm text-amber font-semibold">
                {credits.creditBalance} {t.settingsCreditsLabel}
              </span>
              <span className="text-[11px] text-mutedDark uppercase">{credits.plan}</span>
            </div>
          ) : (
            <p className="text-xs text-mutedDark mb-4">—</p>
          )}
          <Link href="/pricing" className="text-sm font-semibold text-cyan hover:text-white transition-colors">
            {t.settingsViewPricing} →
          </Link>
        </section>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm font-semibold text-crimson hover:text-white transition-colors"
        >
          {t.settingsSignOut}
        </button>
      </main>
    </div>
  );
}
