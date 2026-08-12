"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";

export const HOME_TABS = [
  { href: "/home", icon: "🏠", key: "tabHome" as const },
  { href: "/home/rank", icon: "🏆", key: "tabRank" as const },
  { href: "/home/impact", icon: "🌱", key: "tabImpact" as const },
  { href: "/home/missions", icon: "✅", key: "tabMissions" as const },
  { href: "/home/shop", icon: "🛍️", key: "tabShop" as const },
  { href: "/home/feedback", icon: "💭", key: "tabFeedback" as const },
];

export function HomeNavIcons({ className }: { className?: string }) {
  const { t } = useLanguage();
  const pathname = usePathname() ?? "";

  return (
    <div className={`flex justify-center gap-2.5 ${className ?? ""}`}>
      {HOME_TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={t[tab.key]}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-[17px] shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition ${
              active ? "bg-helen-gold/90 ring-2 ring-helen-gold/40" : "bg-black/35 backdrop-blur-sm"
            }`}
          >
            {tab.icon}
          </Link>
        );
      })}
    </div>
  );
}
