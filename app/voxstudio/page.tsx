"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import {
  IMAGE_GENERATION_CREDITS,
  VIDEO_GENERATION_CREDITS,
} from "@/lib/billing";
import { useTransactionConfirm } from "@/components/TransactionConfirmProvider";

interface Shot {
  camera: string;
  action: string;
}

interface Scene {
  heading: string;
  description: string;
  shots: Shot[];
}

interface CreativeBrief {
  title: string;
  logline: string;
  characters: { name: string; description: string }[];
  scenes: Scene[];
}

interface BriefResponse {
  brief?: CreativeBrief;
  projectId?: string | null;
  persisted?: boolean;
  signedIn?: boolean;
  error?: string;
}

interface SceneMedia {
  imageUrl?: string;
  videoUrl?: string;
  imageLoading?: boolean;
  videoLoading?: boolean;
  error?: string;
}

interface ProjectSummary {
  id: string;
  title: string;
  logline: string;
  createdAt: string;
}

function scenePrompt(scene: Scene): string {
  const shotBits = scene.shots
    .map((s) => `${s.camera}: ${s.action}`)
    .join("; ");
  return `${scene.heading}. ${scene.description}${shotBits ? ` Shots: ${shotBits}.` : ""} Cinematic film still, dramatic lighting.`;
}

function describeGenError(
  status: number,
  data: { error?: string; need?: number; have?: number },
): string {
  if (status === 401) return "Sign in to generate images and videos.";
  if (status === 402)
    return `Not enough credits — needs ${data.need}, you have ${data.have}. Buy more on Pricing.`;
  return data.error || "Generation failed";
}

