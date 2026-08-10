"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import AnimatedCounter from "@/components/AnimatedCounter";
import {
  connectTwinStream,
  getFleetStatus,
  getOrchestratorReport,
  type FleetStatus,
  type OrchestratorReport,
  type TwinEvent,
} from "@/lib/telemetry";

type FeedItem = TwinEvent & { _id: string; _at: number };

type TwinAgent = {
  id: string;
  name: string;
  type: string;
  status: string;
  load: number;
  queue_depth: number;
  model?: string;
  cost_spent: number;
};

// Matches omni.contracts.agent.AgentStatus values exactly (lowercase).
const STATUS_COLOR: Record<string, string> = {
  running: "text-emerald border-emerald/30 bg-emerald/10",
  idle: "text-cyan border-cyan/30 bg-cyan/10",
  waiting: "text-amber border-amber/30 bg-amber/10",
  blocked: "text-crimson border-crimson/30 bg-crimson/10",
  terminated: "text-mutedDark border-white/10 bg-white/[0.03]",
};

export default function MissionControl() {
  const [report, setReport] = useState<OrchestratorReport | null>(null);
  const [fleet, setFleet] = useState<FleetStatus | null>(null);
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed">("connecting");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [agents, setAgents] = useState<TwinAgent[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const [r, f] = await Promise.all([getOrchestratorReport(), getFleetStatus()]);
      if (cancelled) return;
      setReport(r);
      setFleet(f);
      setReachable(r !== null || f !== null);
    }
    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const disconnect = connectTwinStream(
      (event) => {
        if (event.type === "snapshot" && event.data && typeof event.data === "object") {
          const data = event.data as { agents?: TwinAgent[] };
          if (Array.isArray(data.agents)) setAgents(data.agents);
          return;
        }
        setFeed((prev) => {
          const next: FeedItem = { ...event, _id: `${Date.now()}-${Math.random()}`, _at: Date.now() };
          return [next, ...prev].slice(0, 60);
        });
      },
      setWsStatus
    );
    return disconnect;
  }, []);

  const busy = agents.filter((a) => a.status === "running" || a.status === "waiting").length;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="font-head font-semibold text-sm text-white">OmniMind</span>
          </Link>
          <span className="hidden sm:inline text-xs text-mutedDark tracking-wide">MISSION CONTROL</span>
        </div>
        <div className="flex items-center gap-4">
          <ConnBadge status={wsStatus} />
          <Link
            href="/chat"
            className="text-xs font-bold text-white glass rounded-lg px-3.5 py-2 hover:bg-white/[0.08] transition-colors"
          >
            Ask OmniMind
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {reachable === false && (
          <div className="glass border-crimson/30 bg-crimson/[0.06] rounded-xl px-4 py-3 mb-6 text-sm text-crimson">
            Backend unreachable — panels will populate again the moment it responds.
          </div>
        )}

        {/* stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Tile label="Agents" value={report?.agents_total ?? null} sub={`${report?.agents_running ?? 0} running`} color="cyan" />
          <Tile label="Tasks Queued" value={report?.tasks_queued ?? null} sub={`${report?.tasks_completed ?? 0} completed`} color="accent" />
          <Tile label="Avg Load" value={report ? Math.round(report.avg_load * 100) : null} suffix="%" sub="fleet-wide" color="violet" />
          <Tile label="Fleet Nodes" value={fleet ? fleet.peers.length + 1 : null} sub={fleet?.is_leader ? "this node leads" : fleet?.leader ? `led by ${fleet.leader}` : "no leader yet"} color="emerald" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* live activity feed */}
          <div className="lg:col-span-2 glass rounded-2xl overflow-hidden flex flex-col h-[520px]">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Live Activity</h2>
              <span className="text-[11px] text-mutedDark">{feed.length} events</span>
            </div>
            <div ref={feedRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2 font-mono text-[12.5px]">
              {feed.length === 0 ? (
                <p className="text-mutedDark text-sm font-sans py-10 text-center">
                  Quiet right now — start a conversation in the chat and watch it appear here live.
                </p>
              ) : (
                feed.map((item) => <FeedRow key={item._id} item={item} />)
              )}
            </div>
          </div>

          {/* fleet + agents */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">This Node</h2>
              <dl className="space-y-2 text-sm">
                <Row k="Node ID" v={fleet?.node ?? "—"} />
                <Row k="Registered" v={fleet ? (fleet.registered ? "yes" : "no") : "—"} />
                <Row k="Leader" v={fleet?.leader ?? "none elected"} />
                <Row k="Peers" v={fleet ? String(fleet.peers.length) : "—"} />
              </dl>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Agents</h2>
                <span className="text-[11px] text-mutedDark">
                  {agents.length} total · {busy} active
                </span>
              </div>
              {agents.length === 0 ? (
                <p className="text-mutedDark text-xs leading-relaxed">
                  No agents registered in the fleet registry yet — the public chat agent runs through the
                  orchestrator per-request rather than as a standing fleet member.
                </p>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {[...agents]
                    .sort((a, b) => (a.type === "supervisor" ? -1 : b.type === "supervisor" ? 1 : 0))
                    .map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2"
                      >
                        <span className="flex items-center gap-1.5 min-w-0 text-sm text-white truncate">
                          {a.type === "supervisor" && (
                            <span className="shrink-0 text-[9px] font-bold text-amber border border-amber/30 bg-amber/10 rounded px-1.5 py-0.5">
                              LEADER
                            </span>
                          )}
                          <span className="truncate">{a.name}</span>
                        </span>
                        <span
                          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            STATUS_COLOR[a.status] ?? "text-mutedDark border-white/10"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ConnBadge({ status }: { status: "connecting" | "open" | "closed" }) {
  const map = {
    open: { color: "bg-emerald", text: "live", cls: "text-emerald" },
    connecting: { color: "bg-amber", text: "connecting", cls: "text-amber" },
    closed: { color: "bg-crimson", text: "reconnecting", cls: "text-crimson" },
  } as const;
  const m = map[status];
  return (
    <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.color} animate-pulseDot`} />
      {m.text}
    </span>
  );
}

function Tile({
  label,
  value,
  sub,
  suffix,
  color,
}: {
  label: string;
  value: number | null;
  sub?: string;
  suffix?: string;
  color: "accent" | "cyan" | "violet" | "emerald";
}) {
  const c = {
    accent: "text-accent",
    cyan: "text-cyan",
    violet: "text-violet",
    emerald: "text-emerald",
  }[color];
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-[11px] tracking-wide text-mutedDark uppercase mb-1.5">{label}</p>
      <p className={`font-head text-2xl sm:text-3xl font-semibold tabular-nums ${c}`}>
        <AnimatedCounter value={value} />
        {suffix}
      </p>
      {sub && <p className="text-xs text-mutedDark mt-1">{sub}</p>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-mutedDark">{k}</dt>
      <dd className="text-white/90 font-mono text-[12px] truncate max-w-[160px]">{v}</dd>
    </div>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const time = new Date(item._at).toLocaleTimeString([], { hour12: false });
  const kind = item.type ?? "event";
  const label = String(item.subject ?? kind);
  const tone = label.includes("error") || label.includes("failed") || label.includes("denied")
    ? "text-crimson"
    : label.includes("completed") || label.includes("elected")
    ? "text-emerald"
    : label.includes("delta") || label.includes("thinking")
    ? "text-mutedDark"
    : "text-cyan";
  return (
    <div className="flex items-start gap-2 animate-fadeIn">
      <span className="text-mutedDark shrink-0">{time}</span>
      <span className="text-mutedDark shrink-0">{kind}</span>
      <span className={`truncate ${tone}`}>{label}</span>
    </div>
  );
}
