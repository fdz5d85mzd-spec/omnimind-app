import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminOrMaster, requireMaster } from "@/lib/adminApi";

const costsSchema = z.object({
  items: z.array(z.object({ label: z.string().min(1).max(60), monthlyUsd: z.number().min(0) })).max(30),
  marginPct: z.number().min(0).max(95),
  subscribers: z.number().int().min(1),
});

export async function GET() {
  const check = await requireAdminOrMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const settings = await prisma.costSettings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(
    settings ?? { id: "singleton", items: [], marginPct: 40, subscribers: 1, updatedAt: null }
  );
}

export async function POST(request: NextRequest) {
  const check = await requireMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json().catch(() => null);
  const result = costsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
  }

  const settings = await prisma.costSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...result.data },
    update: result.data,
  });
  return NextResponse.json(settings);
}
