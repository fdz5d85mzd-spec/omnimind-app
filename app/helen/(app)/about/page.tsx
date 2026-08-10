"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";

export default function AboutPage() {
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

      <h1 className="mb-4 font-helen-display text-xl font-semibold">{t.aboutTitle}</h1>
      <div className="mb-6 space-y-3 text-[13px] leading-relaxed text-helen-dim">
        {t.aboutBody.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <h2 className="mb-2 font-helen-display text-base font-semibold">{t.contactTitle}</h2>
      <div className="mb-6 space-y-1 text-[13px] text-helen-dim">
        {t.contactBody.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      <div className="mt-auto flex gap-4 text-[11px] text-helen-dim">
        <a href="/helen/terms" className="font-semibold text-helen-gold underline">
          {t.viewTermsLink}
        </a>
        <a href="/helen/privacy" className="font-semibold text-helen-gold underline">
          {t.viewPrivacyLink}
        </a>
      </div>
    </div>
  );
}
