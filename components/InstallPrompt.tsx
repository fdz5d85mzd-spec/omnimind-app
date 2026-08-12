"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "omnimind_install_dismissed";

// Chrome/Edge fire beforeinstallprompt only when the manifest + service
// worker + icons already satisfy their installability checks (all three
// already exist here) -- this component just captures that event and
// gives it a visible, on-brand button instead of leaving the install
// affordance buried in the browser's own address-bar icon.
export default function InstallPrompt() {
  const pathname = usePathname() ?? "";
  const { t } = useLanguage();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1");

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred || dismissed || pathname.startsWith("/helen")) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    // bottom-20 on phones clears the Help widget launcher, which sits at
    // bottom-4 left-4 -- at narrow widths this panel's max-w-xs is wide
    // enough to visually cover it if both share the same row.
    <div className="fixed bottom-20 right-4 sm:bottom-4 z-50 flex items-center gap-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-white/[0.08] shadow-panel px-4 py-3 max-w-xs animate-fadeIn">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{t.installTitle}</p>
        <p className="text-xs text-mutedDark mt-0.5">{t.installSub}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={install}
          className="bg-gradient-to-br from-accent to-accent/80 hover:opacity-90 text-white text-xs font-bold px-3 py-2 rounded-lg transition-opacity"
        >
          {t.installButton}
        </button>
        <button
          onClick={dismiss}
          aria-label={t.installDismissLabel}
          className="text-mutedDark hover:text-white p-1.5 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
