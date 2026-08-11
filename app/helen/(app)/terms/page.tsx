"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Helen and OmniMind are one product with one set of terms -- /terms now
// covers both (see the "Helen membership" section there), so this no
// longer keeps its own separate copy that could drift out of sync.
export default function TermsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/terms");
  }, [router]);
  return null;
}
