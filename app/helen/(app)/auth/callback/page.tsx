"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { getSupabaseBrowserClient } from "@/lib/helen/supabase/client";

function CallbackHandler() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/helen/checkout";
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function finish() {
      // Supabase Auth uses PKCE (a `?code=` param) on newer projects, or the
      // older implicit flow (`#access_token=` in the hash, auto-detected by
      // the client on load) on older ones — handle both.
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          setFailed(true);
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setFailed(true);
          return;
        }
      }
      router.replace(next);
    }

    finish();
  }, [searchParams, next, router]);

  if (failed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="mb-4 text-[13px] text-helen-coral">{t.signInError}</p>
        <button
          type="button"
          onClick={() => router.replace(`/helen/signin?next=${encodeURIComponent(next)}`)}
          className="text-sm font-semibold text-helen-gold"
        >
          {t.resendBtn}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <span className="h-6 w-6 animate-helen-spin-fast rounded-full border-2 border-helen-dim/30 border-t-gold" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
