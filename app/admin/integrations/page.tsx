import { getIntegrationsStatus } from "@/lib/telemetry";
import { isHiggsfieldConfigured } from "@/lib/voxstudio/higgsfield";

export const metadata = { title: "Integrations — OmniMind Admin" };

export default async function IntegrationsPage() {
  const status = await getIntegrationsStatus();
  const githubConfigured = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  const higgsfieldConfigured = isHiggsfieldConfigured();
  const elevenlabsConfigured = !!process.env.ELEVENLABS_API_KEY;
  const resendConfigured = !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

  return (
    <div className="min-h-screen">
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
            connected={higgsfieldConfigured}
            detail={
              higgsfieldConfigured
                ? "Active — powering VoxStudio's real image and video generation."
                : "Set HF_CREDENTIALS (\"KEY_ID:KEY_SECRET\" from cloud.higgsfield.ai) to enable VoxStudio image/video generation."
            }
          />
          <Row
            name="ElevenLabs (Voice)"
            connected={elevenlabsConfigured}
            detail={
              elevenlabsConfigured
                ? "Active — powering spoken replies in /chat and Helen."
                : "Set ELEVENLABS_API_KEY to enable spoken replies — without it, voice-asked questions still get a written reply, just never a spoken one (silently, by design, so a missing key never breaks the chat itself)."
            }
          />
          <Row
            name="Resend (Email)"
            connected={resendConfigured}
            detail={
              resendConfigured
                ? "Active — powering password-reset email and the Help widget's contact form."
                : "Set RESEND_API_KEY and RESEND_FROM_EMAIL to enable password-reset email and the Help widget's \"still need a person?\" form."
            }
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
