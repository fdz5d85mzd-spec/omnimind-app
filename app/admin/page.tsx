import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import {
  getFleetStatus,
  getOrchestratorReport,
  getPendingApprovals,
  getPolicyLog,
  getPolicyRules,
} from "@/lib/telemetry";
import AdminActions from "@/components/admin/AdminActions";

export const metadata = { title: "Admin — OmniMind" };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const isMaster = session?.user?.isMaster ?? false;
  const isAdmin = session?.user?.isAdmin ?? false;

  if (!session?.user) {
    return (
      <Gate title="Sign in required">
        <Link href="/login" className="text-cyan hover:underline">
          Sign in →
        </Link>
      </Gate>
    );
  }

  if (!isMaster && !isAdmin) {
    return (
      <Gate title="Not authorized">
        <p>This page is visible only to the admin or master account.</p>
      </Gate>
    );
  }

  const [report, fleet, pending, rules, log] = await Promise.all([
    getOrchestratorReport(),
    getFleetStatus(),
    getPendingApprovals(),
    getPolicyRules(),
    getPolicyLog(30),
  ]);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="font-head font-semibold text-sm text-white">OmniMind</span>
          </Link>
          <span className="hidden sm:inline text-xs text-mutedDark tracking-wide">ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted">
            {isMaster ? "Full master access" : "Read-only admin view"} · {session.user.email}
          </span>
          <Link
            href="/admin/integrations"
            className="text-xs font-bold text-white glass rounded-lg px-3.5 py-2 hover:bg-white/[0.08] transition-colors"
          >
            Integrations
          </Link>
          <Link
            href="/admin/pricing"
            className="text-xs font-bold text-white glass rounded-lg px-3.5 py-2 hover:bg-white/[0.08] transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/mission-control"
            className="text-xs font-bold text-white glass rounded-lg px-3.5 py-2 hover:bg-white/[0.08] transition-colors"
          >
            Mission Control
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {!report && !fleet && (
          <div className="glass border-crimson/30 bg-crimson/[0.06] rounded-xl px-4 py-3 text-sm text-crimson">
            Backend unreachable — figures below may be stale.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MiniStat label="Agents" value={report?.agents_total} />
          <MiniStat label="Tasks Queued" value={report?.tasks_queued} />
          <MiniStat label="Bottlenecks" value={report?.bottlenecks} />
          <MiniStat label="Fleet Nodes" value={fleet ? fleet.peers.length + 1 : undefined} />
        </div>

        <AdminActions isMaster={isMaster} pending={pending ?? []} />

        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Policy Rules</h2>
          {!rules || rules.length === 0 ? (
            <p className="text-xs text-mutedDark">No rules loaded from the backend.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-mutedDark border-b border-white/[0.06]">
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">Action</th>
                    <th className="py-2 pr-4 font-medium">Effect</th>
                    <th className="py-2 pr-4 font-medium">Roles</th>
                    <th className="py-2 pr-4 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id} className="border-b border-white/[0.03]">
                      <td className="py-2 pr-4 font-mono text-muted">{r.id}</td>
                      <td className="py-2 pr-4 text-white/90">{r.action}</td>
                      <td className={`py-2 pr-4 font-semibold ${r.effect === "ALLOW" ? "text-emerald" : "text-crimson"}`}>
                        {r.effect}
                      </td>
                      <td className="py-2 pr-4 text-muted">{r.roles.join(", ") || "any"}</td>
                      <td className="py-2 pr-4 text-muted">{r.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Decisions</h2>
          {!log || log.length === 0 ? (
            <p className="text-xs text-mutedDark">No decisions logged yet.</p>
          ) : (
            <div className="space-y-1.5 font-mono text-[12px] max-h-80 overflow-y-auto">
              {log.map((d) => (
                <div key={d.decision_id} className="flex items-center gap-2">
                  <span className="text-mutedDark shrink-0">
                    {new Date(d.evaluated_at).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <span className={d.allowed ? "text-emerald" : "text-crimson"}>
                    {d.allowed ? "ALLOW" : "DENY"}
                  </span>
                  <span className="text-muted truncate">{d.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-[10px] tracking-wide text-mutedDark uppercase mb-1">{label}</p>
      <p className="font-head text-xl font-semibold text-white">{value ?? "—"}</p>
    </div>
  );
}

function Gate({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass rounded-2xl p-8 text-center max-w-sm">
        <LogoMark size={28} />
        <h1 className="font-head text-xl font-semibold text-white mt-4 mb-2">{title}</h1>
        <div className="text-sm text-muted">{children}</div>
      </div>
    </div>
  );
}
