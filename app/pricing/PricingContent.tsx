"use client";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import TopNav from "@/components/TopNav";
import { CHARS_PER_CREDIT, FREE_COOLDOWN_HOURS, FREE_REFILL_CREDITS, FREE_STARTING_CREDITS } from "@/lib/credits";
import { IMAGE_GENERATION_CREDITS, VIDEO_GENERATION_CREDITS } from "@/lib/billing";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import PricingClient from "./PricingClient";

export default function PricingContent() {
  const { t } = useLanguage();

  const FREE_FEATURES = [
    t.pricingFeature1.replace("{n}", String(FREE_STARTING_CREDITS)),
    t.pricingFeature2.replace("{refill}", String(FREE_REFILL_CREDITS)).replace("{hours}", String(FREE_COOLDOWN_HOURS)),
    t.pricingFeature3,
    t.pricingFeature4,
    t.pricingFeature5,
  ];

  return (
    <>
      <TopNav />
      <div className="min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-head text-4xl font-semibold text-gradient mb-3">{t.pricingTitle}</h1>
          <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">{t.pricingSub}</p>
        </div>

        <div className="glass rounded-3xl p-8 max-w-sm mx-auto mb-14">
          <div className="h-11 w-11 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center mb-5">
            <LogoMark size={20} />
          </div>
          <h2 className="font-head text-2xl font-semibold text-white mb-1">{t.pricingFreeTitle}</h2>
          <p className="text-sm text-mutedDark mb-5">{t.pricingFreeSub}</p>
          <p className="font-head text-4xl font-semibold text-white mb-1">
            €0<span className="text-base font-normal text-mutedDark"> {t.pricingForever}</span>
          </p>
          <Link
            href="/login"
            className="mt-6 block text-center bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 shadow-glow rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          >
            {t.pricingTryButton}
          </Link>

          <ul className="mt-7 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                <CheckIcon />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <PricingClient />

        <div className="max-w-2xl mx-auto mt-14 glass rounded-2xl p-5">
          <p className="text-xs text-mutedDark leading-relaxed">
            {t.pricingHowCreditsWork
              .replace("{chars}", String(CHARS_PER_CREDIT))
              .replace("{imgCredits}", String(IMAGE_GENERATION_CREDITS))
              .replace("{vidCredits}", String(VIDEO_GENERATION_CREDITS))}
          </p>
        </div>

        <p className="text-center text-xs text-mutedDark mt-8">
          {t.pricingQuestions}{" "}
          <Link href="/chat" className="text-cyan hover:underline">
            {t.pricingAskDirectly}
          </Link>{" "}
          {t.pricingOr}{" "}
          <Link href="/terms" className="text-cyan hover:underline">
            {t.footerTerms}
          </Link>
          .
        </p>
      </div>
      </div>
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald shrink-0 mt-0.5"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
