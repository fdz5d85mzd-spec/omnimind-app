import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Privacy Policy — OmniMind" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-10 w-fit">
          <LogoMark size={22} />
          <span className="font-head font-semibold text-white">OmniMind</span>
        </Link>

        <h1 className="font-head text-3xl font-semibold text-gradient mb-2">Privacy Policy</h1>
        <p className="text-xs text-mutedDark mb-10">Last updated August 2026</p>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <p>
            This describes exactly what OmniMind stores today — not a generic template. It will be
            updated as new features (like server-synced conversation history) ship.
          </p>

          <Section title="What we store">
            When you create an account: your name, email address, and a bcrypt-hashed password — never
            the password itself. Sign-in sessions are handled via signed tokens.
          </Section>

          <Section title="What stays on your device">
            Conversation history is not synced to a server. It&apos;s stored in your browser&apos;s local
            storage only — clearing your browser data or switching devices loses it. This may change in a
            future update, and this page will say so clearly when it does.
          </Section>

          <Section title="What the backend sees">
            Each request to the agent is evaluated by a policy engine and logged internally (prompt,
            timestamp, outcome) so the system can function — approvals, memory, and the live activity feed
            all depend on this. This operational log is not the same as saved conversation history and is
            not exposed publicly beyond the Mission Control view.
          </Section>

          <Section title="Third parties">
            Requests are answered by a configured language model provider (currently Anthropic). Your
            prompt is sent to that provider to generate a response, subject to their own terms.
          </Section>

          <Section title="What we don't do">
            We don&apos;t sell your data, and there&apos;s no advertising or tracking pixel on this site.
          </Section>

          <Section title="Contact">
            Questions about this policy can be sent to the account listed as the service&apos;s
            administrator.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-white font-semibold text-base mb-1.5">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
