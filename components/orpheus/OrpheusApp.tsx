"use client";

import { useEffect, useRef, useState } from "react";

export default function OrpheusApp() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    let cancelled = false;

    async function mount() {
      try {
        const [html, baseCss, transferCss, pricingCss] = await Promise.all([
          fetch("/orpheus-assets/index.html").then((response) => response.text()),
          fetch("/orpheus-assets/style.css").then((response) => response.text()),
          fetch("/orpheus-assets/transfer.css").then((response) => response.text()),
          fetch("/orpheus-assets/pricing.css").then((response) => response.text()),
        ]);
        if (cancelled) return;

        const parsed = new DOMParser().parseFromString(html, "text/html");
        parsed.querySelector('script[src="/src/main.js"]')?.remove();
        parsed.querySelector(".topbar")?.remove();

        const scopedCss = `${baseCss}\n${transferCss}\n${pricingCss}`
          .replace(":root", ":host")
          .replace("body{", ".orpheus-root{");

        shadow.innerHTML = `<style>${scopedCss}</style><div class="orpheus-root">${parsed.body.innerHTML}</div>`;

        const modulePath = "/orpheus-assets/main.js";
        const orpheusModule = await import(/* webpackIgnore: true */ modulePath);
        if (!cancelled) orpheusModule.default(shadow);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Orpheus could not be loaded.");
      }
    }

    mount();
    return () => {
      cancelled = true;
      shadow.replaceChildren();
    };
  }, []);

  if (error) {
    return <div className="min-h-[70vh] px-6 py-24 text-center text-crimson">{error}</div>;
  }

  return <div ref={hostRef} className="min-h-screen bg-[#f1eee6]" />;
}
