import Link from "next/link";
import { getRevenueSnapshot, type Totals } from "@/lib/adminRevenue";

export const metadata = { title: "Revenue — OmniMind Admin" };

const OWNERS = [
  { name: "Michail", email: "aristidou.m@outlook.com" },
  { name: "Marina", email: "director@axes-bp.com" },
];

function eur(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "EUR" });
}

export default async function RevenuePage() {
  const snapshot = await getRevenueSnapshot();
  const monthHalf = Math.floor(snapshot.month.grossCents / 2);

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="font-head text-2xl font-semibold text-white mb-1.5">Revenue</h1>
          <p className="text-sm text-mutedDark">
            Live from Stripe — every figure below is a real charge total, not an estimate. Helen&apos;s €1
            memberships and shop purchases are the only thing billed through this account today; OmniMind
            and VoxStudio show up here the moment either one has a paid tier.
          </p>
          {!snapshot.stripeConfigured && (
            <p className="mt-3 text-xs text-amber-400">
              STRIPE_SECRET_KEY isn&apos;t set — figures below are zero, not because revenue is zero, but
              because there&apos;s nothing to read from yet.
            </p>
          )}
        </div>

        <section>
          <h2 className="text-xs font-semibold tracking-wide text-mutedDark uppercase mb-3">
            Gross revenue (Stripe)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RevenueCard label="Today" totals={snapshot.today} />
            <RevenueCard label="This month" totals={snapshot.month} />
            <RevenueCard label="All time" totals={snapshot.allTime} />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wide text-mutedDark uppercase mb-3">
            50 / 50 split — this month&apos;s revenue
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OWNERS.map((owner) => (
              <div key={owner.email} className="glass rounded-2xl p-5">
                <p className="text-sm font-semibold text-white">{owner.name}</p>
                <p className="text-[11px] text-mutedDark mb-3 font-mono">{owner.email}</p>
                <p className="font-head text-3xl font-semibold text-white tabular-nums">{eur(monthHalf)}</p>
                <p className="text-[11px] text-mutedDark mt-1">50% of {eur(snapshot.month.grossCents)} gross</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-mutedDark mt-3">
            Gross, before Stripe&apos;s own fees and any hosting costs — see{" "}
            <Link href="/admin/pricing" className="text-cyan hover:underline">
              Pricing
            </Link>{" "}
            for the cost side.
          </p>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wide text-mutedDark uppercase mb-3">
            Users &amp; product
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MiniStat label="Total users" value={snapshot.users} />
            <MiniStat label="New today" value={snapshot.newToday} />
            <MiniStat label="New 7d" value={snapshot.new7d} />
            <MiniStat label="VoxStudio projects" value={snapshot.voxProjects} />
          </div>
          {snapshot.users === null && (
            <p className="text-xs text-amber-400 mt-3">
              User counts need DATABASE_URL set — see the infrastructure runbook.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function RevenueCard({ label, totals }: { label: string; totals: Totals }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-[10px] tracking-wide text-mutedDark uppercase mb-1">{label}</p>
      <p className="font-head text-2xl font-semibold text-white tabular-nums">{eur(totals.grossCents)}</p>
      <p className="text-[11px] text-mutedDark mt-1">{totals.count} charge{totals.count === 1 ? "" : "s"}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-[10px] tracking-wide text-mutedDark uppercase mb-1">{label}</p>
      <p className="font-head text-xl font-semibold text-white tabular-nums">{value ?? "—"}</p>
    </div>
  );
}
