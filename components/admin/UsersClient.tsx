"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  creditBalance: number;
  createdAt: string;
}

export default function UsersClient() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);

  async function load(query: string) {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
    const body = await res.json().catch(() => ({}));
    if (res.ok) setUsers(body.users ?? []);
    else setError(body.error || "Failed to load users");
  }

  useEffect(() => {
    load("");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function viewAs(id: string) {
    if (viewingId) return;
    setViewingId(id);
    setError("");
    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not switch into that user's view");
      setViewingId(null);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-mutedDark outline-none focus:border-accent/60"
        />
        {error && <p className="text-xs text-crimson mt-3">{error}</p>}
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4">Users {users ? `(${users.length})` : ""}</p>
        {!users ? (
          <p className="text-xs text-mutedDark">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-xs text-mutedDark">No users match.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{u.name || "—"}</p>
                  <p className="text-[11px] text-mutedDark font-mono">{u.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-white">{u.creditBalance} credits</p>
                    <p className="text-[11px] text-mutedDark">{u.plan}</p>
                  </div>
                  <button
                    onClick={() => viewAs(u.id)}
                    disabled={viewingId !== null}
                    className="text-xs font-semibold text-cyan hover:text-white disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {viewingId === u.id ? "Switching…" : "View as →"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
