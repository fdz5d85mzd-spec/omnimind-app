import type { LangCode } from "./i18n/types";

// Real BCP-47 locales for the Web Speech APIs (SpeechRecognition input,
// speechSynthesis output) -- matched to the 12 languages OmniMind's own
// language switcher supports, so voice features follow the language the
// person actually chose in the app rather than the browser/OS locale.
export const SPEECH_LOCALE: Record<LangCode, string> = {
  en: "en-US",
  el: "el-GR",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  ru: "ru-RU",
  zh: "zh-CN",
  ja: "ja-JP",
  ar: "ar-SA",
  tr: "tr-TR",
};
