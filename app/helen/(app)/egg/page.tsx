"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreatureImage } from "@/components/helen/CreatureImage";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";
import { playEggCrackSound } from "@/lib/helen/sound";

const HATCH_GLOW = "rgba(232,181,77,0.4)";

export default function EggPage() {
  const { t } = useLanguage();
  const { profile, ready, hatch, setCreatureName } = useProfile();
  const router = useRouter();
  const [shaking, setShaking] = useState(false);
  const [cracked, setCracked] = useState(false);
  const [hatched, setHatched] = useState(profile?.hatched ?? false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (ready && !profile) router.replace("/helen");
  }, [ready, profile, router]);

  useEffect(() => {
    if (profile?.hatched) setHatched(true);
  }, [profile?.hatched]);

  if (!profile)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span className="h-7 w-7 animate-helen-spin-fast rounded-full border-2 border-helen-dim/30 border-t-helen-gold" />
        <p className="text-sm text-helen-dim">{t.finalizingNote}</p>
      </div>
    );

  function handleTap() {
    if (hatched || shaking || cracked) return;
    setShaking(true);
    setTimeout(() => {
      setShaking(false);
      setCracked(true);
      playEggCrackSound();
      setTimeout(() => {
        hatch();
        setHatched(true);
        setCracked(false);
      }, 380);
    }, 500);
  }

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        {hatched ? (
          <div
            className="animate-helen-pop-in rounded-full p-2"
            style={{ boxShadow: `0 0 60px 20px ${HATCH_GLOW}` }}
          >
            <CreatureImage stage={1} height={180} priority />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleTap}
            aria-label={t.eggHint}
            className={`cursor-pointer drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)] ${shaking ? "animate-helen-egg-shake" : ""} ${cracked ? "animate-helen-pop-in" : ""}`}
          >
            <Image
              src={
                cracked
                  ? "/helen/egg/egg-cracked.png"
                  : "/helen/creatures/v2/egg-whole.png"
              }
              alt=""
              width={140}
              height={190}
              priority
              style={{ height: 150, width: "auto" }}
              className="object-contain"
            />
          </button>
        )}
        {!hatched && !cracked && (
          <p className="text-xs text-helen-dim">{t.eggHint}</p>
        )}
        {hatched && (
          <div className="w-full">
            <div className="mb-1.5 text-center text-xs text-helen-dim">
              {t.nameYourCreature}
            </div>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t.namePlaceholder}
              maxLength={24}
              className="w-full rounded-xl bg-white/[0.06] px-4 py-3 text-center text-sm text-helen-paper outline-none placeholder:text-helen-dim"
            />
          </div>
        )}
      </div>
      {hatched && (
        <button
          type="button"
          onClick={() => {
            if (nameInput.trim()) setCreatureName(nameInput);
            router.push("/helen/home");
          }}
          className="w-full rounded-xl bg-helen-coral py-[15px] text-[14.5px] font-bold text-helen-ink"
        >
          {t.toHomeBtn}
        </button>
      )}
    </>
  );
}
