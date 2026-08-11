"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { IMAGE_GENERATION_CREDITS } from "@/lib/billing";

function describeGenError(status: number, data: { error?: string; need?: number; have?: number }): string {
  if (status === 401) return "Sign in to create an avatar.";
  if (status === 402) return `Not enough credits — needs ${data.need}, you have ${data.have}. Buy more on Pricing.`;
  return data.error || "Generation failed";
}

export default function AriaGoPage() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  async function createAvatar() {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/aria-go/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(describeGenError(res.status, data));
        return;
      }
      setAvatarUrl(data.url);
    } catch {
      setError("Could not reach Aria Go — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopNav />
      <div className="min-h-screen px-6 py-12">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-head text-4xl font-semibold text-gradient mb-3">Aria Go</h1>
            <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
              Make an avatar that feels like you. Describe your look, energy, wardrobe, and world —
              Aria Go turns your idea into a distinctive profile image.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 mb-6">
            <div className="aspect-square rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-5 overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Your avatar" className="w-full h-full object-cover" />
              ) : (
                <p className="text-sm text-mutedDark">Your avatar will appear here</p>
              )}
            </div>

            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Your avatar direction
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Confident founder in a black linen shirt, cinematic soft light, midnight-blue studio backdrop"
              maxLength={500}
              rows={3}
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-mutedDark focus:outline-none focus:border-accent/50 resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-mutedDark">{description.length}/500</span>
              <button
                onClick={createAvatar}
                disabled={!description.trim() || loading}
                className="bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 disabled:opacity-40 disabled:cursor-not-allowed shadow-glow rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all"
              >
                {loading ? "Creating…" : `Create avatar — ${IMAGE_GENERATION_CREDITS} credits ✨`}
              </button>
            </div>
            <p className="text-[11px] text-mutedDark mt-3">
              Your description is sent securely to Aria Go&apos;s image service.
            </p>
          </div>

          {error && (
            <div className="glass rounded-2xl p-5 border border-red-500/30">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <p className="text-center text-xs text-mutedDark mt-8">
            Part of OmniMind —{" "}
            <Link href="/voxstudio" className="text-cyan hover:underline">
              VoxStudio
            </Link>{" "}
            and{" "}
            <Link href="/helen" className="text-cyan hover:underline">
              Helen
            </Link>{" "}
            are here too.
          </p>
        </div>
      </div>
    </>
  );
}
