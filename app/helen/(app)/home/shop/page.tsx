"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/helen/auth/AuthProvider";
import { levelFor, SHOP_ITEMS } from "@/lib/helen/domain";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";
import { getReferralCode } from "@/lib/helen/referral";
import { playBuySound } from "@/lib/helen/sound";
import { useTransactionConfirm } from "@/components/TransactionConfirmProvider";

function ShopContent() {
  const { t } = useLanguage();
  const { profile, purchaseItem, syncOwnedItems } = useProfile();
  const { user, ready: authReady, configured: authConfigured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const confirmTransaction = useTransactionConfirm();

  useEffect(() => {
    const sessionId = searchParams?.get("session_id");
    const item = searchParams?.get("item");
    if (!sessionId || !item || !profile) return;
    setBuyingId(item);
    syncOwnedItems(item)
      .then((owned) => {
        setPendingItem(owned ? null : item);
        if (owned) playBuySound();
      })
      .catch((err) => {
        console.error("syncOwnedItems failed", err);
        setPendingItem(item);
      })
      .finally(() => setBuyingId(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, profile?.memberId]);

  if (!profile) return null;

  const myLevel = levelFor(profile.carePoints).level;

  /**
   * Starts a real Stripe Checkout Session. There is deliberately no mock
   * purchase fallback: a digital item is granted only after confirmed payment.
   *
   * Requires a live Supabase session when Supabase is configured — without
   * one, the webhook has no way to attribute the purchase to a member (this
   * is exactly what went wrong before: clientReferenceId went through as
   * undefined and every real purchase landed with no owner).
   */
  async function handleBuy(itemId: string) {
    if (authConfigured && !authReady) return; // ignore taps before the session check resolves
    if (authConfigured && !user) {
      router.push(
        `/helen/signin?next=${encodeURIComponent("/helen/home/shop")}`,
      );
      return;
    }
    const item = SHOP_ITEMS.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const confirmed = await confirmTransaction({
      title: `Helen shop · ${item.id.replaceAll("-", " ")}`,
      amount: `€${item.priceEur.toFixed(2)}`,
      method: "stripe",
      recurring: false,
      description:
        "Omni is about to open Stripe for this one-time digital item purchase.",
    });
    if (!confirmed) return;
    setBuyingId(itemId);
    try {
      const res = await fetch("/helen/api/shop-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          clientReferenceId: user?.id,
          refCode: getReferralCode(),
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { url?: string; bypass?: boolean };
        if (body.bypass) {
          // Admin/master account -- checked out server-side, no Stripe redirect.
          await purchaseItem(itemId);
          playBuySound();
          setBuyingId(null);
          return;
        }
        if (body.url) {
          window.location.href = body.url;
          return;
        }
      }
    } catch {
      setBuyingId(null);
      return;
    }
    setBuyingId(null);
  }

  return (
    <>
      <div className="mb-1 font-helen-display text-[17px] font-semibold">
        {t.tabShop}
      </div>
      <p className="mb-4 text-xs text-helen-dim">{t.shopSub}</p>

      <div className="grid grid-cols-2 gap-3">
        {SHOP_ITEMS.map((item) => {
          const owned = profile.ownedItems.includes(item.id);
          const buying = buyingId === item.id;
          const pending = pendingItem === item.id;
          const locked = !owned && (item.requiredLevel ?? 1) > myLevel;
          return (
            <div
              key={item.id}
              className={`rounded-xl bg-helen-card p-3 text-center ${locked ? "opacity-60" : ""}`}
            >
              <div className="mb-2 text-4xl">{locked ? "🔒" : item.icon}</div>
              {locked ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-lg bg-white/[0.06] py-2 text-[11px] font-semibold text-helen-dim"
                >
                  {t.lockedUntilLevelPrefix} {item.requiredLevel}
                </button>
              ) : pending ? (
                <button
                  type="button"
                  disabled={buying}
                  onClick={() => {
                    setBuyingId(item.id);
                    syncOwnedItems(item.id)
                      .then((ownedNow) => {
                        setPendingItem(ownedNow ? null : item.id);
                        if (ownedNow) playBuySound();
                      })
                      .catch((err) =>
                        console.error("syncOwnedItems retry failed", err),
                      )
                      .finally(() => setBuyingId(null));
                  }}
                  className="w-full rounded-lg bg-white/[0.06] py-2 text-[11px] font-semibold text-helen-dim disabled:opacity-60"
                >
                  {buying ? "…" : `${t.finalizingNote} · ${t.retryBtn}`}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={owned || buying || (authConfigured && !authReady)}
                  onClick={() => handleBuy(item.id)}
                  className={`w-full rounded-lg py-2 text-[12px] font-bold ${
                    owned
                      ? "bg-white/[0.06] text-helen-sage"
                      : "bg-helen-coral text-helen-ink disabled:opacity-70"
                  }`}
                >
                  {owned
                    ? `✓ ${t.ownedLabel}`
                    : buying
                      ? "…"
                      : `${t.buyBtn} — ${item.priceEur.toFixed(2)} €`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function ShopTab() {
  return (
    <Suspense fallback={null}>
      <ShopContent />
    </Suspense>
  );
}
