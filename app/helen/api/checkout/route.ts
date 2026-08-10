import { NextResponse } from "next/server";
import { MEMBERSHIP_PRICE_EUR } from "@/lib/helen/domain";
import { getStripeClient, isStripeConfigured, type SessionCreateParams } from "@/lib/helen/stripe/server";

/**
 * Creates a Stripe Checkout Session for the €1 membership.
 *
 * Inactive until STRIPE_SECRET_KEY is set — the app runs on the mock
 * checkout in app/checkout/page.tsx until then. Once wired up, that page
 * should POST here and redirect to the returned `url` instead of simulating
 * payment locally.
 *
 * `clientReferenceId` should be the authenticated user's id (Supabase auth)
 * so the webhook can link the completed payment back to a user — this
 * project doesn't have an auth flow yet, so that piece still needs building
 * before this route is wired in for real.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  }

  const { clientReferenceId, username } = (await request.json().catch(() => ({}))) as {
    clientReferenceId?: string;
    username?: string;
  };
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: MEMBERSHIP_PRICE_EUR * 100,
          product_data: { name: "HELEN membership" },
        },
        quantity: 1,
      },
    ],
    client_reference_id: clientReferenceId,
    metadata: username ? { username: username.trim().slice(0, 20) } : undefined,
    managed_payments: { enabled: false },
    success_url: `${origin}/helen/card?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/helen/checkout`,
  } satisfies SessionCreateParams);

  return NextResponse.json({ url: session.url });
}
