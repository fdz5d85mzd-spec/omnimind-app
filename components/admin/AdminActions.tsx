"use client";

import { useState } from "react";
import type { PolicyDecision } from "@/lib/telemetry";

export default function AdminActions({ pending }: { pending: PolicyDecision[] }) {
  const [lockdown, setLockdown] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  async function toggleLockdown(enabled: boolean) {
    setBusy("lockdown");
    setError("");
    try {
      const res = await fetch("/api/admin/lockdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed");
      setLockdown(body.lockdown);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update lockdown");
    } finally {
      setBusy(null);
    }
  }

  async function approve(decisionId: string) {
    setBusy(decisionId);
    setError("");
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed");
      setResolved((prev) => new Set(prev).add(decisionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setBusy(null);
    }
  }

  const visiblePending = pending.filter((d) => !resolved.has(d.decision_id));

  return (
    <div className="space-y-6">
      {error && (
        <div className="glass border-crimson/30 bg-crimson/[0.06] rounded-xl px-4 py-2.5 text-xs text-crimson">
          {error}
        </div>
      )}

      <div className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white mb-1">Emergency Lockdown</h2>
          <p className="text-xs text-mutedDark">
            {lockdown === null ? "Blocks every new policy decision fleet-wide until lifted." : lockdown ? "Lockdown is ACTIVE — new actions are being denied." : "Lockdown is off."}
          </p>
        </div>
        <button
          onClick={() => toggleLockdown(!lockdown)}
          disabled={busy === "lockdown"}
          className={`shrink-0 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${
            lockdown ? "bg-crimson/20 text-crimson border border-crimson/40 hover:bg-crimson/30" : "bg-white/[0.06] text-white hover:bg-white/[0.1]"
          }`}
        >
          {busy === "lockdown" ? "…" : lockdown ? "Lift lockdown" : "Trigger lockdown"}
        </button>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Pending Approvals</h2>
          <span className="text-[11px] text-mutedDark">{visiblePending.length}</span>
        </div>
        {visiblePending.length === 0 ? (
          <p className="text-xs text-mutedDark">Nothing waiting on approval right now.</p>
        ) : (
          <div className="space-y-2">
            {visiblePending.map((d) => (
              <div
                key={d.decision_id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{d.reason}</p>
                  <p className="text-[11px] text-mutedDark font-mono">
                    {d.decision_id} · risk: {d.risk_level}
                  </p>
                </div>
                <button
                  onClick={() => approve(d.decision_id)}
                  disabled={busy === d.decision_id}
                  className="shrink-0 bg-emerald/15 text-emerald border border-emerald/30 hover:bg-emerald/25 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {busy === d.decision_id ? "…" : "Approve"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
