import { prisma } from "@/lib/prisma";
import PricingCalculator from "@/components/admin/PricingCalculator";

export const metadata = { title: "Pricing — OmniMind Admin" };

export default async function PricingPage() {
  const settings = await prisma.costSettings.findUnique({ where: { id: "singleton" } });

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-head text-2xl font-semibold text-white mb-1.5">Cost & Pricing</h1>
        <p className="text-sm text-mutedDark mb-8">
          Real math over your real monthly costs — nothing here is a placeholder figure. Add every line
          item you actually pay (GPU hosting, Vercel, Render, domain, anything else), and this computes
          what to charge to hit your target margin.
        </p>
        <PricingCalculator
          initial={{
            items: (settings?.items as { label: string; monthlyUsd: number }[] | undefined) ?? [
              { label: "GPU hosting", monthlyUsd: 0 },
              { label: "Vercel", monthlyUsd: 0 },
              { label: "Render", monthlyUsd: 0 },
              { label: "Domain", monthlyUsd: 0 },
            ],
            marginPct: settings?.marginPct ?? 40,
            subscribers: settings?.subscribers ?? 1,
          }}
          readOnly={false}
        />
      </main>
    </div>
  );
}
