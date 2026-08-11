"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogoMark } from "@/components/Logo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n/languages";

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
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={22} />
          <span className="font-head font-semibold text-[15px] tracking-tight text-white">OmniMind</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted hover:text-white px-4 py-2 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          {session?.user && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-muted hover:text-white px-4 py-2 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              {t.settingsSignOut}
            </button>
          )}
          <LanguageSwitcher />
          <Link
            href="/chat"
            className="text-sm font-semibold text-white glass rounded-xl px-4 py-2 hover:bg-white/[0.08] transition-colors"
          >
            {t.navAskOmniMind}
          </Link>
        </nav>

        <div className="flex sm:hidden items-center gap-2">
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

export function LanguageSwitcher({ full = false }: { full?: boolean }) {
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
          {l.label}
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
