import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import { getIntegrationsStatus } from "@/lib/telemetry";

export const metadata = { title: "Integrations — OmniMind Admin" };

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  const isMaster = session?.user?.isMaster ?? false;
  const isAdmin = session?.user?.isAdmin ?? false;

  if (!session?.user || (!isMaster && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass rounded-2xl p-8 text-center max-w-sm">
          <LogoMark size={28} />
          <h1 className="font-head text-xl font-semibold text-white mt-4 mb-2">
            {session?.user ? "Not authorized" : "Sign in required"}
          </h1>
          <Link href={session?.user ? "/" : "/login"} className="text-cyan hover:underline text-sm">
            {session?.user ? "Back home" : "Sign in →"}
          </Link>
        </div>
      </div>
    );
  }

  const status = await getIntegrationsStatus();
  const githubConfigured = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="font-head font-semibold text-sm text-white">OmniMind</span>
          </Link>
          <span className="hidden sm:inline text-xs text-mutedDark tracking-wide">INTEGRATIONS</span>
        </div>
        <Link href="/admin" className="text-xs font-bold text-white glass rounded-lg px-3.5 py-2 hover:bg-white/[0.08] transition-colors">
          Admin
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-head text-2xl font-semibold text-white mb-1.5">Integrations</h1>
        <p className="text-sm text-mutedDark mb-8">
          Real connection status — never a hardcoded &quot;connected&quot; badge. Rows below reflect
          whether the actual credentials are set on the backend or this app, right now.
        </p>

        {!status && (
          <div className="glass border-crimson/30 bg-crimson/[0.06] rounded-xl px-4 py-3 mb-6 text-sm text-crimson">
            Backend unreachable — LLM provider status can&apos;t be checked right now.
          </div>
        )}

        <div className="space-y-3">
          <Row
            name="Anthropic (Claude)"
            connected={status?.llm_provider === "anthropic"}
            detail={
              status?.llm_provider === "anthropic"
                ? "Active — powering /chat right now."
                : "Set ANTHROPIC_API_KEY on the backend (Render) to enable."
            }
          />
          <Row
            name="OpenAI (ChatGPT)"
            connected={status?.llm_provider === "openai"}
            detail={
              status?.llm_provider === "openai"
                ? "Active — powering /chat right now."
                : status?.llm_provider === "anthropic"
                ? "Set OPENAI_API_KEY as a fallback — Anthropic takes priority when both are set."
                : "Set OPENAI_API_KEY on the backend (Render) to enable."
            }
          />
          <Row
            name="GitHub Sign-In"
            connected={githubConfigured}
            detail={
              githubConfigured
                ? "Active — the login page shows a Continue with GitHub button."
                : "Create a free GitHub OAuth App, then set GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET here in Vercel."
            }
          />
          <Row
            name="Higgsfield"
            connected={false}
            detail="Not wired up yet — needs a Higgsfield API key and a backend integration to let agents call it. Tell me when you have a key and I'll build it."
          />
        </div>

        <h2 className="text-xs font-semibold tracking-wide text-mutedDark uppercase mt-8 mb-3">Infrastructure</h2>
        <div className="space-y-3">
          <Row
            name="Admin action key"
            connected={status?.admin_api_key_configured ?? false}
            detail={
              status?.admin_api_key_configured
                ? "Set — the admin dashboard's Approve/Lockdown actions are protected."
                : "Not set — those actions are currently open to anyone with the API URL."
            }
          />
          <Row
            name="NATS message bus"
            connected={status?.nats_configured ?? false}
            detail={
              status?.nats_configured
                ? "Connected — fleet events flow over NATS instead of in-process."
                : "Not set — fine for a single instance; needed for multi-node fleets."
            }
          />
        </div>
      </main>
    </div>
  );
}

function Row({ name, connected, detail }: { name: string; connected: boolean; detail: string }) {
  return (
    <div className="glass rounded-xl p-4 flex items-start gap-3">
      <span
        className={`shrink-0 mt-0.5 h-2 w-2 rounded-full ${connected ? "bg-emerald" : "bg-mutedDark"}`}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{name}</p>
          <span className={`text-[10px] font-bold uppercase tracking-wide ${connected ? "text-emerald" : "text-mutedDark"}`}>
            {connected ? "Connected" : "Not connected"}
          </span>
        </div>
        <p className="text-xs text-muted mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
