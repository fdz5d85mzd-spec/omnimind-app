"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Film, Heart, Trophy, Upload, Clock3, Sparkles, Share2 } from "lucide-react";
import { notifyCreditsChanged } from "@/lib/useCredits";

type Entry = { id: string; userId: string; mediaType: string; mediaUrl: string; caption: string; createdAt: string; user: { name: string | null }; _count: { votes: number } };
type Challenge = { id: string; title: string; prompt: string; mediaType: "photo" | "reel"; status: string; startsAt: string; endsAt: string; entryCost: number; prizeFirst: number; prizeSecond: number; prizeThird: number; entries: Entry[]; votingEntries: Entry[]; awards: Array<{ rank: number; credits: number; user: { name: string | null } }> };
type ContestData = { authenticated: boolean; viewerId: string | null; votedEntryIds: string[]; challenges: Challenge[] };

function remaining(end: string) {
  const ms = Math.max(0, new Date(end).getTime() - Date.now());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return days ? `${days}d ${hours}h` : `${hours}h ${mins}m`;
}

async function validateReel(file: File) {
  if (!file.type.startsWith("video/")) return;
  const url = URL.createObjectURL(file);
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = reject;
      video.src = url;
    });
    if (duration > 60.5) throw new Error("Reels must be 60 seconds or shorter.");
  } finally { URL.revokeObjectURL(url); }
}

