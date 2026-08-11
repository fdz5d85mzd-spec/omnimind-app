import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret, maskKey } from "@/lib/connectorCrypto";

const SUPPORTED_PROVIDERS = ["openai"] as const;
type Provider = (typeof SUPPORTED_PROVIDERS)[number];

function isSupportedProvider(value: unknown): value is Provider {
  return typeof value === "string" && (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const connections = await prisma.userConnection.findMany({
    where: { userId: session.user.id },
    select: { provider: true, maskedKey: true, createdAt: true },
  });
  return NextResponse.json({ connections });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const provider = body.provider;
  const apiKey = String(body.apiKey ?? "").trim();

  if (!isSupportedProvider(provider)) {
    return NextResponse.json({ error: `Unsupported provider. Supported: ${SUPPORTED_PROVIDERS.join(", ")}` }, { status: 400 });
  }
  if (!apiKey || apiKey.length < 10 || apiKey.length > 500) {
    return NextResponse.json({ error: "A valid API key is required" }, { status: 400 });
  }

  await prisma.userConnection.upsert({
    where: { userId_provider: { userId: session.user.id, provider } },
    create: {
      userId: session.user.id,
      provider,
      encryptedKey: encryptSecret(apiKey),
      maskedKey: maskKey(apiKey),
    },
    update: {
      encryptedKey: encryptSecret(apiKey),
      maskedKey: maskKey(apiKey),
    },
  });

  return NextResponse.json({ ok: true, provider, maskedKey: maskKey(apiKey) });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  if (!isSupportedProvider(provider)) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  await prisma.userConnection
    .delete({ where: { userId_provider: { userId: session.user.id, provider } } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
