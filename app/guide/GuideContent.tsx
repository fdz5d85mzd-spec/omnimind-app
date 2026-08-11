"use client";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function Section({
  eyebrow,
  title,
  children,
  cta,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  cta: { href: string; label: string };
}) {
  return (
    <div className="glass rounded-3xl p-8">
      <p className="text-xs font-semibold tracking-wide text-accent uppercase mb-2">{eyebrow}</p>
      <h2 className="font-head text-2xl font-semibold text-white mb-3">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-3">{children}</div>
      <Link href={cta.href} className="inline-block mt-5 text-sm font-semibold text-cyan hover:underline">
        {cta.label} →
      </Link>
    </div>
  );
}

export default function GuideContent() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-10 w-fit">
          <LogoMark size={22} />
          <span className="font-head font-semibold text-white">OmniMind</span>
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-head text-4xl font-semibold text-gradient mb-3">{t.guideTitle}</h1>
          <p className="text-muted text-sm max-w-lg mx-auto leading-relaxed">{t.guideSub}</p>
        </div>

        <div className="space-y-6">
          <Section eyebrow={t.guideCoreEyebrow} title="OmniMind" cta={{ href: "/chat", label: t.guideCoreCta }}>
            <p>{t.guideCoreBody1}</p>
            <p>
              {t.guideCoreTrackPre}{" "}
              <Link href="/mission-control" className="text-cyan hover:underline">
                Mission Control
              </Link>
              {t.guideCoreTrackMid}{" "}
              <Link href="/settings" className="text-cyan hover:underline">
                {t.navSettings}
              </Link>
              {t.guideCoreTrackEnd}
            </p>
          </Section>

          <Section eyebrow={t.guidePartOfEyebrow} title="Helen" cta={{ href: "/helen", label: t.guideHelenCta }}>
            <p>{t.guideHelenBody}</p>
          </Section>

          <Section eyebrow={t.guidePartOfEyebrow} title="VoxStudio" cta={{ href: "/voxstudio", label: t.guideVoxCta }}>
            <p>{t.guideVoxBody1}</p>
            <p>{t.guideVoxBody2}</p>
          </Section>
        </div>

        <p className="text-center text-xs text-mutedDark mt-10">
          {t.pricingQuestions}{" "}
          <Link href="/chat" className="text-cyan hover:underline">
            {t.pricingAskDirectly}
          </Link>{" "}
          {t.guideFooterDirectly}
        </p>
      </div>
    </div>
  );
}
