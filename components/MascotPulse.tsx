"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronRight, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCredits } from "@/lib/useCredits";

const copy: Record<
  string,
  { hello: string; news: string; read: string; try: string; close: string }
> = {
  en: {
    hello: "A bright signal just arrived",
    news: "Today's positive story is ready on OGN.",
    read: "Read the story",
    try: "Explore something new",
    close: "Dismiss",
  },
  el: {
    hello: "Μόλις έφτασε ένα φωτεινό σήμα",
    news: "Η θετική είδηση της ημέρας είναι έτοιμη στο OGN.",
    read: "Διάβασε την είδηση",
    try: "Ανακάλυψε κάτι νέο",
    close: "Κλείσιμο",
  },
  es: {
    hello: "Acaba de llegar una señal positiva",
    news: "La noticia positiva del día está lista en OGN.",
    read: "Leer la noticia",
    try: "Explora algo nuevo",
    close: "Cerrar",
  },
  fr: {
    hello: "Un signal positif vient d'arriver",
    news: "L'actualité positive du jour est prête sur OGN.",
    read: "Lire l'article",
    try: "Explorer",
    close: "Fermer",
  },
  de: {
    hello: "Ein positives Signal ist eingetroffen",
    news: "Die positive Nachricht des Tages wartet bei OGN.",
    read: "Artikel lesen",
    try: "Neues entdecken",
    close: "Schließen",
  },
  it: {
    hello: "È arrivato un segnale positivo",
    news: "La notizia positiva del giorno è pronta su OGN.",
    read: "Leggi la notizia",
    try: "Esplora",
    close: "Chiudi",
  },
  pt: {
    hello: "Chegou um sinal positivo",
    news: "A notícia positiva do dia está pronta no OGN.",
    read: "Ler notícia",
    try: "Explorar",
    close: "Fechar",
  },
  tr: {
    hello: "Olumlu bir sinyal geldi",
    news: "Günün pozitif haberi OGN'de hazır.",
    read: "Haberi oku",
    try: "Keşfet",
    close: "Kapat",
  },
  ru: {
    hello: "Получен позитивный сигнал",
    news: "Позитивная новость дня уже на OGN.",
    read: "Читать",
    try: "Исследовать",
    close: "Закрыть",
  },
  ja: {
    hello: "明るいシグナルが届きました",
    news: "今日のポジティブニュースをOGNで読めます。",
    read: "記事を読む",
    try: "探索する",
    close: "閉じる",
  },
  zh: {
    hello: "收到一个积极信号",
    news: "今日正能量新闻已在 OGN 上线。",
    read: "阅读新闻",
    try: "探索更多",
    close: "关闭",
  },
  ar: {
    hello: "وصلت إشارة إيجابية",
    news: "قصة اليوم الإيجابية جاهزة على OGN.",
    read: "اقرأ الخبر",
    try: "استكشف",
    close: "إغلاق",
  },
};
const destinations = [
  { href: "/atlas", name: "Atlas" },
  { href: "/contests", name: "Creator Arena" },
  { href: "/orpheus", name: "Orpheus" },
  { href: "/helen", name: "Helen" },
  { href: "/voxstudio", name: "VoxStudio" },
];
const roles = [
  { name: "News Scout", icon: "🗞️" },
  { name: "Space Guide", icon: "🪐" },
  { name: "Creative Director", icon: "🎬" },
  { name: "Hope Ambassador", icon: "🌍" },
  { name: "Football Captain", icon: "⚽" },
  { name: "Digital Explorer", icon: "🧭" },
];

function getOmniRole(now: Date) {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if (month === 12 && day >= 15)
    return { name: "Winter Messenger", icon: "🎄" };
  if (month === 10 && day >= 24)
    return { name: "Friendly Space Ghost", icon: "🎃" };
  if (month === 4 && day === 22) return { name: "Earth Guardian", icon: "🌱" };
  if (month === 3 && day === 8)
    return { name: "Equality Champion", icon: "💜" };
  if (month >= 6 && month <= 7 && now.getFullYear() % 2 === 0)
    return { name: "Football Captain", icon: "⚽" };
  return roles[Math.floor(now.getTime() / (4 * 86400000)) % roles.length];
}

function getMood(now: Date) {
  const hour = now.getHours();
  if (hour < 6) return "Night Owl";
  if (hour < 12) return "Morning Spark";
  if (hour < 18) return "Curious Explorer";
  return "Evening Guide";
}

