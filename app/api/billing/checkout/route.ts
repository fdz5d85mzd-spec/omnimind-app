import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripeClient, isStripeConfigured, type SessionCreateParams } from "@/lib/helen/stripe/server";
import { CREDIT_PACKS, PLANS } from "@/lib/billing";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 501 });
  }

  const body = await request.json().catch(() => ({}));
  const kind = body.kind;
  const id = String(body.id ?? "");
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const stripe = getStripeClient();
  const userId = session.user.id;
  const email = session.user.email;

  if (kind === "credits") {
    const pack = CREDIT_PACKS.find((p) => p.id === id);
    if (!pack) return NextResponse.json({ error: "Unknown credit pack" }, { status: 400 });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(pack.priceEur * 100),
            product_data: { name: `${pack.credits.toLocaleString("en-US")} OmniMind credits` },
          },
          quantity: 1,
        },
      ],
      metadata: { type: "omnimind_credits", userId, credits: String(pack.credits) },
      managed_payments: { enabled: false },
      success_url: `${origin}/settings?purchase=success`,
      cancel_url: `${origin}/pricing`,
    } satisfies SessionCreateParams);

    return NextResponse.json({ url: checkoutSession.url });
  }

  if (kind === "plan") {
    const plan = PLANS.find((p) => p.id === id);
    if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

    if (plan.interval === "lifetime") {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: Math.round(plan.priceEur * 100),
              product_data: { name: "OmniMind Lifetime" },
            },
            quantity: 1,
          },
        ],
        metadata: { type: "omnimind_plan", userId, plan: plan.id },
        managed_payments: { enabled: false },
        success_url: `${origin}/settings?purchase=success`,
        cancel_url: `${origin}/pricing`,
      } satisfies SessionCreateParams);

      return NextResponse.json({ url: checkoutSession.url });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(plan.priceEur * 100),
            recurring: { interval: plan.interval },
            product_data: { name: plan.label },
          },
          quantity: 1,
        },
      ],
      // Session-level metadata covers the first invoice (via
      // checkout.session.completed); subscription-level metadata is what
      // the renewal webhook (invoice.paid) can actually read back later.
      metadata: { type: "omnimind_plan", userId, plan: plan.id },
      subscription_data: { metadata: { type: "omnimind_plan", userId, plan: plan.id } },
      managed_payments: { enabled: false },
      success_url: `${origin}/settings?purchase=success`,
      cancel_url: `${origin}/pricing`,
    } satisfies SessionCreateParams);

    return NextResponse.json({ url: checkoutSession.url });
  }

  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}
