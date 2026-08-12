"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Send, Trophy, Settings } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/chat", label: "Ask", Icon: MessageCircle },
  { href: "/orpheus", label: "Send", Icon: Send },
  { href: "/contests", label: "Win", Icon: Trophy },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function MobileDock() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/chat") || pathname.startsWith("/helen") || pathname.startsWith("/admin")) return null;
  return (
    <nav className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center justify-around rounded-[22px] border border-white/10 bg-[#0a0e2e]/88 px-1.5 py-1.5 shadow-[0_18px_60px_rgba(0,0,0,.5)] backdrop-blur-2xl sm:hidden" aria-label="Mobile navigation">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link key={href} href={href} className={`relative flex min-w-[56px] flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[9px] font-semibold transition-all ${active ? "-translate-y-1 bg-gradient-to-br from-accent/35 to-cyan/20 text-white shadow-[0_8px_24px_rgba(91,110,245,.28)]" : "text-muted hover:text-white"}`}>
          <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
          <span>{label}</span>
          {active && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-cyan shadow-[0_0_8px_#22d3ee]" />}
        </Link>;
      })}
    </nav>
  );
}
