"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

interface CreativeBrief {
  title: string;
  logline: string;
  characters: { name: string; description: string }[];
  scenes: { heading: string; description: string; shots: { camera: string; action: string }[] }[];
}

interface BriefResponse {
  brief?: CreativeBrief;
  projectId?: string | null;
  persisted?: boolean;
  signedIn?: boolean;
  error?: string;
}

const ADAPTERS: { label: string; ready: boolean; note: string }[] = [
  { label: "Planning (Director Agent)", ready: true, note: "Live — Anthropic" },
  { label: "Voice", ready: false, note: "ElevenLabs connected elsewhere in OmniMind, not wired here yet" },
  { label: "Image", ready: false, note: "Needs a provider key (not configured)" },
  { label: "Video", ready: false, note: "Needs a provider key (not configured)" },
];

export default function VoxStudioPage() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BriefResponse | null>(null);

  async function generate() {
    if (!idea.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/voxstudio/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim() }),
      });
      const data = (await res.json()) as BriefResponse;
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setResult(data);
    } catch {
      setError("Could not reach VoxStudio — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-10 w-fit">
          <LogoMark size={22} />
          <span className="font-head font-semibold text-white">OmniMind</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-head text-4xl font-semibold text-gradient mb-3">VoxStudio</h1>
          <p className="text-muted text-sm max-w-lg mx-auto leading-relaxed">
            AI film pre-production, built natively into OmniMind. Describe an idea, the Director Agent
            breaks it into a title, characters, scenes, and shots.
          </p>
        </div>

        <div className="glass rounded-2xl p-5 mb-8">
          <p className="text-xs font-semibold tracking-wide text-mutedDark uppercase mb-3">
            What actually works right now
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ADAPTERS.map((a) => (
              <div key={a.label} className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${a.ready ? "bg-emerald-400" : "bg-white/20"}`}
                />
                <div>
                  <p className="text-sm text-white leading-tight">{a.label}</p>
                  <p className="text-xs text-mutedDark leading-snug">{a.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-6 mb-8">
          <label htmlFor="idea" className="block text-sm font-medium text-white mb-2">
            Your idea
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. a lighthouse keeper discovers the sea is slowly turning to glass"
            maxLength={500}
            rows={3}
            className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-mutedDark focus:outline-none focus:border-accent/50 resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-mutedDark">{idea.length}/500</span>
            <button
              onClick={generate}
              disabled={!idea.trim() || loading}
              className="bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 disabled:opacity-40 disabled:cursor-not-allowed shadow-glow rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all"
            >
              {loading ? "Directing…" : "Generate creative brief"}
            </button>
          </div>
        </div>

        {error && (
          <div className="glass rounded-2xl p-5 mb-8 border border-red-500/30">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {result?.brief && (
          <div className="space-y-6">
            <div className="glass rounded-3xl p-8">
              <h2 className="font-head text-2xl font-semibold text-white mb-2">{result.brief.title}</h2>
              <p className="text-sm text-muted italic leading-relaxed">{result.brief.logline}</p>
              {!result.signedIn && (
                <p className="text-xs text-mutedDark mt-4">
                  Not saved — <Link href="/login" className="text-cyan hover:underline">sign in</Link> to
                  keep your VoxStudio projects.
                </p>
              )}
              {result.signedIn && !result.persisted && (
                <p className="text-xs text-mutedDark mt-4">
                  Generated, but couldn&apos;t be saved this time — you can still copy it from here.
                </p>
              )}
            </div>

            <div className="glass rounded-3xl p-8">
              <p className="text-xs font-semibold tracking-wide text-mutedDark uppercase mb-4">Characters</p>
              <div className="space-y-4">
                {result.brief.characters.map((c) => (
                  <div key={c.name}>
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-sm text-muted leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-8">
              <p className="text-xs font-semibold tracking-wide text-mutedDark uppercase mb-4">Scenes</p>
              <div className="space-y-6">
                {result.brief.scenes.map((s, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-white">{s.heading}</p>
                    <p className="text-sm text-muted leading-relaxed mb-2">{s.description}</p>
                    <ul className="space-y-1.5 pl-4 border-l border-white/[0.08]">
                      {s.shots.map((shot, j) => (
                        <li key={j} className="text-xs text-mutedDark">
                          <span className="text-cyan">{shot.camera}</span> — {shot.action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
