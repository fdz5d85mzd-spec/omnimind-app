"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface ParticleBurstProps {
  /** Bump this to fire a new burst; 0 fires nothing (initial mount). */
  trigger: number;
  color: string;
  reducedMotion: boolean;
}

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
}

const PARTICLES_PER_BURST = 10;

/**
 * Small custom confetti-style burst — a handful of dots animate outward
 * from center and fade. Deliberately not a library (react-particles etc.):
 * this is ~10 short-lived DOM nodes per burst, cheaper than a full particle
 * engine and easy to skip entirely under reduced-motion.
 */
export function ParticleBurst({ trigger, color, reducedMotion }: ParticleBurstProps) {
  const [bursts, setBursts] = useState<{ burstId: number; particles: Particle[] }[]>([]);
  const nextParticleId = useRef(0);

  useEffect(() => {
    if (trigger === 0 || reducedMotion) return;
    const particles: Particle[] = Array.from({ length: PARTICLES_PER_BURST }, () => ({
      id: nextParticleId.current++,
      angle: Math.random() * 360,
      distance: 60 + Math.random() * 50,
      size: 4 + Math.random() * 5,
    }));
    setBursts((prev) => [...prev, { burstId: trigger, particles }]);
    const clear = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.burstId !== trigger));
    }, 700);
    return () => clearTimeout(clear);
  }, [trigger, reducedMotion]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <AnimatePresence>
        {bursts.map((burst) =>
          burst.particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const dx = Math.cos(rad) * p.distance;
            const dy = Math.sin(rad) * p.distance;
            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: dx, y: dy, opacity: 0, scale: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  background: color,
                }}
              />
            );
          }),
        )}
      </AnimatePresence>
    </div>
  );
}