export default function VoxStudioPage() {
  const confirmTransaction = useTransactionConfirm();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BriefResponse | null>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [sceneMedia, setSceneMedia] = useState<Record<number, SceneMedia>>({});
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/voxstudio/api/status")
      .then((r) => r.json())
      .then((d) => setMediaReady(Boolean(d.imageReady)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/voxstudio/api/projects")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setProjects(d?.projects ?? []))
      .catch(() => setProjects([]));
  }, []);

  async function openProject(id: string) {
    setLoadingProjectId(id);
    setError(null);
    try {
      const res = await fetch(`/voxstudio/api/projects/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load that project");
        return;
      }
      setResult(data);
      const media: Record<number, SceneMedia> = {};
      for (const [idx, m] of Object.entries(data.media ?? {})) {
        media[Number(idx)] = m as SceneMedia;
      }
      setSceneMedia(media);
    } catch {
      setError(
        "Could not reach VoxStudio — check your connection and try again.",
      );
    } finally {
      setLoadingProjectId(null);
    }
  }

  const adapters = [
    {
      label: "Planning (Director Agent)",
      ready: true,
      note: "Live — Anthropic",
    },
    {
      label: "Image & Video",
      ready: mediaReady,
      note: mediaReady
        ? "Live — Higgsfield"
        : "Needs HF_CREDENTIALS set (not configured)",
    },
    {
      label: "Voice",
      ready: false,
      note: "ElevenLabs connected elsewhere in OmniMind, not wired here yet",
    },
  ];

  async function generate() {
    if (!idea.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSceneMedia({});
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
      if (data.projectId && data.brief) {
        const created = data.projectId;
        setProjects((prev) => [
          {
            id: created,
            title: data.brief!.title,
            logline: data.brief!.logline,
            createdAt: new Date().toISOString(),
          },
          ...(prev ?? []),
        ]);
      }
    } catch {
      setError(
        "Could not reach VoxStudio — check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateImage(i: number, scene: Scene) {
    const confirmed = await confirmTransaction({
      title: `VoxStudio image · ${scene.heading}`,
      amount: `${IMAGE_GENERATION_CREDITS} credits`,
      method: "credits",
      recurring: false,
      description:
        "Generating this scene image will deduct credits from your OmniMind balance.",
    });
    if (!confirmed) return;
    setSceneMedia((prev) => ({
      ...prev,
      [i]: { ...prev[i], imageLoading: true, error: undefined },
    }));
    try {
      const res = await fetch("/voxstudio/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: scenePrompt(scene),
          projectId: result?.projectId ?? undefined,
          sceneIndex: i,
        }),
      });
      const data = await res.json();
      setSceneMedia((prev) => ({
        ...prev,
        [i]: res.ok
          ? { ...prev[i], imageLoading: false, imageUrl: data.url }
          : {
              ...prev[i],
              imageLoading: false,
              error: describeGenError(res.status, data),
            },
      }));
    } catch {
      setSceneMedia((prev) => ({
        ...prev,
        [i]: {
          ...prev[i],
          imageLoading: false,
          error: "Could not reach VoxStudio",
        },
      }));
    }
  }

  async function generateVideo(i: number, scene: Scene) {
    const media = sceneMedia[i];
    if (!media?.imageUrl) return;
    const confirmed = await confirmTransaction({
      title: `VoxStudio video · ${scene.heading}`,
      amount: `${VIDEO_GENERATION_CREDITS} credits`,
      method: "credits",
      recurring: false,
      description:
        "Generating this scene video will deduct credits from your OmniMind balance.",
    });
    if (!confirmed) return;
    setSceneMedia((prev) => ({
      ...prev,
      [i]: { ...prev[i], videoLoading: true, error: undefined },
    }));
    try {
      const res = await fetch("/voxstudio/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: media.imageUrl,
          prompt: scenePrompt(scene),
          projectId: result?.projectId ?? undefined,
          sceneIndex: i,
        }),
      });
      const data = await res.json();
      setSceneMedia((prev) => ({
        ...prev,
        [i]: res.ok
          ? { ...prev[i], videoLoading: false, videoUrl: data.url }
          : {
              ...prev[i],
              videoLoading: false,
              error: describeGenError(res.status, data),
            },
      }));
    } catch {
      setSceneMedia((prev) => ({
        ...prev,
        [i]: {
          ...prev[i],
          videoLoading: false,
          error: "Could not reach VoxStudio",
        },
      }));
    }
  }

  return (
    <>
      <TopNav />
      <div className="min-h-screen px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-head text-4xl font-semibold text-gradient mb-3">
              VoxStudio
            </h1>
            <p className="text-muted text-sm max-w-lg mx-auto leading-relaxed">
              AI film pre-production, built natively into OmniMind. Describe an
              idea, the Director Agent breaks it into a title, characters,
              scenes, and shots.
            </p>
          </div>

          <div className="glass rounded-2xl p-5 mb-8">
            <p className="text-xs font-semibold tracking-wide text-mutedDark uppercase mb-3">
              What actually works right now
            </p>
            <div className="grid grid-cols-2 gap-3">
              {adapters.map((a) => (
                <div key={a.label} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${a.ready ? "bg-emerald-400" : "bg-white/20"}`}
                  />
                  <div>
                    <p className="text-sm text-white leading-tight">
                      {a.label}
                    </p>
                    <p className="text-xs text-mutedDark leading-snug">
                      {a.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!result && projects && projects.length > 0 && (
            <div className="glass rounded-2xl p-5 mb-8">
              <p className="text-xs font-semibold tracking-wide text-mutedDark uppercase mb-3">
                Your projects
              </p>
              <div className="space-y-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openProject(p.id)}
                    disabled={loadingProjectId !== null}
                    className="w-full text-left rounded-xl px-3.5 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] disabled:opacity-50 transition-colors"
                  >
                    <p className="text-sm text-white font-medium truncate">
                      {loadingProjectId === p.id ? "Opening…" : p.title}
                    </p>
                    <p className="text-xs text-mutedDark truncate">
                      {p.logline}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {result && (
            <button
              onClick={() => {
                setResult(null);
                setSceneMedia({});
                setError(null);
              }}
              className="text-xs font-semibold text-cyan hover:text-white mb-4 transition-colors"
            >
              ← New idea
            </button>
          )}

          <div className="glass rounded-3xl p-6 mb-8">
            <label
              htmlFor="idea"
              className="block text-sm font-medium text-white mb-2"
            >
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
                <h2 className="font-head text-2xl font-semibold text-white mb-2">
                  {result.brief.title}
                </h2>
                <p className="text-sm text-muted italic leading-relaxed">
                  {result.brief.logline}
                </p>
                {!result.signedIn && (
                  <p className="text-xs text-mutedDark mt-4">
                    Not saved —{" "}
                    <Link href="/login" className="text-cyan hover:underline">
                      sign in
                    </Link>{" "}
                    to keep your VoxStudio projects.
                  </p>
                )}
                {result.signedIn && !result.persisted && (
                  <p className="text-xs text-mutedDark mt-4">
                    Generated, but couldn&apos;t be saved this time — you can
                    still copy it from here.
                  </p>
                )}
              </div>

              <div className="glass rounded-3xl p-8">
                <p className="text-xs font-semibold tracking-wide text-mutedDark uppercase mb-4">
                  Characters
                </p>
                <div className="space-y-4">
                  {result.brief.characters.map((c) => (
                    <div key={c.name}>
                      <p className="text-sm font-semibold text-white">
                        {c.name}
                      </p>
                      <p className="text-sm text-muted leading-relaxed">
                        {c.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl p-8">
                <p className="text-xs font-semibold tracking-wide text-mutedDark uppercase mb-4">
                  Scenes
                </p>
                <div className="space-y-8">
                  {result.brief.scenes.map((s, i) => {
                    const media = sceneMedia[i] ?? {};
                    return (
                      <div key={i}>
                        <p className="text-sm font-semibold text-white">
                          {s.heading}
                        </p>
                        <p className="text-sm text-muted leading-relaxed mb-2">
                          {s.description}
                        </p>
                        <ul className="space-y-1.5 pl-4 border-l border-white/[0.08] mb-3">
                          {s.shots.map((shot, j) => (
                            <li key={j} className="text-xs text-mutedDark">
                              <span className="text-cyan">{shot.camera}</span> —{" "}
                              {shot.action}
                            </li>
                          ))}
                        </ul>

                        {mediaReady && (
                          <div className="pl-4">
                            {!media.imageUrl && (
                              <button
                                onClick={() => generateImage(i, s)}
                                disabled={media.imageLoading}
                                className="text-xs font-semibold text-cyan hover:text-white disabled:opacity-50 transition-colors"
                              >
                                {media.imageLoading
                                  ? "Generating image…"
                                  : `Generate image — ${IMAGE_GENERATION_CREDITS} credits ✨`}
                              </button>
                            )}

                            {media.imageUrl && (
                              <div className="space-y-2 max-w-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={media.imageUrl}
                                  alt={s.heading}
                                  className="w-full rounded-xl border border-white/[0.08]"
                                />
                                {!media.videoUrl && (
                                  <button
                                    onClick={() => generateVideo(i, s)}
                                    disabled={media.videoLoading}
                                    className="text-xs font-semibold text-cyan hover:text-white disabled:opacity-50 transition-colors"
                                  >
                                    {media.videoLoading
                                      ? "Animating…"
                                      : `Generate video — ${VIDEO_GENERATION_CREDITS} credits ✨`}
                                  </button>
                                )}
                                {media.videoUrl && (
                                  <video
                                    src={media.videoUrl}
                                    controls
                                    className="w-full rounded-xl border border-white/[0.08]"
                                  />
                                )}
                              </div>
                            )}

                            {media.error && (
                              <p className="text-xs text-red-300 mt-1.5">
                                {media.error}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
