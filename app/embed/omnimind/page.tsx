"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const HOST_APP = "https://omnimindai.app";

/**
 * Dedicated integration surface for OmniMindAI.
 *
 * This intentionally contains ONLY the first OmniMind hero and its two primary
 * actions. It has no standalone OmniMind navigation, footer, Terms/Privacy,
 * help button, language rail, Worlds menu, mobile dock, Omni Pulse button or
 * secondary product links. The parent OmniMindAI shell owns all outer chrome.
 */
export default function EmbeddedOmniMindHero() {
  const { t } = useLanguage();

  return (
    <>
      <style>{`
        body > button[aria-label="Help"],
        body nav.mobile-dock,
        body button[aria-label="Omni Pulse"] {
          display: none !important;
        }
      `}</style>
      <main className="relative min-h-screen overflow-hidden bg-bg text-white">
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-5 sm:px-6 py-10 sm:py-14">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -bottom-[30%] -left-[15%] w-[780px] h-[780px] rounded-full opacity-60 blur-[130px] animate-breathe"
              style={{ background: "radial-gradient(circle, #5B6EF5 0%, transparent 70%)" }}
            />
            <div
              className="absolute -top-[25%] -right-[15%] w-[680px] h-[680px] rounded-full opacity-45 blur-[130px]"
              style={{ background: "radial-gradient(circle, #A855F7 0%, transparent 70%)" }}
            />
            <div
              className="absolute bottom-[5%] right-[10%] w-[520px] h-[520px] rounded-full opacity-35 blur-[120px]"
              style={{ background: "radial-gradient(circle, #22D3EE 0%, transparent 70%)" }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg pointer-events-none" />

          <div className="relative z-[1] flex w-full max-w-4xl flex-col items-center text-center animate-rise">
            <div className="relative mb-2 h-[190px] w-[190px] sm:h-[240px] sm:w-[240px]">
              <div
                className="absolute inset-0 blur-3xl opacity-60 animate-breathe"
                style={{ background: "radial-gradient(circle, #22D3EE 0%, transparent 70%)" }}
              />
              <div className="absolute inset-0 animate-idle-bob">
                <Image
                  className="object-contain"
                  src="/mascot/omni.png"
                  fill
                  sizes="240px"
                  alt="OmniMind"
                  priority
                />
                <span
                  className="pointer-events-none absolute rounded-full bg-[#1f2e4d] animate-omni-blink"
                  style={{ left: "50%", top: "34.3%", width: "22%", height: "20%" }}
                  aria-hidden
                />
              </div>
            </div>

            <span className="inline-flex items-center gap-2 text-cyan text-[10px] sm:text-[11px] font-bold tracking-[0.22em] mb-5 sm:mb-6 px-3.5 py-1.5 rounded-full border border-cyan/25 bg-cyan/[0.06]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulseDot" />
              {t.heroBadge}
            </span>

            <h1 className="font-head text-[3.25rem] leading-[0.96] sm:text-7xl font-light tracking-tight mb-5 text-gradient max-w-4xl">
              {t.heroLine1}
              <br />
              <span className="font-semibold">{t.heroLine2}</span>
            </h1>

            <p className="text-muted text-[0.98rem] sm:text-lg max-w-xl mb-9 sm:mb-10 leading-relaxed">
              {t.heroSub}
            </p>

            <div className="flex w-full max-w-xl flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <a
                href={`${HOST_APP}/app/omnimind/ask`}
                target="_top"
                className="glass rounded-2xl px-7 py-4 text-sm font-bold text-white text-center bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 shadow-glow transition-all hover:-translate-y-0.5"
              >
                {t.heroCtaAsk}
              </a>
              <a
                href={`${HOST_APP}/app/omnimind/mission-control`}
                target="_top"
                className="glass rounded-2xl px-7 py-4 text-sm font-bold text-white/90 text-center hover:text-white hover:bg-white/[0.06] transition-all hover:-translate-y-0.5"
              >
                {t.heroCtaMissionControl}
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
