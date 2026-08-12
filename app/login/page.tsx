"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn, useSession } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { PasswordField } from "@/components/PasswordField";

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.26 5.69.42.36.78 1.07.78 2.15 0 1.56-.01 2.81-.01 3.19 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCallback = searchParams?.get("callbackUrl") || "/chat";
  const callbackUrl =
    requestedCallback.startsWith("/") && !requestedCallback.startsWith("//")
      ? requestedCallback
      : "/chat";
  const { status } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<Record<
    string,
    ClientSafeProvider
  > | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.push(callbackUrl);
  }, [status, router, callbackUrl]);

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Wrong email or password.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Account created — sign in below.");
      setMode("signin");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, #5B6EF5 0%, transparent 70%)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <LogoMark size={28} />
          <span className="font-head font-semibold text-lg text-white">
            OmniMind
          </span>
        </Link>

        <div className="glass rounded-2xl p-7 shadow-panel">
          {providers?.github && (
            <>
              <button
                type="button"
                onClick={() => signIn("github", { callbackUrl })}
                className="w-full flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mb-4"
              >
                <GitHubIcon />
                Continue with GitHub
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-[11px] text-mutedDark">or</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>
            </>
          )}
          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.04]">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${
                mode === "signin"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-white"
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
                mode === "signup"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              Sign up
            </button>
          </div>

          <form
            onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
            className="space-y-3.5"
          >
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Name
                </label>
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
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Email
              </label>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-muted">
                  Password
                </label>
                {mode === "signin" && (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-cyan hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <PasswordField
                value={password}
                onChange={setPassword}
                required
                minLength={mode === "signup" ? 8 : undefined}
                placeholder={
                  mode === "signup" ? "At least 8 characters" : "••••••••"
                }
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
            </div>

            {error && <p className="text-xs text-crimson">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-accent to-accent/80 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-opacity mt-1"
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <LoginContent />
    </Suspense>
  );
}
