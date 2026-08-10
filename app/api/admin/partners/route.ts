import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrMaster, requireMaster } from "@/lib/adminApi";
import { createPartner, deactivatePartner, listPartnersWithCommission } from "@/lib/adminPartners";

export async function GET() {
  const check = await requireAdminOrMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  return NextResponse.json({ partners: await listPartnersWithCommission() });
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  commissionPct: z.number().min(0).max(100),
});

export async function POST(request: NextRequest) {
  const check = await requireMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json().catch(() => null);
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
  }
  try {
    const { name, email, commissionPct } = result.data;
    const partner = await createPartner(name, email, commissionPct);
    return NextResponse.json({ partner }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A partner with that email already exists" }, { status: 409 });
  }
}

const deactivateSchema = z.object({ id: z.string().min(1) });

export async function DELETE(request: NextRequest) {
  const check = await requireMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json().catch(() => null);
  const result = deactivateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await deactivatePartner(result.data.id);
  return NextResponse.json({ ok: true });
}
