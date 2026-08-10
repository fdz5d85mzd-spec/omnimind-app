"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";

export default function ApplyCharityPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [verificationDocsUrl, setVerificationDocsUrl] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  const canSubmit = name.trim() && category.trim() && region.trim() && contactEmail.trim() && verificationDocsUrl.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    try {
      const res = await fetch("/helen/api/apply-charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim(),
          region: region.trim(),
          contactEmail: contactEmail.trim(),
          verificationDocsUrl: verificationDocsUrl.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="mb-2 font-helen-display text-xl font-semibold">{t.applyCharitySuccessTitle}</h1>
        <p className="mb-6 text-[13px] text-helen-dim">{t.applyCharitySuccessSub}</p>
        <button type="button" onClick={() => router.push("/helen")} className="text-sm font-semibold text-helen-gold">
          ← {t.backLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 self-start text-sm font-semibold text-helen-gold"
      >
        ← {t.backLabel}
      </button>

      <h1 className="mb-2 font-helen-display text-xl font-semibold">{t.applyCharityTitle}</h1>
      <p className="mb-5 text-[13px] leading-relaxed text-helen-dim">{t.applyCharitySub}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-helen-paper">{t.orgNameLabel}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
            className="w-full rounded-lg border border-white/10 bg-helen-card px-3 py-2.5 text-[13px] text-helen-paper"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-[12px] font-semibold text-helen-paper">{t.orgCategoryLabel}</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              maxLength={100}
              className="w-full rounded-lg border border-white/10 bg-helen-card px-3 py-2.5 text-[13px] text-helen-paper"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[12px] font-semibold text-helen-paper">{t.orgRegionLabel}</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
              maxLength={100}
              className="w-full rounded-lg border border-white/10 bg-helen-card px-3 py-2.5 text-[13px] text-helen-paper"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-helen-paper">{t.orgContactEmailLabel}</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
            maxLength={200}
            className="w-full rounded-lg border border-white/10 bg-helen-card px-3 py-2.5 text-[13px] text-helen-paper"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-helen-paper">{t.orgVerificationLabel}</label>
          <input
            type="url"
            value={verificationDocsUrl}
            onChange={(e) => setVerificationDocsUrl(e.target.value)}
            required
            maxLength={500}
            placeholder="https://…"
            className="w-full rounded-lg border border-white/10 bg-helen-card px-3 py-2.5 text-[13px] text-helen-paper"
          />
          <p className="mt-1 text-[11px] text-helen-dim">{t.orgVerificationHint}</p>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-helen-paper">{t.orgDescriptionLabel}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-helen-card px-3 py-2.5 text-[13px] text-helen-paper"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || status === "submitting"}
          className="mt-2 w-full rounded-xl bg-helen-coral py-[15px] text-[14.5px] font-bold text-helen-ink disabled:opacity-60"
        >
          {status === "submitting" ? "…" : t.applyCharitySubmitBtn}
        </button>
        {status === "error" && <p className="text-center text-xs text-helen-coral">{t.applyCharityErrorNote}</p>}
      </form>
    </div>
  );
}
