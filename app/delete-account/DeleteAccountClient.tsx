"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function DeleteAccountClient() {
  const { data: session, status } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <div className="glass rounded-2xl p-5">
        <p className="text-sm text-white mb-3">You&apos;re not signed in.</p>
        <Link href="/login" className="text-sm font-semibold text-cyan hover:text-white transition-colors">
          Sign in to continue →
        </Link>
      </div>
    );
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Could not reach the server. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm text-white mb-1">Signed in as {session.user.email}</p>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="mt-3 text-sm font-semibold text-crimson hover:text-white transition-colors"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-crimson mb-3">
            This cannot be undone. Your account and all data will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm font-semibold text-white bg-crimson/80 hover:bg-crimson disabled:opacity-50 rounded-xl px-4 py-2 transition-colors"
            >
              {deleting ? "Deleting…" : "Yes, permanently delete"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="text-sm font-semibold text-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-crimson mt-3">{error}</p>}
    </div>
  );
}
