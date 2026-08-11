import UsersClient from "@/components/admin/UsersClient";

export const metadata = { title: "Users — OmniMind Admin" };

export default async function UsersPage() {
  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-head text-2xl font-semibold text-white mb-1.5">Users</h1>
        <p className="text-sm text-mutedDark mb-8">
          &ldquo;View as&rdquo; opens the app exactly as that user sees it — their credits, plan, and
          settings — so you can diagnose what they&apos;re seeing. A banner stays on screen the whole
          time with an Exit button.
        </p>
        <UsersClient />
      </main>
    </div>
  );
}
