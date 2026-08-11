import { NextResponse } from "next/server";
import { SHOP_ITEMS, tierFor } from "@/lib/helen/domain";
import {
  adminPurchaseNotificationHtml,
  adminSignupNotificationHtml,
  sendEmail,
  welcomeEmailHtml,
} from "@/lib/helen/resend";

const TEAM_NOTIFICATION_EMAIL = "helpdesk@omnimindai.app";
import { getStripeClient, isStripeConfigured } from "@/lib/helen/stripe/server";
import { getSupabaseServerClient } from "@/lib/helen/supabase/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/billing";

interface CheckoutSessionPayload {
  client_reference_id?: string | null;
  subscription?: string | null;
  metadata?: { type?: string; item_id?: string; username?: string; userId?: string; credits?: string; plan?: string } | null;
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

    // OmniMind's own credit/plan purchases: identified by metadata.userId
    // (a Prisma User id, distinct from Helen's client_reference_id which is
    // a Supabase auth id) -- handled entirely separately from Helen below.
    if (session.metadata?.type === "omnimind_credits") {
      const omniUserId = session.metadata.userId;
      const credits = parseInt(session.metadata.credits ?? "0", 10);
      if (!omniUserId || !credits) {
        return NextResponse.json({ error: "Missing userId or credits in metadata" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: omniUserId },
        data: { creditBalance: { increment: credits }, cooldownUntil: null },
      });
      console.log("omnimind credits webhook: granted", { omniUserId, credits });
      return NextResponse.json({ received: true });
    }

    if (session.metadata?.type === "omnimind_plan") {
      const omniUserId = session.metadata.userId;
      const planId = session.metadata.plan;
      const plan = PLANS.find((p) => p.id === planId);
      if (!omniUserId || !plan) {
        return NextResponse.json({ error: "Missing userId or unknown plan in metadata" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: omniUserId },
        data: { plan: plan.id, creditBalance: { increment: plan.monthlyCredits }, cooldownUntil: null },
      });
      console.log("omnimind plan webhook: granted", { omniUserId, plan: plan.id, credits: plan.monthlyCredits });
      return NextResponse.json({ received: true });
    }

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

  // Subscription renewal: grants the plan's monthly credits again each
  // billing cycle. Skips "subscription_create" (the very first invoice,
  // already covered by checkout.session.completed above) so a new
  // subscriber isn't credited twice on day one.
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as {
      billing_reason?: string;
      subscription?: string | { id: string } | null;
    };
    if (invoice.billing_reason === "subscription_cycle" && invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
      const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
      const omniUserId = subscription.metadata?.userId;
      const planId = subscription.metadata?.plan;
      const plan = PLANS.find((p) => p.id === planId);
      if (omniUserId && plan) {
        await prisma.user.update({
          where: { id: omniUserId },
          data: { creditBalance: { increment: plan.monthlyCredits }, cooldownUntil: null },
        });
        console.log("omnimind plan renewal webhook: granted", { omniUserId, plan: plan.id, credits: plan.monthlyCredits });
      }
    }
  }

  return NextResponse.json({ received: true });
}
