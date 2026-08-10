import { NextRequest, NextResponse } from "next/server";
import { requireMaster, callBackendAdmin } from "@/lib/adminApi";

export async function POST(request: NextRequest) {
  const check = await requireMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json().catch(() => ({}));
  const decisionId = String(body.decisionId ?? "");
  if (!decisionId) return NextResponse.json({ error: "decisionId required" }, { status: 400 });

  const res = await callBackendAdmin(
    `/policy/approve/${encodeURIComponent(decisionId)}?approver_role=system.admin`,
    { method: "POST" }
  );
  if (!res.ok) {
    return NextResponse.json({ error: `Backend returned ${res.status}` }, { status: 502 });
  }
  return NextResponse.json(await res.json());
}
