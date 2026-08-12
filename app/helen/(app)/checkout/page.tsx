"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { getReferralCode } from "@/lib/helen/referral";
import { useTransactionConfirm } from "@/components/TransactionConfirmProvider";

type PaymentMethod = "card" | "credits";

export default function CheckoutPage() {
  const { t, lang } = useLanguage();
  const { data: omniSession, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmTransaction = useTransactionConfirm();
  const trimmedUsername = username.trim();
  const isPrivileged = Boolean(
    omniSession?.user?.isMaster || omniSession?.user?.isAdmin,
  );

  async function continueToPayment() {
    if (!trimmedUsername || processing) return;
    setError(null);

    if (method === "credits" && !omniSession?.user) {
      sessionStorage.setItem("helen_pending_username", trimmedUsername);
      router.push("/login?callbackUrl=/helen/checkout");
      return;
    }

    const confirmed = await confirmTransaction({
      title: "Helen membership",
      amount: method === "credits" ? "100 credits" : "€1.00",
      method: method === "credits" ? "credits" : "stripe",
      recurring: false,
      description:
        method === "credits"
          ? "Omni is about to deduct 100 credits from your OmniMind balance."
          : "Omni will now take you to Stripe for the one-time Helen membership payment.",
    });
    if (!confirmed) return;

    setProcessing(true);
    try {
      if (method === "card") {
        sessionStorage.setItem("helen_pending_username", trimmedUsername);
      }
      const endpoint =
        method === "credits" ? "/helen/api/join" : "/helen/api/checkout";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          username: trimmedUsername,
          refCode: getReferralCode(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        need?: number;
        have?: number;
      };
      if (!res.ok || !data.url) {
        if (data.error === "blocked") {
          setError(
            lang === "el"
              ? `Χρειάζονται ${data.need} credits — διαθέσιμα ${data.have}.`
              : `You need ${data.need} credits — ${data.have} available.`,
          );
        } else if (res.status === 501) {
          setError(
            lang === "el"
              ? "Η πληρωμή με κάρτα ενεργοποιείται σύντομα. Δοκίμασε credits."
              : "Card payments are being activated. Try credits for now.",
          );
        } else {
          setError(
            data.error ||
              (lang === "el" ? "Κάτι πήγε στραβά." : "Something went wrong."),
          );
        }
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError(
        lang === "el"
          ? "Δεν ήταν δυνατή η σύνδεση."
          : "Could not reach the payment service.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col pb-2 pt-2">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-helen-dim transition hover:bg-white/10"
      >
        <span aria-hidden>←</span> {lang === "el" ? "Πίσω" : "Back"}
      </button>

      <div className="mb-5">
        <div className="helen-eyebrow mb-3">Secure entry · one time</div>
        <h1 className="font-helen-display text-[clamp(32px,7vw,48px)] font-semibold leading-none tracking-[-0.04em]">
          {t.checkoutTitle}
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-helen-dim">
          {lang === "el"
            ? "Διάλεξε όνομα και τρόπο συμμετοχής. Δεν χρειάζεται λογαριασμός για πληρωμή με κάρτα."
            : "Choose your name and payment method. No account is needed for card payment."}
        </p>
      </div>

      <label className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-helen-dim">
        {t.usernameLabel}
      </label>
      <input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder={t.usernamePlaceholder}
        maxLength={20}
        autoCapitalize="none"
        autoComplete="nickname"
        className="helen-input mb-5 w-full rounded-[1.2rem] px-4 py-4 text-[15px] text-helen-paper outline-none placeholder:text-helen-dim/60"
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={`helen-payment-card ${method === "card" ? "is-active" : ""}`}
          aria-pressed={method === "card"}
        >
          <span className="helen-payment-icon">◈</span>
          <span>
            <b>{lang === "el" ? "Κάρτα" : "Card"}</b>
            <small>Visa · Mastercard · Wallet</small>
          </span>
          <i>{method === "card" ? "✓" : ""}</i>
        </button>
        <button
          type="button"
          onClick={() => setMethod("credits")}
          className={`helen-payment-card ${method === "credits" ? "is-active" : ""}`}
          aria-pressed={method === "credits"}
        >
          <span className="helen-payment-icon">✦</span>
          <span>
            <b>OmniMind credits</b>
            <small>
              100 credits · {isPrivileged ? "admin pass" : "instant"}
            </small>
          </span>
          <i>{method === "credits" ? "✓" : ""}</i>
        </button>
      </div>

      <section className="helen-order-panel mb-5 rounded-[1.4rem] p-4">
        <div>
          <span>{lang === "el" ? "Συμμετοχή Helen" : "Helen entry"}</span>
          <strong>€1.00</strong>
        </div>
        <div>
          <span>
            {lang === "el" ? "Επαναλαμβανόμενη χρέωση" : "Recurring charge"}
          </span>
          <strong>{lang === "el" ? "Καμία" : "None"}</strong>
        </div>
        <div className="total">
          <span>{t.priceLabel}</span>
          <strong>{method === "credits" ? "100 ✦" : "€1.00"}</strong>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-center text-xs text-rose-100"
        >
          {error}
        </div>
      )}

      <div className="mt-auto">
        <button
          type="button"
          disabled={processing || !trimmedUsername || status === "loading"}
          onClick={continueToPayment}
          className="helen-primary-cta flex w-full items-center justify-center rounded-[1.3rem] py-[18px] text-[15px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {processing ? (
            <span className="mr-2 h-5 w-5 animate-helen-spin-fast rounded-full border-2 border-white/30 border-t-white" />
          ) : null}
          {processing
            ? t.processingLabel
            : method === "credits"
              ? lang === "el"
                ? "Πληρωμή με 100 credits"
                : "Pay with 100 credits"
              : lang === "el"
                ? "Συνέχεια στην ασφαλή πληρωμή"
                : "Continue to secure payment"}
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-helen-dim">
          🔒{" "}
          {lang === "el"
            ? "Ασφαλής πληρωμή · Χωρίς συνδρομή"
            : "Secure payment · No subscription"}
        </p>
      </div>
    </main>
  );
}
