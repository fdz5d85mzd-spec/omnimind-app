"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useAuth } from "@/lib/helen/auth/AuthProvider";
import Link from "next/link";

function SignInForm() {
  const { t } = useLanguage();
  const { user, ready, configured, signInWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams?.get("next") ?? "";
  const next =
    requestedNext.startsWith("/helen") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/helen/checkout";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  useEffect(() => {
    if (!configured || (ready && user)) router.replace(next);
  }, [configured, ready, user, next, router]);

  if (!configured || !ready || user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const redirectTo = `${window.location.origin}/helen/auth/callback?next=${encodeURIComponent(next)}`;
      await signInWithEmail(email, redirectTo);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="mb-2 font-helen-display text-xl font-semibold">
          {t.checkEmailTitle}
        </h1>
        <p className="mb-6 text-[13px] text-helen-dim">{t.checkEmailSub}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm font-semibold text-helen-gold"
        >
          {t.resendBtn}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <h1 className="mb-2 text-center font-helen-display text-xl font-semibold">
        {t.signInTitle}
      </h1>
      <p className="mb-6 text-center text-[13px] text-helen-dim">
        {t.signInSub}
      </p>
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(next)}`}
        className="mb-5 block w-full rounded-xl bg-helen-coral py-[15px] text-center text-[14.5px] font-bold text-helen-ink"
      >
        Continue with OmniMind
      </Link>
      <div className="mb-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-helen-dim">
        <span className="h-px flex-1 bg-white/10" />
        or email link
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          className="mb-3 w-full rounded-lg border border-white/10 bg-helen-card px-3 py-2.5 text-[13px] text-helen-paper"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-xl bg-helen-coral py-[15px] text-[14.5px] font-bold text-helen-ink disabled:opacity-70"
        >
          {t.sendLinkBtn}
        </button>
        {status === "error" && (
          <p className="mt-2.5 text-center text-xs text-helen-coral">
            {t.signInError}
          </p>
        )}
      </form>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
