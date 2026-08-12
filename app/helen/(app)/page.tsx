"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Globe } from "@/components/helen/Globe";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";

export default function JoinPage() {
  const { t } = useLanguage();
  const { profile, ready } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (ready && profile) router.replace("/helen/home");
  }, [ready, profile, router]);

  function handleJoin() {
    router.push("/helen/checkout");
  }

  return (
    <>
      <Globe />
      <div className="helen-eyebrow mx-auto mb-3">Humanity, reimagined</div>
      <h1 className="helen-hero-title mb-3 text-center font-helen-display text-[clamp(34px,8vw,56px)] font-semibold leading-[1.02] tracking-[-0.045em]">
        {t.heroLine1}
        <br />
        {t.heroLine2}
      </h1>
      <p className="mx-auto mb-6 max-w-md text-center text-[clamp(13px,3.5vw,16px)] leading-relaxed text-helen-dim">
        {t.heroSub}
      </p>

      <div className="helen-glass-card mb-2 rounded-[1.6rem] px-5 py-5">
        <div className="mb-1.5 font-helen-display text-[15px] font-semibold text-helen-gold">
          {t.purposeTitle}
        </div>
        <p className="text-[13px] leading-[1.65] text-helen-dim">
          {t.purposeBody}
        </p>
      </div>

      <div className="flex-1" />
      <div className="mb-4 mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="helen-mini-stat">
          <b>€1</b>
          <span>one time</span>
        </div>
        <div className="helen-mini-stat">
          <b>15%</b>
          <span>to impact</span>
        </div>
        <div className="helen-mini-stat">
          <b>∞</b>
          <span>your journey</span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleJoin}
        className="helen-primary-cta w-full rounded-[1.3rem] py-[18px] text-[15px] font-extrabold text-white transition active:scale-[0.985]"
      >
        {t.joinBtn}
      </button>
      <p className="mt-2.5 text-center text-[11px] text-helen-dim">
        {t.charityNote}
      </p>
    </>
  );
}
