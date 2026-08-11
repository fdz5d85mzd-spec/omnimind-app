import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { checkCreditGate, creditsForAnswer, FREE_COOLDOWN_HOURS } from "@/lib/credits";
import { getUserWithRefill } from "@/lib/creditsServer";
import { prisma } from "@/lib/prisma";
import { getUserProviderKey } from "@/lib/connectorLookup";

// Gated version of POST /agent/run/stream for signed-in users: checks
// credits/cooldown BEFORE the request reaches the LLM (the browser never
// talks to the backend directly here, so this can't be bypassed the way a
// client-side-only check could), streams the real backend response through
// unmodified, then deducts credits proportional to the real answer length
// once the stream completes. Guests are unaffected — they keep using the
// existing direct-to-backend path, ungated, exactly as before.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await getUserWithRefill(session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Michail and Marina (MASTER_EMAIL / ADMIN_EMAIL) need to be able to
  // exercise every flow to check it actually works, without spending real
  // money or running into the same credit wall a normal signup would.
  const isPrivileged = Boolean(session.user.isMaster || session.user.isAdmin);

  // A user's own connected provider key means they're spending their own
  // quota, not ours -- same free pass as admins get, but for a different
  // reason (no cost to us either way).
  const ownOpenAiKey = await getUserProviderKey(user.id, "openai");
  const usingOwnKey = Boolean(ownOpenAiKey);

  if (!isPrivileged && !usingOwnKey) {
    const gate = checkCreditGate(user);
    if (!gate.allowed) {
      return NextResponse.json({ error: "blocked", ...gate }, { status: 402 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const prompt = String(body.prompt ?? "");
  if (!prompt.trim()) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}/agent/run/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        session_id: `user_${user.id}`,
        ...(usingOwnKey ? { user_api_key: ownOpenAiKey, user_api_provider: "openai" } : {}),
      }),
    });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
  if (!backendRes.ok || !backendRes.body) {
    return NextResponse.json({ error: `Backend returned ${backendRes.status}` }, { status: 502 });
  }

  const reader = backendRes.body.getReader();
  const decoder = new TextDecoder();
  const userId = user.id;
  const startingBalance = user.creditBalance;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      let finalAnswer: string | null = null;
      let finalDurationMs = 0;
      let finalRunId = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";
        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim());
            if (evt.type === "done") {
              finalAnswer = String(evt.answer ?? "");
              finalDurationMs = Number(evt.duration_ms ?? 0);
              finalRunId = String(evt.run_id ?? "");
            }
          } catch {
            // partial/non-JSON frame — ignore, next chunk will complete it
          }
        }
      }
      controller.close();

      if (finalAnswer !== null) {
        const cost = creditsForAnswer(finalAnswer.length);
        // Usage is still logged for admins and BYOK users (useful for
        // their own checks), just never deducted -- admins because
        // they're testing, BYOK users because they're spending their own
        // provider quota, not ours.
        const skipDeduction = isPrivileged || usingOwnKey;
        if (!skipDeduction) {
          const newBalance = startingBalance - cost;
          await prisma.user.update({
            where: { id: userId },
            data: {
              creditBalance: newBalance,
              ...(newBalance <= 0
                ? { cooldownUntil: new Date(Date.now() + FREE_COOLDOWN_HOURS * 3600_000) }
                : {}),
            },
          });
        }
        await prisma.usageEvent.create({
          data: {
            userId,
            runId: finalRunId || `unknown_${Date.now()}`,
            chars: finalAnswer.length,
            durationMs: finalDurationMs,
            creditsCost: skipDeduction ? 0 : cost,
          },
        });
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
