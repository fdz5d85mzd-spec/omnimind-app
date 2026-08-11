"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LogoMark } from "@/components/Logo";
import AnimatedCounter from "@/components/AnimatedCounter";
import { getFleetStatus, getOrchestratorReport, getTwinSubscribers } from "@/lib/telemetry";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n/languages";
import type { Dictionary } from "@/lib/i18n/types";

function subsystems(t: Dictionary) {
  return [
    { name: t.policyName, desc: t.policyDesc, icon: ShieldIcon, color: "accent" as const },
    { name: t.orchestratorName, desc: t.orchestratorDesc, icon: NetworkIcon, color: "cyan" as const },
    { name: t.memoryName, desc: t.memoryDesc, icon: LayersIcon, color: "violet" as const },
    { name: t.twinName, desc: t.twinDesc, icon: PulseIcon, color: "emerald" as const },
    { name: t.fleetName, desc: t.fleetDesc, icon: GlobeIcon, color: "amber" as const },
    { name: t.marketplaceName, desc: t.marketplaceDesc, icon: GridIcon, color: "cyan" as const },
  ];
}

const COLOR_CLASSES: Record<string, { text: string; bg: string; border: string }> = {
  accent: { text: "text-accent", bg: "bg-accent/10", border: "border-accent/25" },
  cyan: { text: "text-cyan", bg: "bg-cyan/10", border: "border-cyan/25" },
  violet: { text: "text-violet", bg: "bg-violet/10", border: "border-violet/25" },
  emerald: { text: "text-emerald", bg: "bg-emerald/10", border: "border-emerald/25" },
  amber: { text: "text-amber", bg: "bg-amber/10", border: "border-amber/25" },
};

