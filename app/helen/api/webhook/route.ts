import { NextResponse } from "next/server";
import { SHOP_ITEMS, tierFor } from "@/lib/helen/domain";
import {
  adminPurchaseNotificationHtml,
  adminSignupNotificationHtml,
  sendEmail,
  welcomeEmailHtml,
} from "@/lib/helen/resend";

const TEAM_NOTIFICATION_EMAIL = "helpdesk@origox.xyz";
import { getStripeClient, isStripeConfigured } from "@/lib/helen/stripe/server";
import { getSupabaseServerClient } from "@/lib/helen/supabase/server";

interface CheckoutSessionPayload {
  client_reference_id?: string | null;
  metadata?: { type?: string; item_id?: string; username?: string } | null;
}

/**
 * Stripe webhook: only after `checkout.session.completed` do we create the
 * member row / record a purchase, so nothing is granted for an unpaid
 * session. Two kinds of session land here, told apart by `metadata.type`:
 *   - membership (no metadata, or type "membership") — from app/api/checkout/route.ts
 *   - "shop_item" — from app/api/shop-checkout/route.ts
 *
 * Point this route at STRIPE_WEBHOOK_SECRET's endpoint in the Stripe
 * dashboard once real keys are configured (see docs/GOING-LIVE.md).
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, { status: 501 });
  }

  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event;
  try {
    if (!signature) throw new Error("missing stripe-signature header");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${err}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as CheckoutSessionPayload;
    const userId = session.client_reference_id;
    if (!userId) {
      // No authenticated user attached to this session — see the note in
      // app/api/checkout/route.ts about the still-missing auth flow.
      return NextResponse.json({ error: "Missing client_reference_id" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (session.metadata?.type === "shop_item") {
      const itemId = session.metadata.item_id;
      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      if (!item) {
        console.error("shop webhook: unknown item in session metadata", itemId);
        return NextResponse.json({ error: "Unknown item in session metadata" }, { status: 400 });
      }
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", userId)
        .single();
      if (memberError) {
        console.error("shop webhook: member lookup failed", { userId, error: memberError });
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }
      const { error: purchaseError } = await supabase
        .from("shop_purchases")
        .insert({ member_id: member.id, item_id: item.id, amount_eur: item.priceEur });
      if (purchaseError) {
        console.error("shop webhook: purchase insert failed", {
          memberId: member.id,
          itemId: item.id,
          error: purchaseError,
        });
        return NextResponse.json({ error: purchaseError.message }, { status: 500 });
      }
      console.log("shop webhook: purchase recorded", { memberId: member.id, itemId: item.id });
      sendEmail(
        TEAM_NOTIFICATION_EMAIL,
        `New purchase: ${item.id}`,
        adminPurchaseNotificationHtml(member.id, item.id, item.priceEur),
      ).catch(() => {});
      return NextResponse.json({ received: true });
    }

    // Membership signup: `id` is intentionally omitted — its column default
    // (nextval('member_id_seq'), see supabase/schema.sql) is what makes
    // assignment race-safe under concurrent webhook deliveries. `tier` still
    // needs a value, so insert with a placeholder tier and fix it up in the
    // same round trip once Postgres has assigned the id.
    const { data: inserted, error: insertError } = await supabase
      .from("members")
      .insert({ user_id: userId, tier: tierFor(0), username: session.metadata?.username ?? null })
      .select("id")
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { error: tierError } = await supabase
      .from("members")
      .update({ tier: tierFor(inserted.id) })
      .eq("id", inserted.id);
    if (tierError) {
      return NextResponse.json({ error: tierError.message }, { status: 500 });
    }

    // Best-effort welcome + team notification emails — never block the
    // response on failure.
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (authUser?.user?.email) {
      sendEmail(authUser.user.email, "Welcome to HELEN 🌍", welcomeEmailHtml(inserted.id)).catch(() => {});
    }
    sendEmail(
      TEAM_NOTIFICATION_EMAIL,
      `New HELEN member #${String(inserted.id).padStart(6, "0")}`,
      adminSignupNotificationHtml(inserted.id, authUser?.user?.email ?? null),
    ).catch(() => {});
  }

  return NextResponse.json({ received: true });
}
