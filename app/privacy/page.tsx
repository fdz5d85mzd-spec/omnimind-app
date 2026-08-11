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
            updated as new features (like server-synced conversation history) ship. This page covers
            OmniMind, Mission Control, and VoxStudio. Helen is a related but separately-branded product
            with its own account system and its own{" "}
            <Link href="/helen/privacy" className="text-cyan hover:underline">
              privacy policy
            </Link>
            .
          </p>

          <Section title="What we store">
            When you create an account: your name, email address, and a bcrypt-hashed password — never
            the password itself. If you sign in with GitHub instead, we receive your name, email, and
            avatar from GitHub rather than a password. Sign-in sessions are handled via signed tokens.
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
            We use a small set of providers to run the service, and only send them what each one needs to
            do its job:
            <ul className="mt-2.5 space-y-2 list-disc pl-5">
              <li>
                <span className="text-white font-medium">Anthropic</span> — your prompt is sent to
                Anthropic&apos;s API to generate the agent&apos;s response, subject to their own terms.
              </li>
              <li>
                <span className="text-white font-medium">ElevenLabs</span> — when you use voice replies in
                chat, the text of the reply is sent to ElevenLabs to synthesize spoken audio.
              </li>
              <li>
                <span className="text-white font-medium">Higgsfield</span> — VoxStudio image and video
                generation (and admin-side social content drafts) are produced by calling Higgsfield&apos;s
                API on your behalf.
              </li>
              <li>
                <span className="text-white font-medium">Stripe</span> — paid plans, credit purchases, and
                promo codes are processed by Stripe. We never see or store your full card number; Stripe
                handles that directly.
              </li>
              <li>
                <span className="text-white font-medium">GitHub</span> — only if you choose to sign in with
                GitHub instead of email/password.
              </li>
              <li>
                <span className="text-white font-medium">Resend</span> — sends transactional email only
                (password reset links), not marketing email.
              </li>
            </ul>
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
      <div>{children}</div>
    </div>
  );
}
