"use client";

import Link from "next/link";
import { AmbientNature } from "./AmbientNature";
import { BackgroundMusic } from "./BackgroundMusic";
import { HelpButton } from "./HelpButton";
import { LanguageToggle } from "./LanguageToggle";
import { ProgressDots } from "./ProgressDots";
import { SoundToggle } from "./SoundToggle";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  return (
    <div className="helen-phone-frame relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col overflow-hidden bg-helen-ink md:min-h-[calc(100dvh-2rem)] md:rounded-[2rem] md:border md:border-white/10">
      <BackgroundMusic />
      <AmbientNature />
      {/* paddingTop adds the device safe-area inset (notch/Dynamic Island)
          on top of the usual spacing — without it, this bar and the
          language toggle sit fine on ordinary mobile Safari but collide
          with the status bar inside a native app shell (Capacitor), which
          actually lets content draw under the notch (viewport-fit=cover). */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-2 bg-gradient-to-b from-black/70 via-black/20 to-transparent px-5 pb-10"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <SoundToggle />
          <HelpButton />
        </div>
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-helen-gold/30 bg-helen-ink/65 px-3 py-2 text-[11px] font-bold text-helen-paper shadow-lg backdrop-blur-md transition active:scale-95"
          aria-label="Back to OmniMind home"
        >
          <span aria-hidden>←</span>
          <span>{lang === "el" ? "Αρχική OmniMind" : "OmniMind Home"}</span>
        </Link>
      </div>
      <LanguageToggle />
      <div
        className="relative z-10 flex flex-1 flex-col px-4 pb-4 sm:px-5"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 3.5rem)" }}
      >
        {children}
      </div>
      <ProgressDots />
    </div>
  );
}
