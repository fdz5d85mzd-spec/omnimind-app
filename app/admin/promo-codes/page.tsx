import PromoCodesClient from "@/components/admin/PromoCodesClient";

export const metadata = { title: "Promo Codes — OmniMind Admin" };

export default async function PromoCodesPage() {
  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-head text-2xl font-semibold text-white mb-1.5">Promo codes</h1>
        <p className="text-sm text-mutedDark mb-8">
          Real Stripe promotion codes — redeemable directly on Helen&apos;s checkout page (Stripe shows the
          code field itself). Discounts apply to the €1 membership and shop purchases; there&apos;s no
          separate code list to keep in sync, Stripe is the only source of truth.
        </p>
        <PromoCodesClient />
      </main>
    </div>
  );
}
