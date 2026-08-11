"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/Logo";

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0l-6.4-6.4a2 2 0 0 1 0-2.8L11.4 3.4A2 2 0 0 1 12.8 3H19a2 2 0 0 1 2 2v6.2a2 2 0 0 1-.4 1.4z" />
      <circle cx="15" cy="9" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 12 5-5 4 2 3-2 8 8-3 3-6-4" />
      <path d="m8 18 3-3" />
      <path d="m5 15 3-3" />
    </svg>
  );
}

function CalcIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
    </svg>
  );
}

function PlugIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v4M15 2v4M7 8h10l-1 5a4 4 0 0 1-4 3.5A4 4 0 0 1 8 13z" />
      <path d="M12 16.5V20M9 20h6" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12 L12 4.5 A7.5 7.5 0 0 1 19.5 12 Z" fill="currentColor" stroke="none" opacity="0.35" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ClapperIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 20.5 5l.8 4-17.5 3.5z" />
      <rect x="3" y="10" width="18" height="10" rx="1.5" />
      <path d="m6 8 3-3.5M11 7l3-3.5M16 6.2l3-3.5" />
    </svg>
  );
}

const NAV = [
  { href: "/admin", label: "Overview", icon: GridIcon },
  { href: "/admin/revenue", label: "Revenue", icon: CoinsIcon },
  { href: "/admin/social", label: "Social", icon: ClapperIcon },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: TagIcon },
  { href: "/admin/partners", label: "Partners", icon: HandshakeIcon },
  { href: "/admin/pricing", label: "Pricing", icon: CalcIcon },
  { href: "/admin/integrations", label: "Integrations", icon: PlugIcon },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-accent/[0.16] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(91,110,245,0.4)]"
                : "text-muted hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// Mobile nav: a horizontally scrollable tab strip instead of a hamburger +
// slide-out drawer. Always visible, nothing to open/close or get stuck --
// swipe to reach a tab that's off-screen, same as any native tab bar.
function NavTabs({ pathname }: { pathname: string }) {
  return (
    <nav className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] whitespace-nowrap transition-colors ${
              active
                ? "bg-accent/[0.18] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(91,110,245,0.45)]"
                : "text-muted bg-white/[0.04] hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-white/[0.06] bg-card/30 backdrop-blur-xl px-4 py-5">
        <Link href="/" className="flex items-center gap-2 px-2 mb-1">
          <LogoMark size={20} />
          <span className="font-head font-semibold text-sm text-white">OmniMind</span>
        </Link>
        <span className="px-2 text-[10px] tracking-wide text-mutedDark uppercase mb-5">Admin</span>

        <NavLinks pathname={pathname} />

        <div className="mt-auto pt-4 border-t border-white/[0.06] space-y-1">
          <Link
            href="/mission-control"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <RadarIcon />
            Mission Control
          </Link>
          <div className="px-3 pt-2 text-[11px] text-mutedDark truncate" title={email}>
            {email}
          </div>
        </div>
      </aside>

      {/* Mobile top bar + always-visible scrollable tab strip */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-white/[0.06] bg-card/60 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="font-head font-semibold text-sm text-white">OmniMind</span>
            <span className="text-[10px] tracking-wide text-mutedDark uppercase ml-1">Admin</span>
          </Link>
          <Link
            href="/mission-control"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <RadarIcon />
          </Link>
        </div>
        <NavTabs pathname={pathname} />
      </header>

      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
