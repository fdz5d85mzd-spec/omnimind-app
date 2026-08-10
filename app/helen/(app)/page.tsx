"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Globe } from "@/components/helen/Globe";
import { useAuth } from "@/lib/helen/auth/AuthProvider";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";

export default function JoinPage() {
  const { t } = useLanguage();
  const { profile, ready } = useProfile();
  const { user, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && profile) router.replace("/helen/home");
  }, [ready, profile, router]);

  function handleJoin() {
    if (configured && !user) {
      router.push("/helen/signin?next=/helen/checkout");
    } else {
      router.push("/helen/checkout");
    }
  }

  return (
    <>
      <Globe />
      <h1 className="mb-2 text-center font-helen-display text-[26px] font-semibold leading-[1.25]">
        {t.heroLine1}
        <br />
        {t.heroLine2}
      </h1>
      <p className="mb-6 text-center text-[13px] leading-relaxed text-helen-dim">{t.heroSub}</p>

      <div className="mb-2 rounded-xl bg-helen-card px-4 py-3.5">
        <div className="mb-1 font-helen-display text-[13px] font-semibold text-helen-gold">{t.purposeTitle}</div>
        <p className="text-[12px] leading-relaxed text-helen-dim">{t.purposeBody}</p>
      </div>

      <div className="flex-1" />
      <div className="mb-5 mt-4 flex justify-between border-t border-white/10 pt-3.5 font-helen-num text-xs text-helen-dim">
        <span>{t.priceLabel}</span>
        <b className="text-helen-sage">1,00 €</b>
      </div>
      <button
        type="button"
        onClick={handleJoin}
        className="w-full rounded-xl bg-helen-coral py-[15px] text-[14.5px] font-bold text-helen-ink"
      >
        {t.joinBtn}
      </button>
      <p className="mt-2.5 text-center text-[11px] text-helen-dim">{t.charityNote}</p>
    </>
  );
}
