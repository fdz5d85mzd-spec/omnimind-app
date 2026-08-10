"use client";

import dynamic from "next/dynamic";

// This page's state is entirely wall-clock/localStorage driven (hunger decay,
// zustand persist rehydration, blink randomization) — none of that can match
// between server and client render, so it's forced client-only rather than
// fighting hydration mismatches on values that are meaningless server-side.
const CreatureLabApp = dynamic(() => import("@/components/helen/lab/CreatureLabApp"), { ssr: false });

export default function CreatureLabPage() {
  return <CreatureLabApp />;
}
