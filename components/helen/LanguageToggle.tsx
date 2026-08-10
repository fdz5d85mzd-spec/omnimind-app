"use client";

import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { LANGUAGES } from "@/lib/helen/i18n/languages";
import type { LangCode } from "@/lib/helen/i18n/types";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="absolute end-4 z-30" style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as LangCode)}
        aria-label="Language"
        className="appearance-none rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 pe-6 font-helen-num text-[11px] text-helen-paper"
        style={{
          backgroundImage:
            "linear-gradient(45deg,transparent 50%,var(--color-dim) 50%),linear-gradient(135deg,var(--color-dim) 50%,transparent 50%)",
          backgroundPosition: "calc(100% - 12px) 55%, calc(100% - 7px) 55%",
          backgroundSize: "5px 5px, 5px 5px",
          backgroundRepeat: "no-repeat",
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
