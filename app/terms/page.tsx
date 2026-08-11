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
            OmniMind — including Mission Control, VoxStudio, and Helen, all one product — is an
            early-stage product, actively changing. These terms cover the basics of using it; they are not
            a substitute for advice from a lawyer, and we&apos;ll update them as the product grows.
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

          <Section title="5. Helen membership">
            Helen runs on its own sign-in system, separate from your main OmniMind account. Joining costs a
            one-time €1 fee and grants a permanent, non-transferable Member ID — non-refundable except
            where required by law. Your creature and any cosmetic shop items are virtual goods with no cash
            value, exist only within Helen, and can&apos;t be exchanged, transferred, or redeemed for
            money. A share of membership fees and shop revenue goes to a shared Impact Fund; members vote
            each cycle on which listed organizations receive it, and Helen doesn&apos;t guarantee any
            specific outcome, timeline, or amount for any organization. One Member ID per person; we may
            suspend accounts used to abuse or manipulate votes, leaderboards, or the shop. Any username or
            creature name you choose must not be abusive, impersonating, or unlawful — we may remove
            content that violates this.
          </Section>

          <Section title="6. Changes">
            Features, pricing, and these terms may change as the product develops. Material changes will
            be reflected on this page.
          </Section>

          <Section title="7. Contact">
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
