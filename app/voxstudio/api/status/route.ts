import { NextResponse } from "next/server";
import { isHiggsfieldConfigured } from "@/lib/voxstudio/higgsfield";

export async function GET() {
  const ready = isHiggsfieldConfigured();
  return NextResponse.json({ imageReady: ready, videoReady: ready });
}
