"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") router.push("/chat");
  }, [status, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Wrong email or password.");
      setLoading(false);
    } else {
      router.push("/chat");
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body.error || "Couldn't create the account.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Account created — sign in below.");
      setMode("signin");
      setLoading(false);
    } else {
      router.push("/chat");
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
          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.04]">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${
                mode === "signin" ? "bg-accent text-white" : "text-muted hover:text-white"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${
                mode === "signup" ? "bg-accent text-white" : "text-muted hover:text-white"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent/60 transition-colors"
                  placeholder="Your name"
                />
              </div>
            )}
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
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "signup" ? 8 : undefined}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent/60 transition-colors"
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
              />
            </div>

            {error && <p className="text-xs text-crimson">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-accent to-accent/80 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-opacity mt-1"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-mutedDark mt-6">
          By continuing you agree to the{" "}
          <Link href="/terms" className="underline hover:text-muted">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-muted">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
