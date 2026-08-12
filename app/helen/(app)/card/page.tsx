"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { padId, SIGNUP_BONUS_XP } from "@/lib/helen/domain";
import { useAuth } from "@/lib/helen/auth/AuthProvider";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";
import { RewardPopup } from "@/components/helen/RewardPopup";
import { hasShownWelcomeBonus, markWelcomeBonusShown } from "@/lib/helen/data/welcomeBonusRepo";

function CardContent() {
  const { t } = useLanguage();
  const { profile, ready, hydrateFromRemote } = useProfile();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");

  const [hydrating, setHydrating] = useState(false);
  const [notFoundYet, setNotFoundYet] = useState(false);
  // Shown once, right after a freshly created profile lands here — every
  // signup path (mock join() and the real Stripe redirect) routes through
  // /card, so this is the one place that's guaranteed to see it exactly once.
  const [showBonus, setShowBonus] = useState(false);
  const [bonusShown, setBonusShown] = useState(false);
  // Tracks which session_id we've already attempted hydration for, so a
  // successful hydrateFromRemote (which changes `profile`, a dependency
  // below) can't retrigger this effect and loop forever.
  const [hydratedForSession, setHydratedForSession] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    // Returning from a real Stripe Checkout redirect: always verify against
    // Supabase at least once, even if a local profile already exists — a
    // stale/mock local profile must never mask a payment that completed but
    // never got linked to this account (the member row is created by the
    // webhook, which can also just trail this redirect by a moment).
    if (sessionId && user) {
      if (hydratedForSession === sessionId) return;
      setHydratedForSession(sessionId);
      setHydrating(true);
      hydrateFromRemote(user.id)
        .then((remote) => {
          setHydrating(false);
          setNotFoundYet(!remote);
        })
        .catch(() => {
          setHydrating(false);
          setNotFoundYet(true);
        });
      return;
    }

    if (!profile) router.replace("/helen");
  }, [ready, profile, sessionId, user, hydrateFromRemote, router, hydratedForSession]);

  useEffect(() => {
    if (!profile || bonusShown) return;
    if (hasShownWelcomeBonus(profile.memberId)) return;
    markWelcomeBonusShown(profile.memberId);
    setBonusShown(true);
    setShowBonus(true);
  }, [profile, bonusShown]);

  if (hydrating) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="h-6 w-6 animate-helen-spin-fast rounded-full border-2 border-helen-dim/30 border-t-gold" />
      </div>
    );
  }

  if (notFoundYet) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="mb-4 text-[13px] text-helen-dim">{t.finalizingNote}</p>
        <button
          type="button"
          onClick={() => {
            setNotFoundYet(false);
            setHydrating(true);
            hydrateFromRemote(user!.id)
              .then((remote) => {
                setHydrating(false);
                setNotFoundYet(!remote);
              })
              .catch(() => {
                setHydrating(false);
                setNotFoundYet(true);
              });
          }}
          className="text-sm font-semibold text-helen-gold"
        >
          {t.retryBtn}
        </button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          className="animate-helen-card-in w-full max-w-[280px] rounded-2xl border border-helen-gold/35 bg-gradient-to-br from-[#3A2C4A] to-helen-ink p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
          style={{ aspectRatio: "1.6 / 1" }}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="self-start rounded-full bg-helen-gold/15 px-2.5 py-1 font-helen-num text-[10px] tracking-wider text-helen-gold">
              {profile.tier}
            </div>
            <div>
              <div className="font-helen-num text-[28px] font-bold text-helen-paper">{padId(profile.memberId)}</div>
              <div className="text-[11px] text-helen-dim">{t.memberCaption}</div>
            </div>
          </div>
        </div>
        <p className="mt-5 text-center text-[13px] text-helen-dim">{t.cardCaption}</p>
      </div>
      <button
        type="button"
        onClick={() => router.push("/helen/egg")}
        className="w-full rounded-xl bg-helen-coral py-[15px] text-[14.5px] font-bold text-helen-ink"
      >
        {t.toEggBtn}
      </button>
      <RewardPopup
        open={showBonus}
        xp={SIGNUP_BONUS_XP}
        title={t.welcomeBonusNote}
        onClose={() => setShowBonus(false)}
      />
    </>
  );
}

export default function CardPage() {
  return (
    <Suspense fallback={null}>
      <CardContent />
    </Suspense>
  );
}
