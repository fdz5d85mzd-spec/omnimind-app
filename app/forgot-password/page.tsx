"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Something went wrong.");
        return;
      }
      setDone(true);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

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

        <div className="glass rounded-2xl p-7 shadow-panel">
          {done ? (
            <div className="text-center">
              <h1 className="font-head text-lg font-semibold text-white mb-2">Check your email</h1>
              <p className="text-sm text-muted leading-relaxed">
                If an account exists for <span className="text-white">{email}</span>, we&apos;ve sent a
                link to reset your password. It expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-head text-lg font-semibold text-white mb-1.5">Forgot your password?</h1>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent/60 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                {error && <p className="text-xs text-crimson">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-accent to-accent/80 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-opacity mt-1"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-mutedDark mt-6">
          <Link href="/login" className="underline hover:text-muted">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
