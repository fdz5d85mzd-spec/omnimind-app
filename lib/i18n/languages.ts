import type { LangCode } from "./types";

export interface LanguageMeta {
  code: LangCode;
  label: string;
  rtl?: boolean;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: "en", label: "English" },
  { code: "el", label: "Ελληνικά" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ar", label: "العربية", rtl: true },
  { code: "tr", label: "Türkçe" },
];

export const DEFAULT_LANG: LangCode = "en";
