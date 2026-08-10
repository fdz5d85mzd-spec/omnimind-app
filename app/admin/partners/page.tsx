import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import PartnersClient from "@/components/admin/PartnersClient";

export const metadata = { title: "Partners — OmniMind Admin" };

export default async function PartnersPage() {
  const session = await getServerSession(authOptions);
  const isMaster = session?.user?.isMaster ?? false;
  const isAdmin = session?.user?.isAdmin ?? false;
  const isPrivileged = isMaster || isAdmin;

  if (!isPrivileged) {
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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="font-head font-semibold text-sm text-white">OmniMind</span>
          </Link>
          <span className="hidden sm:inline text-xs text-mutedDark tracking-wide">PARTNERS</span>
        </div>
        <Link
          href="/admin"
          className="text-xs font-bold text-white glass rounded-lg px-3.5 py-2 hover:bg-white/[0.08] transition-colors"
        >
          Admin
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-head text-2xl font-semibold text-white mb-1.5">Partners</h1>
        <p className="text-sm text-mutedDark mb-8">
          Each partner gets a link (<code className="text-cyan">/helen?ref=CODE</code>) that tags any
          resulting Helen purchase with their code, directly on the Stripe payment — commission owed is
          computed live from those real, tagged payments, not tracked separately.
        </p>
        <PartnersClient />
      </main>
    </div>
  );
}
