import OgnAdminClient from "@/components/admin/OgnAdminClient";

export const metadata = { title: "OGN — OmniMind Admin" };

export default async function AdminOgnPage() {
  return (
    <div className="min-h-screen">
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-head text-2xl font-semibold text-white mb-1.5">OGN</h1>
        <p className="text-sm text-mutedDark mb-8">
          One-time setup for the OGN news section at{" "}
          <code className="text-cyan">/ogn</code>. Needs{" "}
          <code className="text-cyan">OGN_DATABASE_URL</code> set first.
        </p>
        <OgnAdminClient />
      </main>
    </div>
  );
}
