"use client";

import { useEffect } from "react";
import { captureReferralCode } from "@/lib/helen/referral";

// Mounted once in app/helen/layout.tsx so a partner link works no matter
// which Helen page it lands on (?ref=CODE), not just the join page.
export default function ReferralCapture() {
  useEffect(() => {
    captureReferralCode(window.location.search);
  }, []);
  return null;
}
