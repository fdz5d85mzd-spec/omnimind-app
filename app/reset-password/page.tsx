"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { PasswordField } from "@/components/PasswordField";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Something went wrong.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-7 shadow-panel">
      {!token ? (
        <div className="text-center">
          <h1 className="font-head text-lg font-semibold text-white mb-2">Invalid link</h1>
          <p className="text-sm text-muted leading-relaxed">
            This reset link is missing its token.{" "}
            <Link href="/forgot-password" className="text-cyan hover:underline">
              Request a new one
            </Link>
            .
          </p>
        </div>
      ) : done ? (
        <div className="text-center">
          <h1 className="font-head text-lg font-semibold text-white mb-2">Password updated</h1>
          <p className="text-sm text-muted leading-relaxed">Taking you to sign in…</p>
        </div>
      ) : (
        <>
          <h1 className="font-head text-lg font-semibold text-white mb-1.5">Choose a new password</h1>
          <p className="text-sm text-muted mb-6 leading-relaxed">At least 8 characters.</p>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <PasswordField
              label="New password"
              value={password}
              onChange={setPassword}
              required
              minLength={8}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              required
              minLength={8}
              placeholder="Type it again"
              autoComplete="new-password"
            />
            {error && <p className="text-xs text-crimson">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-accent to-accent/80 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-opacity mt-1"
            >
              {loading ? "Saving…" : "Reset password"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #5B6EF5 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <LogoMark size={28} />
          <span className="font-head font-semibold text-lg text-white">OmniMind</span>
        </Link>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
        <p className="text-center text-xs text-mutedDark mt-6">
          <Link href="/login" className="underline hover:text-muted">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
