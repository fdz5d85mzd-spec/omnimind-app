import { NextResponse } from "next/server";
import { MEMBERSHIP_PRICE_EUR } from "@/lib/helen/domain";
import { getStripeClient, isStripeConfigured, type SessionCreateParams } from "@/lib/helen/stripe/server";
import { isSupabaseConfigured, getSupabaseServerClient } from "@/lib/helen/supabase/server";
import { resolveActivePartnerCode } from "@/lib/adminPartners";
import { isAdminEmail, isMasterEmail } from "@/lib/roles";

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
  const { clientReferenceId, username, refCode } = (await request.json().catch(() => ({}))) as {
    clientReferenceId?: string;
    username?: string;
    refCode?: string;
  };

  // Michail and Marina (MASTER_EMAIL / ADMIN_EMAIL) can exercise the real
  // checkout flow without spending real money -- looked up server-side by
  // Supabase user id, never trusted from the client. Everyone else pays.
  if (clientReferenceId && isSupabaseConfigured()) {
    const { data } = await getSupabaseServerClient().auth.admin.getUserById(clientReferenceId);
    const email = data.user?.email;
    if (isMasterEmail(email) || isAdminEmail(email)) {
      return NextResponse.json({ bypass: true });
    }
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const partnerCode = await resolveActivePartnerCode(refCode);

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
    // Lands on the PaymentIntent (not the Session) -- that's what
    // lib/adminPartners.ts actually scans for commission attribution, since
    // Charge/PaymentIntent metadata isn't inherited from the Session.
    payment_intent_data: partnerCode ? { metadata: { ref_code: partnerCode } } : undefined,
    managed_payments: { enabled: false },
    allow_promotion_codes: true,
    success_url: `${origin}/helen/card?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/helen/checkout`,
  } satisfies SessionCreateParams);

  return NextResponse.json({ url: session.url });
}
