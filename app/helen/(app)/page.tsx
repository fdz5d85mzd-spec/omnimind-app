"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Globe } from "@/components/helen/Globe";
import { useAuth } from "@/lib/helen/auth/AuthProvider";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";

export default function JoinPage() {
  const { t } = useLanguage();
  const { profile, ready } = useProfile();
  const { user, configured } = useAuth();
  const { data: omniSession } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && profile) router.replace("/helen/home");
  }, [ready, profile, router]);

  function handleJoin() {
    // Already signed into OmniMind -- /helen/checkout offers a direct
    // card/credits join for that session instead of a separate signup.
    if (configured && !user && !omniSession?.user) {
      router.push("/login?callbackUrl=/helen/checkout");
    } else {
      router.push("/helen/checkout");
    }
  }

  return (
    <>
      <Globe />
      <h1 className="helen-hero-title mb-3 text-center font-helen-display text-[clamp(29px,7.5vw,38px)] font-semibold leading-[1.12] tracking-[-0.025em]">
        {t.heroLine1}
        <br />
        {t.heroLine2}
      </h1>
      <p className="mx-auto mb-7 max-w-md text-center text-[14px] leading-relaxed text-helen-dim">
        {t.heroSub}
      </p>

      <div className="helen-glass-card mb-2 rounded-2xl px-5 py-4.5">
        <div className="mb-1.5 font-helen-display text-[15px] font-semibold text-helen-gold">
          {t.purposeTitle}
        </div>
        <p className="text-[13px] leading-[1.65] text-helen-dim">
          {t.purposeBody}
        </p>
      </div>

      <div className="flex-1" />
      <div className="mb-5 mt-4 flex justify-between border-t border-white/10 pt-3.5 font-helen-num text-xs text-helen-dim">
        <span>{t.priceLabel}</span>
        <b className="text-helen-sage">1,00 €</b>
      </div>
      <button
        type="button"
        onClick={handleJoin}
        className="helen-primary-cta w-full rounded-2xl bg-helen-coral py-[17px] text-[15px] font-extrabold text-helen-ink transition active:scale-[0.985]"
      >
        {t.joinBtn}
      </button>
      <p className="mt-2.5 text-center text-[11px] text-helen-dim">
        {t.charityNote}
      </p>
    </>
  );
}
