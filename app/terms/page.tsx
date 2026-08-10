import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Terms of Service — OmniMind" };

export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-10 w-fit">
          <LogoMark size={22} />
          <span className="font-head font-semibold text-white">OmniMind</span>
        </Link>

        <h1 className="font-head text-3xl font-semibold text-gradient mb-2">Terms of Service</h1>
        <p className="text-xs text-mutedDark mb-10">Last updated August 2026</p>

        <div className="prose-sm space-y-6 text-sm text-muted leading-relaxed">
          <p>
            OmniMind is an early-stage product, actively changing. These terms cover the basics of using
            it; they are not a substitute for advice from a lawyer, and we&apos;ll update them as the
            product grows.
          </p>

          <Section title="1. What OmniMind is">
            OmniMind lets you send requests to an AI agent that runs through a policy engine, an
            orchestrator, and a memory store, and streams back a real answer from a configured language
            model provider. It does not fabricate answers when a provider isn&apos;t configured or fails —
            you&apos;ll see the actual error instead.
          </Section>

          <Section title="2. Accounts">
            Creating an account requires a valid email and a password. You&apos;re responsible for keeping
            your credentials safe and for activity under your account. We may suspend accounts used to
            abuse the service or attempt to bypass its policy controls.
          </Section>

          <Section title="3. Acceptable use">
            Don&apos;t use OmniMind to generate content that is illegal, infringing, or intended to harm
            others, and don&apos;t attempt to probe, disrupt, or gain unauthorized access to the underlying
            infrastructure.
          </Section>

          <Section title="4. No warranty">
            OmniMind is provided as-is, without warranty of any kind. Outputs from the underlying language
            model may be inaccurate — verify anything important before relying on it.
          </Section>

          <Section title="5. Changes">
            Features, pricing, and these terms may change as the product develops. Material changes will
            be reflected on this page.
          </Section>

          <Section title="6. Contact">
            Questions about these terms can be sent to the account listed as the service&apos;s
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
