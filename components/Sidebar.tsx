"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import type { Conversation } from "@/lib/conversations";
import { Logo } from "@/components/Logo";
import { useCredits } from "@/lib/useCredits";

function BoltIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  collapsed,
  onCloseMobile,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  collapsed: boolean;
  onCloseMobile: () => void;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: session, status } = useSession();
  const user = session?.user;
  const privileged = user?.isMaster || user?.isAdmin;
  const initial = (user?.name || user?.email || "G").charAt(0).toUpperCase();
  const credits = useCredits();

  return (
    <aside
      className={`${
        collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
      } fixed lg:static inset-y-0 left-0 z-40 w-72 shrink-0 bg-card2/50 backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-transform duration-200`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between px-2 py-2.5 mb-3">
          <Link href="/">
            <Logo />
          </Link>
          <button onClick={onCloseMobile} className="lg:hidden text-muted hover:text-white p-1 transition-colors">
            ✕
          </button>
        </div>
        <button
          onClick={onNew}
          className="group w-full flex items-center gap-2.5 rounded-xl border border-white/[0.08] hover:border-accent/50 bg-white/[0.03] hover:bg-white/[0.06] text-white text-sm font-medium px-3.5 py-2.5 transition-all"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-accent to-cyan text-bg transition-transform group-hover:scale-105">
            <PlusIcon />
          </span>
          New chat
        </button>
        <Link
          href="/mission-control"
          className="mt-1.5 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <RadarIcon />
          Mission Control
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {conversations.length > 0 && (
          <p className="px-2.5 pt-2 pb-1.5 text-[11px] font-semibold tracking-wide text-mutedDark uppercase">
            Recent
          </p>
        )}
        {conversations.length === 0 && (
          <p className="text-xs text-mutedDark px-2.5 py-6 text-center leading-relaxed">
            No conversations yet.
            <br />
            Start one below.
          </p>
        )}
        {conversations.map((c) => {
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`relative w-full flex items-center gap-2.5 rounded-lg pl-3 pr-2.5 py-2 text-left text-sm transition-colors ${
                isActive ? "bg-accent/[0.14] text-white" : "text-muted hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-accent to-cyan" />
              )}
              <span className={isActive ? "text-cyan" : "text-mutedDark"}>
                <ChatIcon />
              </span>
              <span className="truncate">{c.title}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-3 relative">
        {accountOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-card2 border border-white/[0.08] rounded-xl p-3.5 shadow-panel animate-popIn origin-bottom space-y-2.5">
            {user ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-white mb-0.5 truncate">{user.name || user.email}</p>
                  <p className="text-[11px] text-mutedDark truncate">{user.email}</p>
                </div>
                {credits && (
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-2">
                    <span className="flex items-center gap-1.5 text-xs text-amber font-semibold">
                      <BoltIcon />
                      {credits.creditBalance} credits
                    </span>
                    <span className="text-[10px] text-mutedDark uppercase">{credits.plan}</span>
                  </div>
                )}
                <p className="text-xs text-muted leading-relaxed">
                  Conversation history is still stored on this device only — accounts don&apos;t sync it
                  across devices yet.
                </p>
                {privileged && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-xs font-semibold text-cyan hover:text-white transition-colors"
                  >
                    <ShieldIcon />
                    Admin dashboard
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs font-semibold text-crimson hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-white mb-1">Guest session</p>
                <p className="text-xs text-muted leading-relaxed">
                  History is stored on this device only. Sign in to unlock account features as they ship.
                </p>
                <Link href="/login" className="block text-xs font-semibold text-cyan hover:text-white transition-colors">
                  Sign in →
                </Link>
              </>
            )}
          </div>
        )}
        <button
          onClick={() => setAccountOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-white/[0.04] transition-colors"
        >
          <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-accent to-cyan flex items-center justify-center text-[10px] font-bold text-bg">
            {initial}
          </div>
          <span className="flex-1 text-sm text-muted truncate">
            {status === "loading" ? "…" : user ? user.name || user.email : "Guest"}
          </span>
          <span className="text-mutedDark">
            <GearIcon />
          </span>
        </button>
      </div>
    </aside>
  );
}
