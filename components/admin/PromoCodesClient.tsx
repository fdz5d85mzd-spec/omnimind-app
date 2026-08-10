"use client";

import { useEffect, useState } from "react";
import type { PromoCodeSummary } from "@/lib/adminPromoCodes";

export default function PromoCodesClient() {
  const [codes, setCodes] = useState<PromoCodeSummary[] | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const [count, setCount] = useState(10);
  const [percentOff, setPercentOff] = useState(100);
  const [expiresInDays, setExpiresInDays] = useState<number | "">(30);

  async function load() {
    const res = await fetch("/api/admin/promo-codes");
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setCodes(body.codes ?? []);
      setStripeConfigured(Boolean(body.stripeConfigured));
    } else {
      setError(body.error || "Failed to load promo codes");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    setCreating(true);
    setError("");
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count,
        percentOff,
        expiresInDays: expiresInDays === "" ? null : expiresInDays,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Failed to create codes");
    } else {
      await load();
    }
    setCreating(false);
  }

  async function handleDeactivate(id: string) {
    await fetch("/api/admin/promo-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  if (!stripeConfigured) {
    return (
      <p className="text-sm text-amber-400">
        STRIPE_SECRET_KEY isn&apos;t set — promo codes need Stripe configured first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4">Create codes</p>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Codes">
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-accent/60"
            />
          </Field>
          <Field label="% off">
            <input
              type="number"
              min={1}
              max={100}
              value={percentOff}
              onChange={(e) => setPercentOff(Number(e.target.value))}
              className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-accent/60"
            />
          </Field>
          <Field label="Expires in (days, blank = never)">
            <input
              type="number"
              min={1}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-36 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-accent/60"
            />
          </Field>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="bg-gradient-to-br from-accent to-accent/80 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-opacity"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
        {error && <p className="text-xs text-crimson mt-3">{error}</p>}
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4">Codes {codes ? `(${codes.length})` : ""}</p>
        {!codes ? (
          <p className="text-xs text-mutedDark">Loading…</p>
        ) : codes.length === 0 ? (
          <p className="text-xs text-mutedDark">No codes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-mutedDark border-b border-white/[0.06]">
                  <th className="py-2 pr-4 font-medium">Code</th>
                  <th className="py-2 pr-4 font-medium">Off</th>
                  <th className="py-2 pr-4 font-medium">Redeemed</th>
                  <th className="py-2 pr-4 font-medium">Expires</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.03]">
                    <td className="py-2 pr-4 font-mono text-white">{c.code}</td>
                    <td className="py-2 pr-4 text-muted">{c.percentOff ?? "—"}%</td>
                    <td className="py-2 pr-4 text-muted">
                      {c.timesRedeemed}
                      {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                    </td>
                    <td className="py-2 pr-4 text-muted">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className={`py-2 pr-4 font-semibold ${c.active ? "text-emerald" : "text-mutedDark"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </td>
                    <td className="py-2 pr-4">
                      {c.active && (
                        <button onClick={() => handleDeactivate(c.id)} className="text-crimson hover:underline">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
