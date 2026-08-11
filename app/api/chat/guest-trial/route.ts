import { NextRequest, NextResponse } from "next/server";
import { GUEST_TRIAL_COOKIE, GUEST_TRIAL_MINUTES, guestTrialRemainingMs } from "@/lib/guestTrial";

// First touch starts the clock (httpOnly so it can't be reset from the
// console); every call after that just reports what's left. A page refresh
// re-reads the same cookie instead of resetting the trial.
export async function POST(request: NextRequest) {
  const existing = request.cookies.get(GUEST_TRIAL_COOKIE)?.value;
  const startedAt = existing && !Number.isNaN(Date.parse(existing)) ? existing : new Date().toISOString();
  const remainingMs = guestTrialRemainingMs(startedAt);

  const res = NextResponse.json({ remainingMs, minutes: GUEST_TRIAL_MINUTES });
  if (!existing) {
    res.cookies.set(GUEST_TRIAL_COOKIE, startedAt, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // the cookie itself lives a day; the trial window inside it is 5 minutes
      path: "/",
    });
  }
  return res;
}
