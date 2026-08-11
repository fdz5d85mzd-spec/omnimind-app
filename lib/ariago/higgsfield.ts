import { higgsfield, config, SoulSize, SoulQuality, BatchSize } from "@higgsfield/client/v2";

// Same lazy-config pattern as lib/voxstudio/higgsfield.ts -- separate module
// because Aria Go isn't part of VoxStudio, just another feature that happens
// to call the same Higgsfield account.
let configured = false;
function ensureConfigured(): boolean {
  const creds = process.env.HF_CREDENTIALS;
  if (!creds) return false;
  if (!configured) {
    config({ credentials: creds });
    configured = true;
  }
  return true;
}

export function isHiggsfieldConfigured(): boolean {
  return Boolean(process.env.HF_CREDENTIALS);
}

type GenResult = { url: string } | { error: string };

function statusError(status: string): string {
  if (status === "nsfw") return "Blocked as NSFW content";
  if (status === "failed") return "Generation failed";
  return `Generation did not complete (${status})`;
}

/** A square profile-style portrait from a free-text description, via Higgsfield's Soul model. */
export async function generateAvatarImage(description: string): Promise<GenResult> {
  if (!ensureConfigured()) return { error: "HF_CREDENTIALS is not set" };
  try {
    const res = await higgsfield.subscribe("/v1/text2image/soul", {
      input: {
        prompt: `Professional portrait avatar, centered composition, ${description}, sharp focus, high detail`,
        width_and_height: SoulSize.SQUARE_1536x1536,
        quality: SoulQuality.SD,
        batch_size: BatchSize.SINGLE,
      },
      withPolling: true,
    });
    const url = res.images?.[0]?.url;
    if (res.status !== "completed" || !url) return { error: statusError(res.status) };
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Higgsfield request failed" };
  }
}
