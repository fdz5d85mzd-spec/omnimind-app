"use client";
import { useEffect, useRef, useState } from "react";
import { Compass, Play, RotateCcw, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { atlasCopy } from "@/lib/atlasStrings";
import Image from "next/image";

type Mode = "idle" | "playing" | "won" | "lost";
type Point = { x: number; y: number };
const TARGET = 12,
  DURATION = 45;
export default function AtlasGame() {
  const { lang } = useLanguage(),
    s = atlasCopy(lang);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("idle"),
    [score, setScore] = useState(0),
    [time, setTime] = useState(DURATION);
  const game = useRef({
    hero: { x: 0.5, y: 0.72 },
    shards: [] as Point[],
    hazards: [] as Point[],
    keys: new Set<string>(),
    started: 0,
    last: 0,
    score: 0,
    mode: "idle" as Mode,
    pointer: null as Point | null,
  });
  function start() {
    const g = game.current;
    g.hero = { x: 0.5, y: 0.72 };
    g.shards = Array.from({ length: 18 }, (_, i) => ({
      x: 0.09 + ((i * 37) % 82) / 100,
      y: 0.13 + ((i * 53) % 72) / 100,
    }));
    g.hazards = Array.from({ length: 7 }, (_, i) => ({
      x: 0.12 + ((i * 29) % 76) / 100,
      y: 0.18 + ((i * 41) % 67) / 100,
    }));
    g.score = 0;
    g.started = performance.now();
    g.last = g.started;
    g.mode = "playing";
    setScore(0);
    setTime(DURATION);
    setMode("playing");
  }
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
        ].includes(e.code)
      ) {
        game.current.keys.add(e.code);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => game.current.keys.delete(e.code);
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    return () => {
      removeEventListener("keydown", down);
      removeEventListener("keyup", up);
    };
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas,
      ctx = c.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      const r = c.getBoundingClientRect(),
        d = Math.min(devicePixelRatio || 1, 1.5);
      c.width = r.width * d;
      c.height = r.height * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    addEventListener("resize", resize);
    function frame(now: number) {
      const g = game.current,
        w = c.clientWidth,
        h = c.clientHeight;
      const dt = Math.min(0.034, (now - (g.last || now)) / 1000);
      g.last = now;
      if (g.mode === "playing") {
        let dx = 0,
          dy = 0;
        const k = g.keys,
          pad = navigator.getGamepads?.()[0];
        if (k.has("ArrowLeft") || k.has("KeyA")) dx--;
        if (k.has("ArrowRight") || k.has("KeyD")) dx++;
        if (k.has("ArrowUp") || k.has("KeyW")) dy--;
        if (k.has("ArrowDown") || k.has("KeyS")) dy++;
        if (pad) {
          dx += Math.abs(pad.axes[0] || 0) > 0.18 ? pad.axes[0] : 0;
          dy += Math.abs(pad.axes[1] || 0) > 0.18 ? pad.axes[1] : 0;
        }
        if (g.pointer) {
          dx = (g.pointer.x - g.hero.x) * 5;
          dy = (g.pointer.y - g.hero.y) * 5;
        }
        const m = Math.hypot(dx, dy) || 1;
        g.hero.x = Math.max(
          0.035,
          Math.min(0.965, g.hero.x + (dx / m) * dt * 0.34),
        );
        g.hero.y = Math.max(
          0.06,
          Math.min(0.94, g.hero.y + (dy / m) * dt * 0.34),
        );
        g.shards = g.shards.filter((p) => {
          if (Math.hypot(p.x - g.hero.x, p.y - g.hero.y) < 0.045) {
            g.score++;
            setScore(g.score);
            return false;
          }
          return true;
        });
        for (const p of g.hazards)
          if (Math.hypot(p.x - g.hero.x, p.y - g.hero.y) < 0.055) {
            g.hero = { x: 0.5, y: 0.72 };
            g.started -= 3000;
            break;
          }
        const left = Math.max(0, DURATION - (now - g.started) / 1000);
        setTime(Math.ceil(left));
        if (g.score >= TARGET) {
          g.mode = "won";
          setMode("won");
        } else if (left <= 0) {
          g.mode = "lost";
          setMode("lost");
        }
      }
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#071128");
      grad.addColorStop(0.55, "#171144");
      grad.addColorStop(1, "#091d33");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(110,231,255,.12)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.52, Math.min(w, h) * i * 0.095, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 55; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.12 + (i % 5) * 0.06})`;
        ctx.fillRect((i * 73) % w, (i * 127) % h, 1.2, 1.2);
      }
      for (const p of g.shards) {
        ctx.save();
        ctx.translate(p.x * w, p.y * h);
        ctx.rotate(now / 900);
        ctx.fillStyle = "#67e8f9";
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 14;
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();
      }
      for (const p of g.hazards) {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 12 + Math.sin(now / 230) * 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(251,113,133,.22)";
        ctx.fill();
        ctx.strokeStyle = "#fb7185";
        ctx.stroke();
      }
      const x = g.hero.x * w,
        y = g.hero.y * h;
      ctx.beginPath();
      ctx.arc(x, y, 17, 0, Math.PI * 2);
      ctx.fillStyle = "#e8fbff";
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 25;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#173b69";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#67e8f9";
      ctx.fill();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);
  function pointer(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    game.current.pointer = {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-10">
      <section className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold tracking-[.18em] text-cyan">
            <Compass size={15} /> OMNIMIND EXPERIENCES
          </p>
          <h1 className="mt-2 font-head text-4xl font-bold sm:text-6xl">
            {s.title}
          </h1>
          <p className="mt-2 text-sm text-muted">{s.sub}</p>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/helen/creatures/v2/stage-2.png" alt="Atlas companion" width={44} height={44} className="h-11 w-11 object-contain" />
          <span className="glass rounded-xl px-4 py-2 text-sm">
            <b className="text-cyan">{score}</b>/{TARGET} {s.score}
          </span>
          <span className="glass rounded-xl px-4 py-2 text-sm">
            <b className="text-amber">{time}</b>s
          </span>
        </div>
      </section>
      <div className="relative overflow-hidden rounded-[28px] border border-cyan/20 bg-black shadow-[0_25px_100px_rgba(34,211,238,.12)]">
        <canvas
          ref={canvasRef}
          onPointerDown={pointer}
          onPointerMove={(e) => {
            if (e.buttons) pointer(e);
          }}
          onPointerUp={() => (game.current.pointer = null)}
          onPointerCancel={() => (game.current.pointer = null)}
          className="block aspect-[9/12] w-full touch-none sm:aspect-video"
          aria-label={s.title}
        />
        {mode !== "playing" && (
          <div className="absolute inset-0 grid place-items-center bg-[#05091a]/60 p-6 text-center backdrop-blur-sm">
            <div>
              <Sparkles className="mx-auto text-cyan" size={36} />
              <h2 className="mt-4 font-head text-3xl font-bold">
                {mode === "won" ? s.win : mode === "lost" ? s.lose : s.mission}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                {s.hint}
              </p>
              <button
                onClick={start}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-cyan px-6 py-3.5 font-bold text-white"
              >
                {mode === "idle" ? <Play size={17} /> : <RotateCcw size={17} />}{" "}
                {mode === "idle" ? s.start : s.restart}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
