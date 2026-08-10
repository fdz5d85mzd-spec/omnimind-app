"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";

export default function TermsPage() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 self-start text-sm font-semibold text-helen-gold"
      >
        ← {t.backLabel}
      </button>

      <h1 className="mb-1 font-helen-display text-xl font-semibold">{t.termsTitle}</h1>
      <p className="mb-4 text-[11px] text-helen-dim">{t.termsLastUpdated}</p>
      <div className="mb-6 space-y-3 text-[13px] leading-relaxed text-helen-dim">
        {t.termsBody.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="mt-auto flex gap-4 text-[11px] text-helen-dim">
        <a href="/helen/about" className="font-semibold text-helen-gold underline">
          {t.viewAboutLink}
        </a>
        <a href="/helen/privacy" className="font-semibold text-helen-gold underline">
          {t.viewPrivacyLink}
        </a>
      </div>
    </div>
  );
}
