"use client";

import { useState } from "react";
import { HelpModal } from "./HelpModal";

export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Help"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black/40 text-[13px] font-bold text-helen-paper shadow-[0_2px_6px_rgba(0,0,0,0.3)] backdrop-blur-sm"
      >
        ?
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
