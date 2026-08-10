import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrMaster, requireMaster } from "@/lib/adminApi";
import { createPromoCodes, deactivatePromoCode, listPromoCodes } from "@/lib/adminPromoCodes";
import { isStripeConfigured } from "@/lib/helen/stripe/server";

export async function GET() {
  const check = await requireAdminOrMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  return NextResponse.json({ stripeConfigured: isStripeConfigured(), codes: await listPromoCodes() });
}

const createSchema = z.object({
  count: z.number().int().min(1).max(50),
  percentOff: z.number().min(1).max(100),
  maxRedemptionsEach: z.number().int().min(1).nullable().optional(),
  expiresInDays: z.number().int().min(1).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const check = await requireMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  }

  const body = await request.json().catch(() => null);
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
  }
  const { count, percentOff, maxRedemptionsEach, expiresInDays } = result.data;
  const codes = await createPromoCodes(count, percentOff, maxRedemptionsEach ?? null, expiresInDays ?? null);
  return NextResponse.json({ codes });
}

const deactivateSchema = z.object({ id: z.string().min(1) });

export async function DELETE(request: NextRequest) {
  const check = await requireMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  }

  const body = await request.json().catch(() => null);
  const result = deactivateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await deactivatePromoCode(result.data.id);
  return NextResponse.json({ ok: true });
}
