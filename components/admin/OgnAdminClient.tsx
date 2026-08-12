"use client";

import { useState } from "react";

export default function OgnAdminClient() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ adminEmail: string; adminPassword: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");

  async function seed() {
    setSeeding(true);
    setError("");
    setSeedResult(null);
    const res = await fetch("/ogn/api/seed", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) setError(`${body.error || "Seed failed"}${body.detail ? ` — ${body.detail}` : ""}`);
    else setSeedResult(body);
    setSeeding(false);
  }

  async function runPipeline() {
    setRunning(true);
    setError("");
    setPipelineResult(null);
    const res = await fetch("/ogn/api/admin-pipeline", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) setError(`${body.error || "Pipeline run failed"}${body.detail ? ` — ${body.detail}` : ""}`);
    else setPipelineResult(body.result);
    setRunning(false);
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-1.5">1. Seed the database</p>
        <p className="text-xs text-mutedDark mb-4">
          Creates the 8 categories, 8 RSS sources, and 3 sample articles so the site isn&apos;t empty.
          Safe to run more than once.
        </p>
        <button
          onClick={seed}
          disabled={seeding}
          className="bg-gradient-to-br from-accent to-accent/80 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-opacity"
        >
          {seeding ? "Seeding…" : "Seed OGN database"}
        </button>
        {seedResult && (
          <div className="mt-4 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
            <p className="text-xs text-emerald mb-1">Seeded.</p>
            <p className="text-xs text-mutedDark font-mono">
              Admin login: {seedResult.adminEmail} / {seedResult.adminPassword}
            </p>
            <p className="text-[11px] text-mutedDark mt-1">Save this now — it won&apos;t be shown again.</p>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-1.5">2. Run the content pipeline</p>
        <p className="text-xs text-mutedDark mb-4">
          Collects real articles from the RSS sources, verifies, summarizes, and publishes them. Runs
          automatically every hour once cron is configured — this button runs it immediately.
        </p>
        <button
          onClick={runPipeline}
          disabled={running}
          className="bg-gradient-to-br from-accent to-accent/80 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-opacity"
        >
          {running ? "Running… (can take a minute)" : "Run pipeline now"}
        </button>
        {pipelineResult && (
          <div className="mt-4 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
            <p className="text-xs text-emerald mb-2">Pipeline finished.</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted">
              {Object.entries(pipelineResult).map(([k, v]) => (
                <div key={k}>
                  <span className="text-white font-semibold">{v}</span> {k}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="glass rounded-2xl p-5 border border-red-500/30">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