export default function Landing() {
  const { t } = useLanguage();
  const [report, setReport] = useState<Awaited<ReturnType<typeof getOrchestratorReport>>>(null);
  const [fleet, setFleet] = useState<Awaited<ReturnType<typeof getFleetStatus>>>(null);
  const [sessions, setSessions] = useState<number | null>(null);
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const [r, f, s] = await Promise.all([getOrchestratorReport(), getFleetStatus(), getTwinSubscribers()]);
      if (cancelled) return;
      setReport(r);
      setFleet(f);
      setSessions(s?.connected ?? null);
      setReachable(r !== null || f !== null);
    }
    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <TopNav />

      {/* ---------------------------------------------------------- HERO */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16">
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

        <div className="relative flex flex-col items-center text-center animate-rise">
          <div className="relative mb-2 h-[200px] w-[200px] sm:h-[240px] sm:w-[240px]">
            <div className="absolute inset-0 blur-3xl opacity-60 animate-breathe" style={{ background: "radial-gradient(circle, #22D3EE 0%, transparent 70%)" }} />
            {/* Cutout (background removed via Higgsfield), not the source
                video's own dark frame -- a boxed rectangle sitting on top of
                the page background read as a pasted-in placeholder, not a
                mascot. Referenced from Higgsfield's CDN directly rather than
                self-hosted: this sandbox's network policy blocks that CDN
                domain, same reason THINKING_VIDEO_URL in app/chat/page.tsx
                does the same. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- external CDN, not a local /public asset next/image can optimize */}
            <img
              className="relative h-full w-full object-contain animate-idle-bob"
              src="https://d8j0ntlcm91z4.cloudfront.net/user_3H6UhncW5DoRLIfEn3yyJY05j6D/hf_20260811_040534_3519a82f-5b95-457a-a925-bd911235991b.png"
              alt=""
              aria-hidden
            />
            {/* Aperture-shutter "blink": a dark disc that scales in over the
                eye and back out, positioned from the eye's actual measured
                coordinates in the source image (50%, 35.8% of the square
                frame, radius ~11% of the width) -- not a guess, sampled
                from the real asset so it lines up with the aperture iris
                instead of floating over blank helmet. */}
            <span
              className="pointer-events-none absolute rounded-full bg-[#1f2e4d] animate-omni-blink"
              style={{ left: "50%", top: "35.8%", width: "22%", height: "22%" }}
              aria-hidden
            />
          </div>

          <span className="inline-flex items-center gap-2 text-cyan text-[11px] font-bold tracking-[0.22em] mb-6 px-3.5 py-1.5 rounded-full border border-cyan/25 bg-cyan/[0.06]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulseDot" />
            {t.heroBadge}
          </span>

          <h1 className="font-head text-5xl sm:text-7xl font-light tracking-tight mb-5 text-gradient max-w-4xl">
            {t.heroLine1}
            <br />
            <span className="font-semibold">{t.heroLine2}</span>
          </h1>
          <p className="text-muted text-base sm:text-lg max-w-xl mb-10 leading-relaxed">{t.heroSub}</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/chat"
              className="glass rounded-2xl px-7 py-3.5 text-sm font-bold text-white bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 shadow-glow transition-all hover:-translate-y-0.5"
            >
              {t.heroCtaAsk}
            </Link>
            <Link
              href="/mission-control"
              className="glass rounded-2xl px-7 py-3.5 text-sm font-bold text-white/90 hover:text-white hover:bg-white/[0.06] transition-all hover:-translate-y-0.5"
            >
              {t.heroCtaMissionControl}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-mutedDark text-xs tracking-wide animate-fadeIn">
          {t.scrollLabel}
        </div>
      </section>

      {/* --------------------------------------------------------- STATS */}
      <section className="relative -mt-1 border-y border-white/[0.06] bg-card/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Stat
            label={t.statAgents}
            value={report?.agents_total ?? null}
            live={reachable === true}
          />
          <Stat
            label={t.statTasks}
            value={report?.tasks_completed ?? null}
            live={reachable === true}
          />
          <Stat
            label={t.statSessions}
            value={sessions}
            live={reachable === true}
          />
          <Stat
            label={t.statFleet}
            value={fleet ? fleet.peers.length + 1 : null}
            live={reachable === true}
          />
        </div>
        {reachable === false && <p className="text-center text-xs text-mutedDark pb-4">{t.statUnreachable}</p>}
      </section>

      {/* ----------------------------------------------------- FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <p className="text-cyan text-xs font-bold tracking-[0.2em] mb-3">{t.featuresEyebrow}</p>
          <h2 className="font-head text-3xl sm:text-4xl font-semibold text-gradient">{t.featuresTitle}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subsystems(t).map((s, i) => {
            const c = COLOR_CLASSES[s.color];
            const Icon = s.icon;
            return (
              <div
                key={s.name}
                className="group glass rounded-2xl p-6 hover:border-white/20 transition-all hover:-translate-y-1"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`h-10 w-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4 ${c.text}`}>
                  <Icon />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{s.name}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------- ARCHITECTURE */}
      <section className="max-w-5xl mx-auto px-6 pb-28">
        <div className="text-center mb-14">
          <p className="text-cyan text-xs font-bold tracking-[0.2em] mb-3">{t.archEyebrow}</p>
          <h2 className="font-head text-3xl sm:text-4xl font-semibold text-gradient">{t.archTitle}</h2>
        </div>
        <FlowDiagram t={t} />
      </section>

      {/* --------------------------------------------------------- CTA */}
      <section className="relative border-t border-white/[0.06] py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full opacity-25 blur-[130px]"
            style={{ background: "radial-gradient(circle, #5B6EF5 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative">
          <h2 className="font-head text-3xl sm:text-4xl font-semibold mb-5 text-gradient">{t.ctaTitle}</h2>
          <Link
            href="/chat"
            className="inline-block glass rounded-2xl px-8 py-4 text-sm font-bold text-white bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 shadow-glow transition-all hover:-translate-y-0.5"
          >
            {t.heroCtaAsk}
          </Link>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
}

function Stat({ label, value, live }: { label: string; value: number | null; live: boolean }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {live && <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulseDot" />}
        <span className="font-head text-2xl sm:text-3xl font-semibold text-white tabular-nums">
          <AnimatedCounter value={value} />
        </span>
      </div>
      <p className="text-[11px] tracking-wide text-mutedDark uppercase">{label}</p>
    </div>
  );
}

function TopNav() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/helen", label: t.navHelen },
    { href: "/voxstudio", label: t.navVoxStudio },
    { href: "/mission-control", label: t.navMissionControl },
    { href: "/pricing", label: t.navPricing },
    ...(status !== "loading" && !session?.user ? [{ href: "/login", label: t.navSignIn }] : []),
    ...(session?.user ? [{ href: "/settings", label: t.navSettings }] : []),
    ...(session?.user?.isMaster || session?.user?.isAdmin ? [{ href: "/admin", label: t.navAdmin }] : []),
  ];

  return (
    <header className="absolute top-0 inset-x-0 z-20 px-6 sm:px-10 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={22} />
          <span className="font-head font-semibold text-[15px] tracking-tight text-white">OmniMind</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted hover:text-white px-4 py-2 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <LanguageSwitcher />
          <Link
            href="/chat"
            className="text-sm font-semibold text-white glass rounded-xl px-4 py-2 hover:bg-white/[0.08] transition-colors"
          >
            {t.navAskOmniMind}
          </Link>
        </nav>

        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/chat"
            className="text-sm font-semibold text-white glass rounded-xl px-4 py-2 hover:bg-white/[0.08] transition-colors"
          >
            {t.navAskOmniMind}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="glass rounded-xl p-2.5 text-white"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="sm:hidden mt-3 glass rounded-2xl p-2 flex flex-col animate-fadeIn">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-muted hover:text-white px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="px-3 py-2 border-t border-white/[0.06] mt-1 pt-3">
            <LanguageSwitcher full />
          </div>
        </nav>
      )}
    </header>
  );
}

