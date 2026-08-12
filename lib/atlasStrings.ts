import type { LangCode } from "@/lib/i18n/types";

export type AtlasCopy = {
  title: string;
  sub: string;
  start: string;
  restart: string;
  win: string;
  lose: string;
  score: string;
  time: string;
  hint: string;
  mission: string;
};
const en: AtlasCopy = {
  title: "ORPHEUS: Signal Run",
  sub: "Navigate the living knowledge map.",
  start: "Start mission",
  restart: "Run again",
  win: "Signal secured",
  lose: "Signal lost",
  score: "Shards",
  time: "Time",
  hint: "Move with touch, arrows, WASD or gamepad",
  mission: "Collect 12 knowledge shards. Avoid the noise fields.",
};
const localized: Partial<Record<LangCode, AtlasCopy>> = {
  el: {
    title: "ORPHEUS: Διαδρομή Σήματος",
    sub: "Πλοηγήσου στον ζωντανό χάρτη γνώσης.",
    start: "Έναρξη αποστολής",
    restart: "Ξανά",
    win: "Το σήμα ασφαλίστηκε",
    lose: "Το σήμα χάθηκε",
    score: "Θραύσματα",
    time: "Χρόνος",
    hint: "Κινήσου με αφή, βέλη, WASD ή χειριστήριο",
    mission: "Μάζεψε 12 θραύσματα γνώσης. Απόφυγε τα πεδία θορύβου.",
  },
  es: {
    ...en,
    title: "ORPHEUS: Ruta de Señal",
    start: "Iniciar misión",
    restart: "Otra vez",
    win: "Señal asegurada",
    lose: "Señal perdida",
  },
  fr: {
    ...en,
    title: "ORPHEUS : Course du Signal",
    start: "Lancer la mission",
    restart: "Rejouer",
    win: "Signal sécurisé",
    lose: "Signal perdu",
  },
  de: {
    ...en,
    title: "ORPHEUS: Signallauf",
    start: "Mission starten",
    restart: "Nochmal",
    win: "Signal gesichert",
    lose: "Signal verloren",
  },
  it: {
    ...en,
    title: "ORPHEUS: Corsa del Segnale",
    start: "Avvia missione",
    restart: "Riprova",
    win: "Segnale protetto",
    lose: "Segnale perso",
  },
  pt: {
    ...en,
    title: "ORPHEUS: Corrida do Sinal",
    start: "Iniciar missão",
    restart: "Jogar novamente",
    win: "Sinal protegido",
    lose: "Sinal perdido",
  },
  tr: {
    ...en,
    title: "ORPHEUS: Sinyal Koşusu",
    start: "Görevi başlat",
    restart: "Tekrar oyna",
    win: "Sinyal güvende",
    lose: "Sinyal kayboldu",
  },
  ru: {
    ...en,
    title: "ORPHEUS: Сигнальный забег",
    start: "Начать миссию",
    restart: "Ещё раз",
    win: "Сигнал защищён",
    lose: "Сигнал потерян",
  },
  ja: {
    ...en,
    title: "ORPHEUS：シグナルラン",
    start: "ミッション開始",
    restart: "もう一度",
    win: "シグナル確保",
    lose: "シグナル消失",
  },
  zh: {
    ...en,
    title: "ORPHEUS：信号之旅",
    start: "开始任务",
    restart: "再来一次",
    win: "信号已安全",
    lose: "信号丢失",
  },
  ar: {
    ...en,
    title: "ORPHEUS: مسار الإشارة",
    start: "ابدأ المهمة",
    restart: "العب مجدداً",
    win: "تم تأمين الإشارة",
    lose: "فُقدت الإشارة",
  },
};
export const atlasCopy = (lang: LangCode) => localized[lang] || en;