async function uploadEntry(challenge: Challenge, file: File, caption: string, onProgress: (n: number) => void) {
  await validateReel(file);
  const initRes = await fetch("/api/contests/upload/init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: challenge.id, name: file.name, size: file.size, contentType: file.type }) });
  const init = await initRes.json();
  if (!initRes.ok) throw new Error(init.error || "Could not start upload");
  const count = Math.ceil(file.size / init.partSize);
  const numbers = Array.from({ length: count }, (_, index) => index + 1);
  const signedRes = await fetch("/api/contests/upload/parts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: init.key, uploadId: init.uploadId, parts: numbers }) });
  const signed = await signedRes.json();
  if (!signedRes.ok) throw new Error(signed.error || "Could not authorize upload");
  const completed: Array<{ partNumber: number; etag: string }> = [];
  for (const part of signed.parts) {
    const start = (part.partNumber - 1) * init.partSize;
    const response = await fetch(part.url, { method: "PUT", body: file.slice(start, Math.min(file.size, start + init.partSize)), headers: { "Content-Type": file.type } });
    if (!response.ok) throw new Error("Upload interrupted — tap submit to retry.");
    const result = await response.json();
    completed.push({ partNumber: part.partNumber, etag: result.etag || response.headers.get("etag") });
    onProgress(Math.round((completed.length / count) * 100));
  }
  const completeRes = await fetch("/api/contests/upload/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: challenge.id, key: init.key, uploadId: init.uploadId, parts: completed, caption }) });
  const complete = await completeRes.json();
  if (!completeRes.ok) throw new Error(complete.error || "Could not publish entry");
}

export default function ContestsClient() {
  const [data, setData] = useState<ContestData | null>(null);
  const [type, setType] = useState<"photo" | "reel">("photo");
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [rightsAccepted, setRightsAccepted] = useState(false);
  const [, tick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => { const response = await fetch("/api/contests", { cache: "no-store" }); if (response.ok) setData(await response.json()); }, []);
  useEffect(() => { void load(); const timer = setInterval(() => tick((value) => value + 1), 60000); return () => clearInterval(timer); }, [load]);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("type") === "reel") setType("reel");
    const entryId = params.get("entry");
    if (entryId && data) requestAnimationFrame(() => document.getElementById(`entry-${entryId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [data]);
  const challenge = useMemo(() => data?.challenges.find((item) => item.mediaType === type && item.status === "active") ?? null, [data, type]);
  const voted = useMemo(() => new Set(data?.votedEntryIds ?? []), [data]);

  async function vote(entry: Entry) {
    if (!data?.authenticated) { location.href = "/login?next=/contests"; return; }
    const response = await fetch("/api/contests/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entryId: entry.id }) });
    const result = await response.json();
    setMessage(response.ok ? "Vote counted — your eye shapes the leaderboard." : result.error);
    if (response.ok) void load();
  }

  async function report(entry: Entry) {
    if (!data?.authenticated) { location.href = "/login?next=/contests"; return; }
    if (!window.confirm("Report this entry for inappropriate or non-original content?")) return;
    const response = await fetch("/api/contests/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entryId: entry.id, reason: "Community safety report" }) });
    const result = await response.json();
    setMessage(response.ok ? "Thank you. The entry was sent for review." : result.error);
  }

  async function share(entry?: Entry) {
    const url = new URL("/contests", location.origin);
    url.searchParams.set("type", type);
    if (entry) url.searchParams.set("entry", entry.id);
    const payload = { title: challenge?.title || "OmniMind Creator Arena", text: entry ? `Vote for ${entry.user.name || "this creator"} in the OmniMind Creator Arena.` : "Create, vote and win credits in the OmniMind Creator Arena.", url: url.toString() };
    try {
      if (navigator.share) await navigator.share(payload);
      else { await navigator.clipboard.writeText(url.toString()); setMessage("Contest link copied — share it with your community."); }
    } catch (error) { if (error instanceof Error && error.name !== "AbortError") setMessage("Could not share this entry."); }
  }

  async function submit() {
    if (!selected || !file) return;
    setUploading(true); setMessage(null); setProgress(0);
    try { await uploadEntry(selected, file, caption, setProgress); setSelected(null); setFile(null); setCaption(""); notifyCreditsChanged(); await load(); setMessage("Entry published. Now earn the community's vote."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-accent/25 via-card to-cyan/10 p-6 sm:p-10">
      <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-cyan/20 blur-3xl" />
      <div className="relative max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/10 px-3 py-1 text-[11px] font-bold tracking-[.18em] text-cyan"><Sparkles size={13}/> OMNIMIND CREATOR ARENA</span>
      <h1 className="mt-5 font-head text-4xl font-bold tracking-tight sm:text-6xl">Create. Get seen.<br/><span className="text-cyan">Win credits.</span></h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">Weekly original photo and reel challenges. Vote for work that moves you, climb the live ranking and turn creativity into OmniMind power.</p></div>
    </section>

    <div className="my-7 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/[.03] p-1.5 sm:max-w-md">
      {(["photo", "reel"] as const).map((kind) => <button key={kind} onClick={() => setType(kind)} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${type === kind ? "bg-white text-bg shadow-lg" : "text-muted hover:text-white"}`}>{kind === "photo" ? <Camera size={17}/> : <Film size={17}/>} {kind === "photo" ? "Photo Challenge" : "Reel Challenge"}</button>)}
    </div>

    {challenge ? <>
      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="glass rounded-3xl p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan">Weekly challenge</p><h2 className="mt-2 font-head text-3xl font-bold">{challenge.title}</h2><p className="mt-2 max-w-2xl text-sm text-muted">{challenge.prompt}</p></div><div className="flex items-center gap-2"><button onClick={()=>share()} className="rounded-full bg-white/[.06] p-2.5 text-muted transition hover:text-white" aria-label="Share challenge"><Share2 size={15}/></button><div className="flex items-center gap-2 rounded-full bg-white/[.06] px-3 py-2 text-xs text-amber"><Clock3 size={15}/>{remaining(challenge.endsAt)}</div></div></div>
        <div className="mt-6 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white/[.05] px-3 py-2">Entry: {challenge.entryCost} credits</span><span className="rounded-full bg-white/[.05] px-3 py-2">1 entry per creator</span><span className="rounded-full bg-white/[.05] px-3 py-2">Community voting</span>{type === "reel" && <span className="rounded-full bg-white/[.05] px-3 py-2">Max 60 sec / 150 MB</span>}</div>
        <button onClick={() => data?.authenticated ? setSelected(challenge) : location.href = "/login?next=/contests"} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-cyan px-6 py-3.5 text-sm font-bold text-white shadow-glow transition-transform hover:-translate-y-0.5"><Upload size={17}/> Submit your {type}</button></div>
        <aside className="glass rounded-3xl p-6"><div className="flex items-center gap-2 text-amber"><Trophy size={19}/><h3 className="font-bold">Weekly rewards</h3></div>{[challenge.prizeFirst, challenge.prizeSecond, challenge.prizeThird].map((prize,index)=><div key={prize} className="mt-3 flex items-center justify-between rounded-xl bg-white/[.04] px-4 py-3"><span className="text-sm text-muted">#{index+1}</span><strong className="text-amber">{prize} credits</strong></div>)}<p className="mt-3 text-[11px] leading-relaxed text-mutedDark">Rewards unlock with at least 3 valid creators and 10 unique community voters. Entries cost 15 credits; the maximum weekly reward liability is fixed and sustainable.</p></aside>
      </section>

      <section className="mt-10"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan">Fair discovery</p><h2 className="mt-1 font-head text-2xl font-bold">Community picks</h2><p className="mt-1 text-xs text-muted">Fresh and less-seen work appears first; rank badges remain live.</p></div><span className="text-xs text-muted">{challenge.entries.length} creators</span></div>
      {challenge.entries.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{challenge.votingEntries.map((entry)=><article id={`entry-${entry.id}`} key={entry.id} className="group overflow-hidden rounded-2xl border border-white/8 bg-card/70 transition-all hover:-translate-y-1 hover:border-cyan/30"><div className="relative aspect-[4/5] overflow-hidden bg-black">{entry.mediaType === "photo" ? <Image unoptimized src={entry.mediaUrl} alt={entry.caption || "Contest entry"} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105"/> : <video src={entry.mediaUrl} controls playsInline preload="metadata" className="h-full w-full object-cover"/>}<span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold backdrop-blur">#{challenge.entries.findIndex((ranked)=>ranked.id===entry.id)+1}</span><div className="absolute right-2 top-2 flex gap-1"><button onClick={()=>share(entry)} className="rounded-full bg-black/65 p-2 text-white/75 backdrop-blur" aria-label="Share entry"><Share2 size={12}/></button><button onClick={()=>report(entry)} className="rounded-full bg-black/65 px-2 py-1 text-[10px] text-white/70 backdrop-blur" aria-label="Report entry">•••</button></div></div><div className="p-3"><p className="truncate text-xs font-semibold">{entry.user.name || "Creator"}</p><p className="mt-1 line-clamp-2 min-h-8 text-[11px] text-muted">{entry.caption || "Untitled"}</p><button disabled={voted.has(entry.id) || entry.userId === data?.viewerId} onClick={() => vote(entry)} className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${voted.has(entry.id) ? "bg-crimson/15 text-crimson" : "bg-white/[.06] text-white hover:bg-crimson/20 hover:text-crimson disabled:opacity-35"}`}><Heart size={14} fill={voted.has(entry.id) ? "currentColor" : "none"}/>{entry._count.votes} votes</button></div></article>)}</div> : <div className="rounded-3xl border border-dashed border-white/10 py-16 text-center text-sm text-muted">Be the first creator in this challenge.</div>}
      </section>
    </> : <div className="py-20 text-center text-muted">Preparing this week&apos;s challenge…</div>}

    {message && <div className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-md rounded-2xl border border-white/10 bg-card/95 p-4 text-center text-sm shadow-panel backdrop-blur-xl sm:bottom-6">{message}<button onClick={()=>setMessage(null)} className="ml-3 text-muted">×</button></div>}
    {selected && <div className="fixed inset-0 z-[80] grid place-items-end bg-black/65 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" onClick={()=>!uploading&&setSelected(null)}><div className="w-full max-w-lg rounded-t-[28px] border border-white/10 bg-card p-6 shadow-panel sm:rounded-[28px]" onClick={(event)=>event.stopPropagation()}><h3 className="font-head text-2xl font-bold">Enter {selected.title}</h3><p className="mt-1 text-xs text-muted">15 credits · one original entry · you keep ownership</p><button onClick={()=>inputRef.current?.click()} className="mt-5 flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[.03] text-muted hover:border-cyan/40 hover:text-white"><Upload/><span className="mt-2 text-sm">{file ? file.name : `Choose ${selected.mediaType}`}</span></button><input ref={inputRef} hidden type="file" accept={selected.mediaType === "photo" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm,video/quicktime"} onChange={(event)=>setFile(event.target.files?.[0]||null)}/><textarea value={caption} maxLength={280} onChange={(event)=>setCaption(event.target.value)} placeholder="Tell the story behind your entry…" className="mt-4 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/[.04] p-3 text-sm outline-none focus:border-cyan/50"/><label className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted"><input type="checkbox" checked={rightsAccepted} onChange={(event)=>setRightsAccepted(event.target.checked)} className="mt-0.5"/>I created this media or have permission to publish it, and accept the contest rules.</label>{uploading && <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-accent to-cyan transition-[width]" style={{width:`${progress}%`}}/></div>}<button disabled={!file||!rightsAccepted||uploading} onClick={submit} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-accent to-cyan py-3.5 text-sm font-bold disabled:opacity-35">{uploading ? `Uploading ${progress}%` : "Publish entry · 15 credits"}</button></div></div>}
    <p className="mt-12 text-center text-[11px] text-mutedDark">Original community competition inspired by proven challenge mechanics. OmniMind is not affiliated with GuruShots.</p>
  </main>;
}
