import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { CHARS_PER_CREDIT, FREE_COOLDOWN_HOURS, FREE_REFILL_CREDITS, FREE_STARTING_CREDITS } from "@/lib/credits";

export const metadata = { title: "Pricing — OmniMind" };

const FREE_FEATURES = [
  `${FREE_STARTING_CREDITS} credits to start, no card required`,
  `Refills ${FREE_REFILL_CREDITS} credits every ${FREE_COOLDOWN_HOURS}h once you run out`,
  "Every subsystem included — Policy Engine, Orchestrator, Memory, Digital Twin",
  "Live Mission Control dashboard",
  "Streamed answers, not a spinner",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-10 w-fit">
          <LogoMark size={22} />
          <span className="font-head font-semibold text-white">OmniMind</span>
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-head text-4xl font-semibold text-gradient mb-3">Pricing</h1>
          <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
            One plan, honestly priced: free. Cost is credits proportional to what the agent actually
            writes back — not a flat fee per message.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 max-w-sm mx-auto">
          <div className="h-11 w-11 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center mb-5">
            <LogoMark size={20} />
          </div>
          <h2 className="font-head text-2xl font-semibold text-white mb-1">Free</h2>
          <p className="text-sm text-mutedDark mb-5">Everything OmniMind can do, today</p>
          <p className="font-head text-4xl font-semibold text-white mb-1">
            $0<span className="text-base font-normal text-mutedDark"> forever</span>
          </p>
          <Link
            href="/login"
            className="mt-6 block text-center bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 shadow-glow rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          >
            Try OmniMind →
          </Link>

          <ul className="mt-7 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                <CheckIcon />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="max-w-sm mx-auto mt-6 glass rounded-2xl p-5">
          <p className="text-xs text-mutedDark leading-relaxed">
            How credits work: 1 credit ≈ {CHARS_PER_CREDIT} characters of the actual answer you receive.
            Short answers cost less, long ones cost more — never a flat per-message charge. There is no
            paid tier to buy more credits yet; when your balance hits zero, it refills on the cooldown
            above.
          </p>
        </div>

        <p className="text-center text-xs text-mutedDark mt-8">
          Questions?{" "}
          <Link href="/chat" className="text-cyan hover:underline">
            Ask OmniMind
          </Link>{" "}
          directly, or read the{" "}
          <Link href="/terms" className="text-cyan hover:underline">
            Terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald shrink-0 mt-0.5"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
