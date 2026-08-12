"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogoMark } from "@/components/Logo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n/languages";
import CreditsBadge from "@/components/CreditsBadge";

// Shared across every top-level page (not just the homepage) -- this used
// to be defined only inside app/page.tsx, so the language switcher,
// Settings link, and Sign out button only ever existed on the homepage.
// Every other page (pricing, guide, settings, privacy, terms, voxstudio)
// had nothing but a bare logo, with no way back into the menu at all.
export default function TopNav({ overlay = false }: { overlay?: boolean }) {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Tapping anywhere outside the open mobile menu (not just its own links
  // or the X button) closes it -- it had no way to dismiss itself otherwise.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const links = [
    { href: "/helen", label: t.navHelen },
    { href: "/voxstudio", label: t.navVoxStudio },
    { href: "/aria-go", label: t.navAriaGo },
    { href: "/ogn", label: t.navOgn },
    { href: "/orpheus", label: "Orpheus" },
    { href: "/contests", label: "Contests" },
    { href: "/mission-control", label: t.navMissionControl },
    { href: "/pricing", label: t.navPricing },
    ...(status !== "loading" && !session?.user ? [{ href: "/login", label: t.navSignIn }] : []),
    ...(session?.user ? [{ href: "/settings", label: t.navSettings }] : []),
    ...(session?.user?.isMaster || session?.user?.isAdmin ? [{ href: "/admin", label: t.navAdmin }] : []),
  ];

  return (
    <header
      ref={headerRef}
      className={
        overlay
          ? "absolute top-0 inset-x-0 z-20 px-6 sm:px-10 py-6"
          : "sticky top-0 z-20 px-6 sm:px-10 py-4 bg-bg/80 backdrop-blur-xl border-b border-white/[0.06]"
      }
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={22} />
          <span className="font-head font-semibold text-[15px] tracking-tight text-white">OmniMind</span>
        </Link>

        <nav
          ref={railRef}
          onWheel={(event) => {
            if (Math.abs(event.deltaY) > Math.abs(event.deltaX) && railRef.current) railRef.current.scrollLeft += event.deltaY;
          }}
          className="hidden sm:flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scroll-smooth px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main navigation"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative shrink-0 text-sm px-3 py-2 rounded-xl transition-all ${pathname === l.href ? "bg-white/[0.09] text-white shadow-[inset_0_-2px_0_#22d3ee]" : "text-muted hover:text-white hover:bg-white/[0.05]"}`}
            >
              {l.label}
            </Link>
          ))}
          <span className="ml-auto" />
          <CreditsBadge />
          <LanguageSwitcher compact />
          <Link
            href="/chat"
            className="text-sm font-semibold text-white glass rounded-xl px-4 py-2 hover:bg-white/[0.08] transition-colors"
          >
            {t.navAskOmniMind}
          </Link>
        </nav>

        <div className="flex sm:hidden items-center gap-1.5">
          <CreditsBadge className="max-w-[132px]" />
          <Link
            href="/chat"
            className="text-sm font-semibold text-white glass rounded-xl px-4 py-2 hover:bg-white/[0.08] transition-colors"
          >
            {t.navAskOmniMind}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="glass rounded-xl p-2.5 text-white"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="sm:hidden mt-3 glass rounded-2xl p-2 flex flex-col animate-fadeIn">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-muted hover:text-white px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          {session?.user && (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="text-left text-sm text-muted hover:text-white px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              {t.settingsSignOut}
            </button>
          )}
          <div className="px-3 py-2 border-t border-white/[0.06] mt-1 pt-3">
            <LanguageSwitcher full />
          </div>
        </nav>
      )}
    </header>
  );
}

export function LanguageSwitcher({ full = false, compact = false }: { full?: boolean; compact?: boolean }) {
  const { lang, setLang } = useLanguage();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as (typeof LANGUAGES)[number]["code"])}
      aria-label="Language"
      className={`text-sm text-muted hover:text-white bg-transparent border border-white/[0.08] rounded-xl px-3 py-2 outline-none cursor-pointer transition-colors ${
        full ? "w-full" : ""
      }`}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code} className="bg-card2 text-white">
          {compact ? l.code.toUpperCase() : l.label}
        </option>
      ))}
    </select>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
