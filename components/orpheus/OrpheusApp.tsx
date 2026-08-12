"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const greekText: Record<string,string> = {
  ".kicker":"Ιδιωτική μεταφορά αρχείων", ".hero-copy h1":"Μετέφερε αρχεία. Κράτησε το συναίσθημα.", ".intro":"Ένας πιο ήρεμος και όμορφος τρόπος να στέλνεις όσα έχουν σημασία. Γρήγορα, ιδιωτικά και απλά.",
  ".trust-row strong":"Επιλογή των δημιουργών", ".trust-row p":"Επιλογή των δημιουργών\nΤα αρχεία παραμένουν διαθέσιμα για 7 ημέρες", ".step-label":"Νέα μεταφορά", "#transfer-title":"Μοιράσου τα αρχεία σου", ".dropzone strong":"Πρόσθεσε αρχεία ή φακέλους", ".dropzone div span":"Σύρε τα εδώ ή επίλεξέ τα", ".tab[data-mode=email]":"Αποστολή με email", ".tab[data-mode=link]":"Δημιουργία συνδέσμου", "#transfer-button span":"Επίλεξε αρχεία για να ξεκινήσεις", ".legal":"Συνεχίζοντας, αποδέχεσαι τους Όρους και την Πολιτική Απορρήτου.", ".scroll-note":"Κύλησε για να ανακαλύψεις",
  ".how .section-number":"01 / Πώς λειτουργεί", ".how h2":"Από τα χέρια σου στα δικά τους, απλά.", ".security .section-number":"02 / Πρώτα η ιδιωτικότητα", ".security h2":"Η δουλειά σου είναι δική σου. Πάντα.", ".pricing-head .section-number":"03 / Απλές τιμές", ".pricing-head h2":"Επίλεξε τον όγκο σου.", ".pricing-head>p":"Ιδιωτικές μεταφορές, διαθεσιμότητα επτά ημερών και χωρίς κρυφές χρεώσεις.",
};

export default function OrpheusApp() {
  const { lang } = useLanguage();
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
        if (lang === "el") Object.entries(greekText).forEach(([selector, value]) => { const el=shadow.querySelector<HTMLElement>(selector); if(el) el.innerText=value; });

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
  }, [lang]);

  if (error) {
    return <div className="min-h-[70vh] px-6 py-24 text-center text-crimson">{error}</div>;
  }

  return <div ref={hostRef} className="min-h-screen bg-[#f1eee6]" />;
}
