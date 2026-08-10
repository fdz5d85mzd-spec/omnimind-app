"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import NeuralField from "@/components/NeuralField";
import { LogoMark } from "@/components/Logo";
import AnimatedCounter from "@/components/AnimatedCounter";
import { getFleetStatus, getOrchestratorReport, getTwinSubscribers } from "@/lib/telemetry";

const SUBSYSTEMS = [
  {
    name: "Policy Engine",
    desc: "RBAC/ABAC rules gate every action before it runs — deny-before-allow, priority-sorted, nothing slips through unchecked.",
    icon: ShieldIcon,
    color: "accent" as const,
  },
  {
    name: "Meta-Orchestrator",
    desc: "Registers agents, assigns tasks, balances load, and predicts what's coming next across the whole fleet.",
    icon: NetworkIcon,
    color: "cyan" as const,
  },
  {
    name: "Versioned Memory",
    desc: "Every write is immutable and branchable — diff, roll back, or fork the record at any point in time.",
    icon: LayersIcon,
    color: "violet" as const,
  },
  {
    name: "Digital Twin",
    desc: "A live, replayable mirror of the whole system — every stage of every run, streamed in real time.",
    icon: PulseIcon,
    color: "emerald" as const,
  },
  {
    name: "Distributed Fleet",
    desc: "Nodes announce, elect a leader, and hand off work — the system keeps running if one node goes dark.",
    icon: GlobeIcon,
    color: "amber" as const,
  },
  {
    name: "Skill Marketplace",
    desc: "Agents install, rate, and share capabilities — a real registry, not a static feature list.",
    icon: GridIcon,
    color: "cyan" as const,
  },
];

const COLOR_CLASSES: Record<string, { text: string; bg: string; border: string }> = {
  accent: { text: "text-accent", bg: "bg-accent/10", border: "border-accent/25" },
  cyan: { text: "text-cyan", bg: "bg-cyan/10", border: "border-cyan/25" },
  violet: { text: "text-violet", bg: "bg-violet/10", border: "border-violet/25" },
  emerald: { text: "text-emerald", bg: "bg-emerald/10", border: "border-emerald/25" },
  amber: { text: "text-amber", bg: "bg-amber/10", border: "border-amber/25" },
};

export default function Landing() {
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
      <section className="relative h-[92vh] min-h-[640px] flex flex-col items-center justify-center overflow-hidden px-6">
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
        <div className="absolute inset-0">
          <NeuralField density={70} linkDistance={160} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg pointer-events-none" />

        <div className="relative flex flex-col items-center text-center animate-rise">
          <div className="relative mb-8">
            <div className="absolute inset-0 blur-2xl opacity-70 animate-breathe">
              <LogoMark size={72} />
            </div>
            <LogoMark size={72} />
          </div>

          <span className="inline-flex items-center gap-2 text-cyan text-[11px] font-bold tracking-[0.22em] mb-6 px-3.5 py-1.5 rounded-full border border-cyan/25 bg-cyan/[0.06]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulseDot" />
            THE AUTONOMOUS AI OPERATING SYSTEM
          </span>

          <h1 className="font-head text-5xl sm:text-7xl font-light tracking-tight mb-5 text-gradient max-w-4xl">
            Ask anything.
            <br />
            <span className="font-semibold">Watch it think.</span>
          </h1>
          <p className="text-muted text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
            A policy-checked, orchestrated, remembered agent — every decision runs through a real
            operating system, streamed live, never faked.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/chat"
              className="glass rounded-2xl px-7 py-3.5 text-sm font-bold text-white bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 shadow-glow transition-all hover:-translate-y-0.5"
            >
              Ask OmniMind →
            </Link>
            <Link
              href="/mission-control"
              className="glass rounded-2xl px-7 py-3.5 text-sm font-bold text-white/90 hover:text-white hover:bg-white/[0.06] transition-all hover:-translate-y-0.5"
            >
              Enter Mission Control
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-mutedDark text-xs tracking-wide animate-fadeIn">
          scroll
        </div>
      </section>

      {/* --------------------------------------------------------- STATS */}
      <section className="relative -mt-1 border-y border-white/[0.06] bg-card/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Stat
            label="Agents Registered"
            value={report?.agents_total ?? null}
            live={reachable === true}
          />
          <Stat
            label="Tasks Completed"
            value={report?.tasks_completed ?? null}
            live={reachable === true}
          />
          <Stat
            label="Live Sessions"
            value={sessions}
            live={reachable === true}
          />
          <Stat
            label="Fleet Nodes"
            value={fleet ? fleet.peers.length + 1 : null}
            live={reachable === true}
          />
        </div>
        {reachable === false && (
          <p className="text-center text-xs text-mutedDark pb-4">
            Backend unreachable right now — figures will resume the moment it&apos;s back.
          </p>
        )}
      </section>

      {/* ----------------------------------------------------- FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <p className="text-cyan text-xs font-bold tracking-[0.2em] mb-3">REAL SUBSYSTEMS, NOT A DEMO</p>
          <h2 className="font-head text-3xl sm:text-4xl font-semibold text-gradient">
            Six systems. One mind.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SUBSYSTEMS.map((s, i) => {
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
          <p className="text-cyan text-xs font-bold tracking-[0.2em] mb-3">HOW A REQUEST FLOWS</p>
          <h2 className="font-head text-3xl sm:text-4xl font-semibold text-gradient">
            Every answer earns itself.
          </h2>
        </div>
        <FlowDiagram />
      </section>

      {/* --------------------------------------------------------- CTA */}
      <section className="relative border-t border-white/[0.06] py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <NeuralField density={30} linkDistance={130} />
        </div>
        <div className="relative">
          <h2 className="font-head text-3xl sm:text-4xl font-semibold mb-5 text-gradient">
            Put it to work.
          </h2>
          <Link
            href="/chat"
            className="inline-block glass rounded-2xl px-8 py-4 text-sm font-bold text-white bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 shadow-glow transition-all hover:-translate-y-0.5"
          >
            Ask OmniMind →
          </Link>
        </div>
      </section>

      <Footer />
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
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/mission-control", label: "Mission Control" },
    { href: "/pricing", label: "Pricing" },
    ...(status !== "loading" && !session?.user ? [{ href: "/login", label: "Sign in" }] : []),
    ...(session?.user?.isMaster || session?.user?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
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
          <Link
            href="/chat"
            className="text-sm font-semibold text-white glass rounded-xl px-4 py-2 hover:bg-white/[0.08] transition-colors"
          >
            Ask OmniMind
          </Link>
        </nav>

        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/chat"
            className="text-sm font-semibold text-white glass rounded-xl px-4 py-2 hover:bg-white/[0.08] transition-colors"
          >
            Ask OmniMind
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
        </nav>
      )}
    </header>
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

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <LogoMark size={18} />
          <span className="font-head font-semibold text-sm text-white">OmniMind</span>
        </div>
        <p className="text-xs text-mutedDark">The autonomous AI operating system.</p>
        <div className="flex items-center gap-4 text-xs text-mutedDark">
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FlowDiagram() {
  const steps = [
    { label: "Policy", sub: "checked", color: "accent" as const },
    { label: "Orchestrator", sub: "assigned", color: "cyan" as const },
    { label: "Memory", sub: "recorded", color: "violet" as const },
    { label: "LLM", sub: "answered", color: "emerald" as const },
    { label: "Twin", sub: "streamed", color: "amber" as const },
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
      <p className="text-xs text-mutedDark text-center mt-6">
        Every stage publishes a real event — nothing here is a progress bar for show.
      </p>
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
