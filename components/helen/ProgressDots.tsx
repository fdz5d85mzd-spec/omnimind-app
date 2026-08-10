"use client";

import { usePathname } from "next/navigation";

const STEPS = ["/", "/checkout", "/card", "/egg", "/home"];

export function ProgressDots() {
  const pathname = usePathname();
  const activeIndex = STEPS.findIndex((step) =>
    step === "/home" ? pathname.startsWith("/home") : pathname === step,
  );

  return (
    <div className="mt-3.5 flex justify-center gap-1.5">
      {STEPS.map((step, i) => (
        <div
          key={step}
          className={`h-1.5 w-1.5 rounded-full ${i === activeIndex ? "bg-helen-coral" : "bg-white/15"}`}
        />
      ))}
    </div>
  );
}
