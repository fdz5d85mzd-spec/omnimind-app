"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/helen/auth/AuthProvider";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";
import { getReferralCode } from "@/lib/helen/referral";

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { join } = useProfile();
  const { user, ready: authReady, configured } = useAuth();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [username, setUsername] = useState("");
  const trimmedUsername = username.trim();

  useEffect(() => {
    if (configured && authReady && !user) router.replace("/helen/signin?next=/helen/checkout");
  }, [configured, authReady, user, router]);

  /**
   * Tries the real Stripe Checkout Session (POST /api/checkout) first — this
   * redirects away to Stripe's own hosted payment page, which is where card
   * details actually get collected; that route 501s until STRIPE_SECRET_KEY
   * is set, in which case we fall back to simulating the round trip locally
   * so the flow still works with no backend configured. Once Stripe is
   * actually live, a failure here should surface a real error instead of
   * silently falling back — this still needs that hardening pass; see
   * docs/GOING-LIVE.md.
   *
   * Requires authReady so we never fire with a not-yet-loaded session —
   * that gap is what let real purchases through with a null
   * clientReferenceId before (see app/home/shop/page.tsx for the same fix).
   */
  async function handlePay() {
    if (!trimmedUsername) return;
    if (configured && !authReady) return;
    if (configured && !user) {
      router.push("/helen/signin?next=/helen/checkout");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/helen/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientReferenceId: user?.id,
          username: trimmedUsername,
          refCode: getReferralCode(),
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { url?: string; bypass?: boolean };
        if (body.bypass) {
          // Admin/master account -- checked out server-side, no Stripe redirect.
          join(trimmedUsername);
          setProcessing(false);
          router.push("/helen/card");
          return;
        }
        if (body.url) {
          window.location.href = body.url;
          return;
        }
      }
    } catch {
      // network error reaching /api/checkout — fall through to the mock flow below
    }
    await new Promise((r) => setTimeout(r, 900));
    join(trimmedUsername);
    setProcessing(false);
    router.push("/helen/card");
  }

  return (
    <>
      <h1 className="mt-6 mb-5 text-[20px] font-helen-display font-semibold">{t.checkoutTitle}</h1>

      <label className="mb-1.5 block text-[13px] font-semibold text-helen-paper">{t.usernameLabel}</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder={t.usernamePlaceholder}
        maxLength={20}
        autoCapitalize="none"
        className="mb-1.5 w-full rounded-xl bg-helen-card px-4 py-3 text-[14px] text-helen-paper outline-none placeholder:text-helen-dim"
      />
      <p className="mb-4.5 text-[11px] text-helen-dim">{t.usernameRequiredNote}</p>

      <div className="mb-4.5 rounded-xl bg-helen-card p-4">
        <div className="mb-1.5 flex justify-between text-[13px]">
          <span>{t.priceLabel}</span>
          <span>1,00 €</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-[13px] font-bold text-helen-gold">
          <span>{t.priceLabel}</span>
          <span>1,00 €</span>
        </div>
      </div>

      <div className="flex-1" />
      <button
        type="button"
        disabled={processing || !trimmedUsername || (configured && !authReady)}
        onClick={handlePay}
        className="flex w-full items-center justify-center rounded-xl bg-helen-coral py-[15px] text-[14.5px] font-bold text-helen-ink disabled:opacity-70"
      >
        {processing ? (
          <>
            <span className="mr-2 inline-block h-[18px] w-[18px] animate-helen-spin-fast rounded-full border-2 border-helen-ink/30 border-t-ink" />
            {t.processingLabel}
          </>
        ) : (
          t.payBtn
        )}
      </button>
      <p className="mt-2.5 text-center text-[11px] text-helen-dim">
        {t.legalFooterNote}{" "}
        <a href="/helen/terms" className="font-semibold text-helen-gold underline">
          {t.viewTermsLink}
        </a>
      </p>
    </>
  );
}
