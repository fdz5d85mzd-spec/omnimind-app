import { NextRequest, NextResponse } from "next/server";
import { requireMaster, callBackendAdmin } from "@/lib/adminApi";

export async function POST(request: NextRequest) {
  const check = await requireMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json().catch(() => ({}));
  const enabled = Boolean(body.enabled);

  const res = await callBackendAdmin(`/policy/lockdown?enabled=${enabled}`, { method: "POST" });
  if (!res.ok) {
    return NextResponse.json({ error: `Backend returned ${res.status}` }, { status: 502 });
  }
  return NextResponse.json(await res.json());
}
