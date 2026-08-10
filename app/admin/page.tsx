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
  const [report, fleet, pending, rules, log] = await Promise.all([
    getOrchestratorReport(),
    getFleetStatus(),
    getPendingApprovals(),
    getPolicyRules(),
    getPolicyLog(30),
  ]);

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <h1 className="font-head text-2xl font-semibold text-white">Overview</h1>

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

        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Agent success rate</h2>
          <p className="text-xs text-mutedDark mb-4">
            Completed vs. failed task runs across the fleet — a real distinction now (see task_status
            FAILED), not inferred from whether a result happened to contain an error.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <MiniStat
              label="Success rate"
              value={
                report && report.tasks_completed + report.tasks_failed > 0
                  ? Math.round((report.tasks_completed / (report.tasks_completed + report.tasks_failed)) * 100)
                  : undefined
              }
              suffix="%"
            />
            <MiniStat label="Completed" value={report?.tasks_completed} />
            <MiniStat label="Failed" value={report?.tasks_failed} />
          </div>
        </div>

        <AdminActions pending={pending ?? []} />

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

function MiniStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-[10px] tracking-wide text-mutedDark uppercase mb-1">{label}</p>
      <p className="font-head text-xl font-semibold text-white tabular-nums">
        {value ?? "—"}
        {value !== undefined && suffix}
      </p>
    </div>
  );
}
