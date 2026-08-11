"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ImpersonationBanner() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  if (!session?.user?.impersonating) return null;

  async function exit() {
    if (exiting) return;
    setExiting(true);
    await fetch("/api/admin/impersonate", { method: "DELETE" }).catch(() => {});
    await update();
    router.replace("/admin/users");
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber text-black text-sm font-semibold px-4 py-2 text-center">
      <span>
        Viewing as {session.user.email} — actions here affect their account, not yours.
      </span>
      <button
        onClick={exit}
        disabled={exiting}
        className="rounded-full bg-black/85 text-white px-3 py-1 text-xs font-bold hover:bg-black transition-colors disabled:opacity-60"
      >
        {exiting ? "Exiting…" : "Exit"}
      </button>
    </div>
  );
}
