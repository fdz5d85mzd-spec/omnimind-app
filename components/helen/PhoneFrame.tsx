import { AmbientNature } from "./AmbientNature";
import { BackgroundMusic } from "./BackgroundMusic";
import { HelpButton } from "./HelpButton";
import { LanguageToggle } from "./LanguageToggle";
import { ProgressDots } from "./ProgressDots";
import { SoundToggle } from "./SoundToggle";

export function PhoneFrame({ children }: { children: React.ReactNode }) {
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
        <div className="font-helen-display text-[15px] font-semibold tracking-[0.14em] text-helen-gold drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
          HELEN
        </div>
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
