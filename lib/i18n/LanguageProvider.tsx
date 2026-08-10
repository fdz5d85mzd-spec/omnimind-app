"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DICTIONARIES } from "./dictionaries";
import { DEFAULT_LANG, LANGUAGES } from "./languages";
import type { Dictionary, LangCode } from "./types";

const STORAGE_KEY = "omnimind-lang";

interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Dictionary;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isRtl(lang: LangCode): boolean {
  return LANGUAGES.find((l) => l.code === lang)?.rtl ?? false;
}

// Picks the closest supported language from the browser's own list, falling
// back to the default when nothing matches -- runs once, client-side only,
// before checking whether the visitor already made an explicit choice.
function detectBrowserLang(): LangCode | null {
  if (typeof navigator === "undefined") return null;
  for (const candidate of navigator.languages ?? [navigator.language]) {
    const code = candidate.slice(0, 2).toLowerCase();
    if (DICTIONARIES[code as LangCode]) return code as LangCode;
  }
  return null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (stored && DICTIONARIES[stored]) {
      setLangState(stored);
      return;
    }
    const detected = detectBrowserLang();
    if (detected) setLangState(detected);
  }, []);

  const dir: "ltr" | "rtl" = isRtl(lang) ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  function setLang(next: LangCode) {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: DICTIONARIES[lang], dir }),
    [lang, dir],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
