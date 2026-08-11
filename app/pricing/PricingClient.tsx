"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PLANS, CREDIT_PACKS } from "@/lib/billing";

export default function PricingClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(kind: "plan" | "credits", id: string) {
    if (status === "loading" || busyId) return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Could not start checkout");
        setBusyId(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach the server");
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-14">
      <section>
        <h2 className="text-center font-head text-xl font-semibold text-white mb-1">Pro plans</h2>
        <p className="text-center text-sm text-mutedDark mb-6">
          A monthly credit allowance and no cooldown wait — cancel anytime.
        </p>
        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div key={plan.id} className="glass rounded-2xl p-6 flex flex-col">
              <h3 className="font-head text-lg font-semibold text-white">{plan.label}</h3>
              <p className="text-xs text-mutedDark mb-4 min-h-[32px]">{plan.tagline}</p>
              <p className="font-head text-3xl font-semibold text-white mb-1">
                €{plan.priceEur.toLocaleString("en-US", { minimumFractionDigits: plan.priceEur % 1 ? 2 : 0 })}
                {plan.interval !== "lifetime" && (
                  <span className="text-sm font-normal text-mutedDark"> /{plan.interval === "month" ? "mo" : "yr"}</span>
                )}
              </p>
              <p className="text-xs text-mutedDark mb-5">{plan.monthlyCredits.toLocaleString("en-US")} credits / month</p>
              <button
                onClick={() => buy("plan", plan.id)}
                disabled={busyId === plan.id}
                className="mt-auto bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 disabled:opacity-50 shadow-glow rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all"
              >
                {busyId === plan.id ? "Opening checkout…" : `Get ${plan.label}`}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-center font-head text-xl font-semibold text-white mb-1">Add credits</h2>
        <p className="text-center text-sm text-mutedDark mb-6">One-time top-up, no subscription — bigger packs cost less per credit.</p>
        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {CREDIT_PACKS.map((pack) => (
            <div key={pack.id} className="glass rounded-2xl p-6 flex flex-col items-center text-center">
              <p className="font-head text-2xl font-semibold text-white">{pack.credits.toLocaleString("en-US")}</p>
              <p className="text-xs text-mutedDark mb-4">credits</p>
              <p className="text-lg font-semibold text-cyan mb-5">€{pack.priceEur.toFixed(2)}</p>
              <button
                onClick={() => buy("credits", pack.id)}
                disabled={busyId === pack.id}
                className="w-full glass hover:bg-white/[0.08] disabled:opacity-50 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors"
              >
                {busyId === pack.id ? "Opening checkout…" : "Buy"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-center text-sm text-crimson">{error}</p>}
    </div>
  );
}
