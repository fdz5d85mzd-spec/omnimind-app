"use client";

import { useState } from "react";
import { CATEGORY_LABEL, type SocialPost } from "@/lib/social/categories";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="text-[11px] font-semibold text-cyan hover:underline shrink-0"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const fullCaption = `${post.caption}\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`;
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <span className="inline-block text-[10px] font-bold tracking-wide uppercase text-cyan bg-cyan/[0.08] border border-cyan/25 rounded-full px-2.5 py-1">
        {CATEGORY_LABEL[post.category]}
      </span>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] tracking-wide text-mutedDark uppercase">Hook</p>
        </div>
        <p className="text-sm text-white font-semibold">{post.hook}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] tracking-wide text-mutedDark uppercase">Script — what Omni says on camera</p>
          <CopyButton text={post.script} />
        </div>
        <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{post.script}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] tracking-wide text-mutedDark uppercase">Caption + hashtags</p>
          <CopyButton text={fullCaption} />
        </div>
        <p className="text-xs text-muted whitespace-pre-wrap">{fullCaption}</p>
      </div>
    </div>
  );
}

export default function SocialClient() {
  const [posts, setPosts] = useState<SocialPost[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/social/generate", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Generation failed");
      setPosts(body.posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white mb-1">Today&apos;s 3 posts</h2>
          <p className="text-xs text-mutedDark">
            Drafts 3 scripts (rotating category) for Omni to perform. Download the mascot clip below and
            post manually — see why on this page.
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="shrink-0 text-sm font-bold px-5 py-2.5 rounded-xl bg-gradient-to-br from-accent/90 to-accent/70 text-white hover:from-accent hover:to-accent/80 transition-all disabled:opacity-50"
        >
          {loading ? "Writing…" : "Generate today's 3 posts"}
        </button>
      </div>

      {error && (
        <div className="glass border-crimson/30 bg-crimson/[0.06] rounded-xl px-4 py-3 text-sm text-crimson">
          {error}
        </div>
      )}

      {posts && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {posts.map((post, i) => (
            <PostCard key={i} post={post} />
          ))}
        </div>
      )}

      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-2">Omni&apos;s brand clip</h2>
        <p className="text-xs text-mutedDark mb-4">
          The waving mascot clip from the homepage — use it as the intro/outro or B-roll while recording
          Omni&apos;s voice over each script above.
        </p>
        <video src="/mascot-hero.mp4" controls loop muted className="w-40 rounded-xl border border-white/[0.08]" />
        <a
          href="/mascot-hero.mp4"
          download
          className="mt-3 inline-block text-xs font-semibold text-cyan hover:underline"
        >
          Download clip
        </a>
      </div>
    </div>
  );
}
