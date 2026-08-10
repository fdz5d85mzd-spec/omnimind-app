"use client";

import { useEffect, useState } from "react";
import type { PartnerSummary } from "@/lib/adminPartners";

function eur(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "EUR" });
}

export default function PartnersClient() {
  const [partners, setPartners] = useState<PartnerSummary[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [origin, setOrigin] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [commissionPct, setCommissionPct] = useState(20);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function load() {
    const res = await fetch("/api/admin/partners");
    const body = await res.json().catch(() => ({}));
    if (res.ok) setPartners(body.partners ?? []);
    else setError(body.error || "Failed to load partners");
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!name.trim() || !email.trim()) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), commissionPct }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Failed to create partner");
    } else {
      setName("");
      setEmail("");
      await load();
    }
    setCreating(false);
  }

  async function handleDeactivate(id: string) {
    await fetch("/api/admin/partners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(`${origin}/helen?ref=${code}`);
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4">Add a partner</p>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-40 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-accent/60"
              placeholder="Partner name"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-56 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-accent/60"
              placeholder="partner@example.com"
            />
          </Field>
          <Field label="Commission %">
            <input
              type="number"
              min={0}
              max={100}
              value={commissionPct}
              onChange={(e) => setCommissionPct(Number(e.target.value))}
              className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-accent/60"
            />
          </Field>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="bg-gradient-to-br from-accent to-accent/80 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-opacity"
          >
            {creating ? "Adding…" : "Add partner"}
          </button>
        </div>
        {error && <p className="text-xs text-crimson mt-3">{error}</p>}
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4">
          Partners {partners ? `(${partners.length})` : ""}
        </p>
        {!partners ? (
          <p className="text-xs text-mutedDark">Loading…</p>
        ) : partners.length === 0 ? (
          <p className="text-xs text-mutedDark">No partners yet.</p>
        ) : (
          <div className="space-y-4">
            {partners.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/[0.06] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {p.name}{" "}
                      {!p.active && <span className="text-[10px] text-mutedDark font-normal">(inactive)</span>}
                    </p>
                    <p className="text-[11px] text-mutedDark font-mono">{p.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-head text-lg font-semibold text-white tabular-nums">
                      {eur(p.commissionOwedCents)}
                    </p>
                    <p className="text-[11px] text-mutedDark">
                      {p.commissionPct}% of {eur(p.attributedGrossCents)} ({p.attributedCharges} sale
                      {p.attributedCharges === 1 ? "" : "s"})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <code className="text-xs font-mono bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-cyan">
                    {origin}/helen?ref={p.referralCode}
                  </code>
                  <button
                    onClick={() => copyLink(p.referralCode)}
                    className="text-xs text-mutedDark hover:text-white transition-colors"
                  >
                    Copy
                  </button>
                  {p.active && (
                    <button
                      onClick={() => handleDeactivate(p.id)}
                      className="text-xs text-crimson hover:underline ml-auto"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-wide text-mutedDark uppercase mb-1.5">{label}</label>
      {children}
    </div>
  );
}
