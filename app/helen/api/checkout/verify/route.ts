import { NextResponse } from "next/server";
import { getStripeClient, isStripeConfigured } from "@/lib/helen/stripe/server";

export async function GET(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured" },
      { status: 501 },
    );
  }

  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId?.startsWith("cs_")) {
    return NextResponse.json(
      { error: "Invalid checkout session" },
      { status: 400 },
    );
  }

  try {
    const session =
      await getStripeClient().checkout.sessions.retrieve(sessionId);
    const guest = session.metadata?.type === "helen_guest";
    if (!guest || session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment is not complete" },
        { status: 402 },
      );
    }
    return NextResponse.json({
      paid: true,
      username: session.metadata?.username?.slice(0, 20) || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Checkout could not be verified" },
      { status: 400 },
    );
  }
}
