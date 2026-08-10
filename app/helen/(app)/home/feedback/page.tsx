"use client";

import { track } from "@vercel/analytics";
import { useEffect, useState } from "react";
import { addFeedback, getFeedback, upvoteFeedback } from "@/lib/helen/data/feedbackRepo";
import { getAverageRating, getMyRating, submitRating } from "@/lib/helen/data/ratingRepo";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";
import { playConfirmSound, playPokeSound } from "@/lib/helen/sound";
import type { FeedbackEntry } from "@/lib/helen/types";

export default function FeedbackPage() {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [text, setText] = useState("");
  const [myRating, setMyRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState({ average: 0, count: 0 });

  useEffect(() => {
    setEntries(getFeedback());
    setAvgRating(getAverageRating());
  }, []);

  useEffect(() => {
    if (profile) setMyRating(getMyRating(profile.memberId));
  }, [profile]);

  if (!profile) return null;

  function handleRate(stars: number) {
    if (!profile) return;
    submitRating(profile.memberId, stars);
    setMyRating(stars);
    setAvgRating(getAverageRating());
    playConfirmSound();
    track("app_rated", { stars });
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || !profile) return;
    addFeedback(profile.memberId, trimmed);
    setEntries(getFeedback());
    setText("");
    playConfirmSound();
  }

  function handleUpvote(id: string) {
    upvoteFeedback(id);
    setEntries(getFeedback());
    playPokeSound();
  }

  return (
    <>
      <div className="mb-5 rounded-xl bg-helen-card p-4 text-center">
        <div className="mb-1 text-sm font-semibold">{t.rateAppTitle}</div>
        <p className="mb-3 text-xs text-helen-dim">{t.rateAppSub}</p>
        <div className="mb-2 flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleRate(n)}
              aria-label={`${n} star`}
              className="text-[28px] leading-none transition-transform active:scale-90"
            >
              {n <= (myRating ?? 0) ? "⭐" : "☆"}
            </button>
          ))}
        </div>
        {myRating !== null && <p className="mb-1 text-[11px] text-helen-gold">{t.ratingThanksNote}</p>}
        {avgRating.count > 0 && (
          <p className="text-[11px] text-helen-dim">
            ⭐ {avgRating.average.toFixed(1)} · {avgRating.count} {t.ratingsCountLabel}
          </p>
        )}
      </div>

      <div className="mb-1 font-helen-display text-[17px] font-semibold">{t.feedbackTitle}</div>
      <p className="mb-4 text-xs text-helen-dim">{t.feedbackSub}</p>

      <div className="mb-4 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.feedbackPlaceholder}
          maxLength={280}
          rows={3}
          className="flex-1 resize-none rounded-xl bg-helen-card px-3.5 py-3 text-[13px] text-helen-paper outline-none placeholder:text-helen-dim"
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="mb-5 w-full rounded-xl bg-helen-coral py-3 text-[14px] font-bold text-helen-ink disabled:opacity-50"
      >
        {t.feedbackSubmitBtn}
      </button>

      {entries.length === 0 ? (
        <p className="text-center text-xs text-helen-dim">{t.feedbackEmptyNote}</p>
      ) : (
        <div className="space-y-2.5 pb-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 rounded-xl bg-helen-card px-4 py-3">
              <button
                type="button"
                onClick={() => handleUpvote(entry.id)}
                className="flex flex-col items-center rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-helen-gold"
              >
                <span className="text-[13px] leading-none">▲</span>
                <span className="font-helen-num text-[11px]">{entry.votes}</span>
              </button>
              <div className="flex-1 text-[13px] leading-snug text-helen-paper">{entry.text}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-center gap-4 pb-2 text-[11px] text-helen-dim">
        <a href="/helen/about" className="underline">
          {t.viewAboutLink}
        </a>
        <a href="/helen/terms" className="underline">
          {t.viewTermsLink}
        </a>
        <a href="/helen/privacy" className="underline">
          {t.viewPrivacyLink}
        </a>
      </div>
    </>
  );
}
