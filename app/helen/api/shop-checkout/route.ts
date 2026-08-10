import { NextResponse } from "next/server";
import { SHOP_ITEMS } from "@/lib/helen/domain";
import { getStripeClient, isStripeConfigured, type SessionCreateParams } from "@/lib/helen/stripe/server";
import { isSupabaseConfigured, getSupabaseServerClient } from "@/lib/helen/supabase/server";
import { resolveActivePartnerCode } from "@/lib/adminPartners";
import { isAdminEmail, isMasterEmail } from "@/lib/roles";

/**
 * Creates a Stripe Checkout Session for one shop item. Price is looked up
 * server-side from SHOP_ITEMS — never trust a client-supplied amount.
 * `metadata.type: "shop_item"` is how the webhook (app/api/webhook/route.ts)
 * tells this apart from a membership checkout session.
 *
 * Inactive until STRIPE_SECRET_KEY is set — app/home/shop/page.tsx falls
 * back to a mock purchase until then, same pattern as app/checkout/page.tsx.
 */
export async function POST(request: Request) {
  const { itemId, clientReferenceId, refCode } = (await request.json().catch(() => ({}))) as {
    itemId?: string;
    clientReferenceId?: string;
    refCode?: string;
  };
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) {
    return NextResponse.json({ error: "Unknown item" }, { status: 400 });
  }

  // Same admin/master bypass as /helen/api/checkout -- see there for why.
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
          unit_amount: Math.round(item.priceEur * 100),
          product_data: { name: `HELEN — ${item.id}` },
        },
        quantity: 1,
      },
    ],
    client_reference_id: clientReferenceId,
    metadata: { type: "shop_item", item_id: item.id },
    // Lands on the PaymentIntent, which is what lib/adminPartners.ts scans
    // for commission attribution -- see app/helen/api/checkout for why.
    payment_intent_data: partnerCode ? { metadata: { ref_code: partnerCode } } : undefined,
    managed_payments: { enabled: false },
    allow_promotion_codes: true,
    success_url: `${origin}/helen/home/shop?session_id={CHECKOUT_SESSION_ID}&item=${item.id}`,
    cancel_url: `${origin}/helen/home/shop`,
  } satisfies SessionCreateParams);

  return NextResponse.json({ url: session.url });
}
