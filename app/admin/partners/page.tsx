import PartnersClient from "@/components/admin/PartnersClient";

export const metadata = { title: "Partners — OmniMind Admin" };

export default async function PartnersPage() {
  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-head text-2xl font-semibold text-white mb-1.5">Partners</h1>
        <p className="text-sm text-mutedDark mb-8">
          Each partner gets a link (<code className="text-cyan">/helen?ref=CODE</code>) that tags any
          resulting Helen purchase with their code, directly on the Stripe payment — commission owed is
          computed live from those real, tagged payments, not tracked separately.
        </p>
        <PartnersClient />
      </main>
    </div>
  );
}