function LanguageSwitcher({ full = false }: { full?: boolean }) {
  const { lang, setLang } = useLanguage();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as (typeof LANGUAGES)[number]["code"])}
      aria-label="Language"
      className={`text-sm text-muted hover:text-white bg-transparent border border-white/[0.08] rounded-xl px-3 py-2 outline-none cursor-pointer transition-colors ${
        full ? "w-full" : ""
      }`}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code} className="bg-card2 text-white">
          {l.label}
        </option>
      ))}
    </select>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function Footer({ t }: { t: Dictionary }) {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <LogoMark size={18} />
          <span className="font-head font-semibold text-sm text-white">OmniMind</span>
        </div>
        <p className="text-xs text-mutedDark">{t.footerTagline}</p>
        <div className="flex items-center gap-4 text-xs text-mutedDark">
          <Link href="/terms" className="hover:text-white transition-colors">
            {t.footerTerms}
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            {t.footerPrivacy}
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FlowDiagram({ t }: { t: Dictionary }) {
  const steps = [
    { label: "Policy", sub: t.archStepChecked, color: "accent" as const },
    { label: "Orchestrator", sub: t.archStepAssigned, color: "cyan" as const },
    { label: "Memory", sub: t.archStepRecorded, color: "violet" as const },
    { label: "LLM", sub: t.archStepAnswered, color: "emerald" as const },
    { label: "Twin", sub: t.archStepStreamed, color: "amber" as const },
  ];
  return (
    <div className="glass rounded-3xl p-8 sm:p-10">
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
        {steps.map((s, i) => {
          const c = COLOR_CLASSES[s.color];
          return (
            <div key={s.label} className="flex items-center gap-2 sm:gap-2 w-full sm:w-auto">
              <div className={`flex-1 sm:flex-none rounded-xl border ${c.border} ${c.bg} px-5 py-4 text-center min-w-[120px]`}>
                <p className={`font-semibold text-sm ${c.text}`}>{s.label}</p>
                <p className="text-[11px] text-mutedDark mt-0.5">{s.sub}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden sm:block w-8 h-px bg-gradient-to-r from-white/20 to-white/5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-mutedDark text-center mt-6">{t.archCaption}</p>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function NetworkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="5" cy="19" r="2.2" />
      <circle cx="19" cy="19" r="2.2" />
      <path d="M12 7.2V13M12 13 6.7 17M12 13l5.3 4" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 9 5-9 5-9-5 9-5z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}
function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