export default function MascotPulse() {
  const pathname = usePathname() || "/",
    { lang } = useLanguage(),
    c = copy[lang] || copy.en;
  const [open, setOpen] = useState(false),
    [article, setArticle] = useState<{
      slug: string;
      title: string;
      language: string;
    } | null>(null);
  const [reaction, setReaction] = useState(0);
  const [touches, setTouches] = useState(0);
  const credits = useCredits();
  const now = useMemo(() => new Date(), []);
  const role = getOmniRole(now);
  const mood = getMood(now);
  const destination = useMemo(
    () =>
      destinations.find((d) => !pathname.startsWith(d.href)) || destinations[0],
    [pathname],
  );
  useEffect(() => {
    setTouches(Number(localStorage.getItem("omni-friendship") || 0));
  }, []);
  useEffect(() => {
    if (pathname.startsWith("/chat")) return;
    fetch("/ogn/api/articles?limit=1&sort=featured")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setArticle(d?.articles?.[0] || null))
      .catch(() => undefined);
    const key = `omni-mascot-${new Date().toISOString().slice(0, 10)}`;
    if (!sessionStorage.getItem(key)) {
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem(key, "1");
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [pathname]);
  if (pathname.startsWith("/chat")) return null;
  const storyHref = article ? `/ogn/article/${article.slug}` : "/ogn";
  return (
    <div
      className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-3 z-[65] sm:bottom-5 sm:right-5"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {open && (
        <aside className="mb-3 w-[min(340px,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-cyan/20 bg-[#090d25]/95 shadow-[0_22px_80px_rgba(0,0,0,.55)] backdrop-blur-2xl">
          <div className="relative bg-gradient-to-br from-accent/25 via-cyan/10 to-transparent p-4">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:bg-white/10 hover:text-white"
              aria-label={c.close}
            >
              <X size={15} />
            </button>
            <div className="flex items-center gap-3 pr-7">
              <button
                onClick={() => {
                  setReaction((v) => (v + 1) % 3);
                  setTouches((value) => {
                    const next = value + 1;
                    localStorage.setItem("omni-friendship", String(next));
                    return next;
                  });
                }}
                className="relative h-24 w-20 shrink-0"
                aria-label="Interact with Omni"
              >
                <Image
                  src="/mascot/omni.png"
                  alt="Omni"
                  fill
                  sizes="80px"
                  className={`omni-character object-contain transition ${reaction === 1 ? "scale-110 -rotate-6" : reaction === 2 ? "rotate-6" : ""}`}
                />
                <span className="omni-eye-blink absolute left-1/2 top-[35%] h-5 w-8 rounded-full bg-[#101a3b]" />
              </button>
              <div>
                <p className="text-[10px] font-bold tracking-[.16em] text-cyan">
                  OMNI · {role.name}
                </p>
                <p className="mt-0.5 text-[10px] text-muted">
                  {role.icon} {mood}
                  {touches >= 5 ? " · ✨ OMNI FRIEND" : ""}
                </p>
                <h2 className="mt-1 text-sm font-bold leading-snug">
                  {reaction === 1
                    ? `✨ ${c.hello}`
                    : reaction === 2
                      ? `${role.icon} Ready!`
                      : c.hello}
                </h2>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {article && article.language === lang ? article.title : c.news}
            </p>
            {credits && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-cyan/15 bg-cyan/[.05] px-3 py-2 text-[11px]">
                <span className="text-muted">Credits · {credits.plan}</span>
                <b className="text-cyan">
                  {credits.creditBalance.toLocaleString()} /{" "}
                  {credits.allowance.toLocaleString()}
                </b>
              </div>
            )}
            <Link
              href={storyHref}
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-between rounded-xl bg-white/[.06] px-3 py-2.5 text-xs font-semibold hover:bg-white/[.1]"
            >
              <span className="flex items-center gap-2">
                <Bell size={14} className="text-amber" />
                {c.read}
              </span>
              <ChevronRight size={14} />
            </Link>
            <Link
              href={destination.href}
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-between rounded-xl border border-cyan/15 px-3 py-2.5 text-xs text-muted hover:text-white"
            >
              <span>
                {c.try}: <b>{destination.name}</b>
              </span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </aside>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-16 w-16 place-items-center rounded-2xl border border-cyan/25 bg-[#0b1133]/95 shadow-[0_12px_35px_rgba(0,0,0,.45)] backdrop-blur-xl transition hover:-translate-y-1"
        aria-label="Omni Pulse"
      >
        <span className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full border-2 border-[#090d25] bg-amber text-[10px]">
          {role.icon}
        </span>
        <span className="relative h-14 w-14">
          <Image
            src="/mascot/omni.png"
            alt=""
            fill
            sizes="56px"
            className="omni-character object-contain"
          />
          <span className="omni-eye-blink absolute left-1/2 top-[35%] h-3 w-5 rounded-full bg-[#101a3b]" />
        </span>
      </button>
    </div>
  );
}
