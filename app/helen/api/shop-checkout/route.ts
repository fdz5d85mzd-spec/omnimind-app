import { NextResponse } from "next/server";
import { SHOP_ITEMS } from "@/lib/helen/domain";
import { getStripeClient, isStripeConfigured, type SessionCreateParams } from "@/lib/helen/stripe/server";

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
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  }

  const { itemId, clientReferenceId } = (await request.json().catch(() => ({}))) as {
    itemId?: string;
    clientReferenceId?: string;
  };
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) {
    return NextResponse.json({ error: "Unknown item" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
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
    managed_payments: { enabled: false },
    success_url: `${origin}/helen/home/shop?session_id={CHECKOUT_SESSION_ID}&item=${item.id}`,
    cancel_url: `${origin}/helen/home/shop`,
  } satisfies SessionCreateParams);

  return NextResponse.json({ url: session.url });
}
