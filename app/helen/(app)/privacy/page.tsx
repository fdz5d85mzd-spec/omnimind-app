"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Helen and OmniMind are one product with one privacy policy -- /privacy
// now covers both (see the "Helen" section there), so this no longer
// keeps its own separate copy that could drift out of sync.
export default function PrivacyPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/privacy");
  }, [router]);
  return null;
}
