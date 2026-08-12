"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";

export const HOME_TABS = [
  { href: "/helen/home", icon: "⌂", key: "tabHome" as const },
  { href: "/helen/home/rank", icon: "♕", key: "tabRank" as const },
  { href: "/helen/home/impact", icon: "♧", key: "tabImpact" as const },
  { href: "/helen/home/missions", icon: "✓", key: "tabMissions" as const },
  { href: "/helen/home/shop", icon: "◇", key: "tabShop" as const },
  { href: "/helen/home/feedback", icon: "◌", key: "tabFeedback" as const },
];

export function HomeNavIcons({ className }: { className?: string }) {
  const { t } = useLanguage();
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Helen sections"
      className={`grid grid-cols-6 gap-1.5 rounded-[1.25rem] border border-white/10 bg-[#080d25]/75 p-1.5 shadow-xl backdrop-blur-xl sm:gap-2 ${className ?? ""}`}
    >
      {HOME_TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={t[tab.key]}
            className={`flex h-10 min-w-0 items-center justify-center rounded-xl font-helen-num text-[16px] transition ${
              active
                ? "bg-gradient-to-br from-[#675cff] to-[#27cfc8] text-white shadow-[0_7px_18px_rgba(78,105,255,.3)]"
                : "bg-white/[0.035] text-helen-dim hover:bg-white/[0.08]"
            }`}
          >
            {tab.icon}
          </Link>
        );
      })}
    </nav>
  );
}
