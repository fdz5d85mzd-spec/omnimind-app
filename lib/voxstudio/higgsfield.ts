import { higgsfield, config, SoulSize, SoulQuality, BatchSize, DoPModel } from "@higgsfield/client/v2";

// Lazily configure the SDK the first time it's actually used, from
// HF_CREDENTIALS ("KEY_ID:KEY_SECRET", from cloud.higgsfield.ai) -- avoids
// throwing at import time on deployments where the key isn't set yet.
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

/** One still image for a scene, via Higgsfield's Soul text-to-image model. */
export async function generateSceneImage(prompt: string): Promise<GenResult> {
  if (!ensureConfigured()) return { error: "HF_CREDENTIALS is not set" };
  try {
    const res = await higgsfield.subscribe("/v1/text2image/soul", {
      input: {
        prompt,
        width_and_height: SoulSize.LANDSCAPE_2048x1152,
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

/** Animates a still image into a short clip, via Higgsfield's DoP image-to-video model. */
export async function animateSceneImage(imageUrl: string, prompt: string): Promise<GenResult> {
  if (!ensureConfigured()) return { error: "HF_CREDENTIALS is not set" };
  try {
    const res = await higgsfield.subscribe("/v1/image2video/dop", {
      input: {
        model: DoPModel.TURBO,
        prompt,
        input_images: [{ type: "image_url", image_url: imageUrl }],
      },
      withPolling: true,
    });
    const url = res.video?.url;
    if (res.status !== "completed" || !url) return { error: statusError(res.status) };
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Higgsfield request failed" };
  }
}
