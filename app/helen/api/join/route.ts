import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserWithRefill } from "@/lib/creditsServer";
import { getStripeClient, isStripeConfigured, type SessionCreateParams } from "@/lib/helen/stripe/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/helen/supabase/server";
import { createHelenMembership } from "@/lib/helen/membership";
import { resolveActivePartnerCode } from "@/lib/adminPartners";
import { isAdminEmail, isMasterEmail } from "@/lib/roles";

// EUR 1.00 at the EUR 0.01/credit rate (see lib/billing.ts) -- same price
// as the card checkout, just paid from the user's own balance instead.
const HELEN_MEMBERSHIP_CREDITS = 100;

/**
 * Bridges an authenticated OmniMind user into Helen. Owner/admin accounts are
 * always treated as internal testers: they receive/create their Helen member
 * record without Stripe or credit deductions, regardless of which payment
 * method an older cached client happens to submit.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Helen is not configured" }, { status: 501 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    method?: "credits" | "card";
    username?: string;
    refCode?: string;
  };
  const username = body.username?.trim().slice(0, 20) || null;
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const isPrivileged = isMasterEmail(session.user.email) || isAdminEmail(session.user.email);

  const supabase = getSupabaseServerClient();
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: session.user.email,
    options: { redirectTo: `${origin}/helen/auth/callback?next=${encodeURIComponent("/helen/home")}` },
  });
  if (linkError || !linkData?.user?.id || !linkData?.properties?.action_link) {
    console.error("helen join: generateLink failed", linkError);
    return NextResponse.json({ error: "Helen isn't reachable right now. Please try again in a moment." }, { status: 500 });
  }
  const supabaseUserId = linkData.user.id;
  const bridgeUrl = linkData.properties.action_link;

  // Existing members are always bridged straight back in with no new charge.
  const { data: existingMember } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", supabaseUserId)
    .maybeSingle();
  if (existingMember) {
    return NextResponse.json({ url: bridgeUrl, bypass: isPrivileged });
  }

  // Owner/admin testing pass. This check deliberately happens before the card
  // branch so even an older cached checkout UI can never send an owner to
  // Stripe or deduct credits.
  if (isPrivileged) {
    const membership = await createHelenMembership(supabaseUserId, username);
    if ("error" in membership) {
      console.error("helen join: privileged createHelenMembership failed", membership.error);
      return NextResponse.json({ error: "Helen isn't set up correctly yet. Please try again in a moment." }, { status: 500 });
    }
    return NextResponse.json({ url: bridgeUrl, bypass: true });
  }

  if (body.method === "card") {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Payments are not configured" }, { status: 501 });
    }
    const stripe = getStripeClient();
    const partnerCode = await resolveActivePartnerCode(body.refCode);
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: { currency: "eur", unit_amount: 100, product_data: { name: "HELEN membership" } },
          quantity: 1,
        },
      ],
      client_reference_id: supabaseUserId,
      metadata: username ? { username } : undefined,
      payment_intent_data: { metadata: { source: "helen", ...(partnerCode ? { ref_code: partnerCode } : {}) } },
      managed_payments: { enabled: false },
      allow_promotion_codes: true,
      success_url: `${origin}/helen/api/join/bridge?next=${encodeURIComponent("/helen/card")}`,
      cancel_url: `${origin}/helen/checkout`,
    } satisfies SessionCreateParams);

    return NextResponse.json({ url: checkoutSession.url });
  }

  const user = await getUserWithRefill(session.user.id);
  if (!user || user.creditBalance < HELEN_MEMBERSHIP_CREDITS) {
    return NextResponse.json(
      {
        error: "blocked",
        reason: "no_credits",
        need: HELEN_MEMBERSHIP_CREDITS,
        have: user?.creditBalance ?? 0,
      },
      { status: 402 },
    );
  }

  const membership = await createHelenMembership(supabaseUserId, username);
  if ("error" in membership) {
    console.error("helen join: createHelenMembership failed", membership.error);
    return NextResponse.json({ error: "Helen isn't set up correctly yet. Please try again in a moment." }, { status: 500 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { creditBalance: { decrement: HELEN_MEMBERSHIP_CREDITS } },
  });

  return NextResponse.json({ url: bridgeUrl });
}
