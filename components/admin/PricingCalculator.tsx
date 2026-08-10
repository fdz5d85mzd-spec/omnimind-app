"use client";

import { useMemo, useState } from "react";

type Item = { label: string; monthlyUsd: number };

export default function PricingCalculator({
  initial,
  readOnly,
}: {
  initial: { items: Item[]; marginPct: number; subscribers: number };
  readOnly: boolean;
}) {
  const [items, setItems] = useState<Item[]>(initial.items);
  const [marginPct, setMarginPct] = useState(initial.marginPct);
  const [subscribers, setSubscribers] = useState(initial.subscribers);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const totalMonthlyCost = useMemo(() => items.reduce((sum, i) => sum + (i.monthlyUsd || 0), 0), [items]);
  const breakEvenPrice = subscribers > 0 ? totalMonthlyCost / subscribers : 0;
  const suggestedPrice = marginPct < 100 ? breakEvenPrice / (1 - marginPct / 100) : Infinity;
  const monthlyRevenue = suggestedPrice * subscribers;
  const monthlyProfit = monthlyRevenue - totalMonthlyCost;

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { label: "New line item", monthlyUsd: 0 }]);
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, marginPct, subscribers }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Monthly Costs</h2>
          {!readOnly && (
            <button onClick={addItem} className="text-xs font-semibold text-cyan hover:text-white transition-colors">
              + Add line item
            </button>
          )}
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={item.label}
                disabled={readOnly}
                onChange={(e) => updateItem(i, { label: e.target.value })}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent/60 disabled:opacity-60"
                placeholder="Line item"
              />
              <div className="relative w-32 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mutedDark text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.monthlyUsd}
                  disabled={readOnly}
                  onChange={(e) => updateItem(i, { monthlyUsd: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-6 pr-3 py-2 text-sm text-white outline-none focus:border-accent/60 disabled:opacity-60"
                />
              </div>
              {!readOnly && (
                <button
                  onClick={() => removeItem(i)}
                  className="shrink-0 text-mutedDark hover:text-crimson transition-colors px-1"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
          <span className="text-sm text-muted">Total monthly cost</span>
          <span className="font-head text-lg font-semibold text-white">${totalMonthlyCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Targets</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Target margin (%)</label>
            <input
              type="number"
              min={0}
              max={95}
              value={marginPct}
              disabled={readOnly}
              onChange={(e) => setMarginPct(parseFloat(e.target.value) || 0)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent/60 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Estimated subscribers</label>
            <input
              type="number"
              min={1}
              value={subscribers}
              disabled={readOnly}
              onChange={(e) => setSubscribers(parseInt(e.target.value) || 1)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent/60 disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Result</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Break-even / sub" value={`$${breakEvenPrice.toFixed(2)}`} />
          <Stat label="Suggested price / sub" value={suggestedPrice === Infinity ? "—" : `$${suggestedPrice.toFixed(2)}`} accent />
          <Stat label="Monthly revenue" value={monthlyRevenue === Infinity ? "—" : `$${monthlyRevenue.toFixed(2)}`} />
          <Stat label="Monthly profit" value={monthlyProfit === Infinity ? "—" : `$${monthlyProfit.toFixed(2)}`} />
        </div>
        <p className="text-[11px] text-mutedDark mt-4 leading-relaxed">
          Suggested price = (total cost / subscribers) / (1 − margin). Standard gross-margin pricing —
          edit the numbers above to match your real infrastructure spend and target subscriber count.
        </p>
      </div>

      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="bg-gradient-to-br from-accent to-accent/80 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-opacity"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-xs text-emerald">Saved</span>}
          {error && <span className="text-xs text-crimson">{error}</span>}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] tracking-wide text-mutedDark uppercase mb-1">{label}</p>
      <p className={`font-head text-lg font-semibold ${accent ? "text-cyan" : "text-white"}`}>{value}</p>
    </div>
  );
}
