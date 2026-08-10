import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Guide — OmniMind" };

function Section({
  eyebrow,
  title,
  children,
  cta,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  cta: { href: string; label: string };
}) {
  return (
    <div className="glass rounded-3xl p-8">
      <p className="text-xs font-semibold tracking-wide text-accent uppercase mb-2">{eyebrow}</p>
      <h2 className="font-head text-2xl font-semibold text-white mb-3">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-3">{children}</div>
      <Link
        href={cta.href}
        className="inline-block mt-5 text-sm font-semibold text-cyan hover:underline"
      >
        {cta.label} →
      </Link>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-10 w-fit">
          <LogoMark size={22} />
          <span className="font-head font-semibold text-white">OmniMind</span>
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-head text-4xl font-semibold text-gradient mb-3">How OmniMind works</h1>
          <p className="text-muted text-sm max-w-lg mx-auto leading-relaxed">
            One account, one place. Everything below lives inside OmniMind — nothing here is a
            separate app with its own sign-up or its own bill.
          </p>
        </div>

        <div className="space-y-6">
          <Section
            eyebrow="The core"
            title="OmniMind"
            cta={{ href: "/chat", label: "Ask OmniMind anything" }}
          >
            <p>
              OmniMind is the autonomous AI operating system this whole app is built on. Ask it
              anything and a real request goes through a Policy Engine (checks it&apos;s allowed), a
              Meta-Orchestrator (assigns it to one of 40 named fleet agents — a Code Agent, a
              Research Agent, a Writer Agent, and so on — by what the request actually needs), and
              Versioned Memory (every exchange is recorded, nothing is thrown away).
            </p>
            <p>
              Track it live in{" "}
              <Link href="/mission-control" className="text-cyan hover:underline">
                Mission Control
              </Link>
              , and set your language and check your credits in{" "}
              <Link href="/settings" className="text-cyan hover:underline">
                Settings
              </Link>
              .
            </p>
          </Section>

          <Section eyebrow="Part of OmniMind" title="Helen" cta={{ href: "/helen", label: "Open Helen" }}>
            <p>
              Helen is a €1 global membership: you get a virtual creature companion that grows as
              you care for it, and every membership feeds a shared, real-world Impact Fund. It has
              its own look and its own world, but it&apos;s a section of OmniMind, not a separate
              product — same account, same payments (Stripe on this same OmniMind deployment, not a
              separate merchant), and a small{" "}
              <span className="text-white">← OmniMind</span> button in the corner of every Helen
              screen brings you straight back here.
            </p>
          </Section>

          <Section
            eyebrow="Part of OmniMind"
            title="VoxStudio"
            cta={{ href: "/voxstudio", label: "Open VoxStudio" }}
          >
            <p>
              VoxStudio is AI film pre-production, built natively into OmniMind: describe an idea in
              one line and the Director Agent breaks it into a title, logline, characters, scenes,
              and a shot list — running on the same OmniMind account, no separate sign-up.
            </p>
            <p>
              Today that planning step is fully live. Turning a brief into actual video, images, or
              character voice is the next layer, added as those generation providers get connected —
              the page itself always shows honestly what&apos;s live and what isn&apos;t yet.
            </p>
          </Section>
        </div>

        <p className="text-center text-xs text-mutedDark mt-10">
          Questions?{" "}
          <Link href="/chat" className="text-cyan hover:underline">
            Ask OmniMind
          </Link>{" "}
          directly.
        </p>
      </div>
    </div>
  );
}
