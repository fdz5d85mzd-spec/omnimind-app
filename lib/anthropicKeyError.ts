// The Anthropic SDK sends the API key as a raw HTTP header value; if the
// deployed ANTHROPIC_API_KEY has a stray non-Latin1 character in it (e.g. a
// copy-paste from a source that turned a hyphen into a "smart" bullet or
// dash), the underlying fetch() throws a TypeError from deep inside the SDK
// before the request ever reaches Anthropic's servers -- surfacing as a
// cryptic "Cannot convert argument to a ByteString..." message with no hint
// of what actually broke. Detected and confirmed against the real SDK
// (see lib/social/scriptWriter.ts and lib/voxstudio/director.ts, its two
// callers): a bullet character in the key reproduces this exact error.
export function isCorruptedApiKeyError(err: unknown): boolean {
  return err instanceof TypeError && /ByteString/i.test(err.message);
}

export const CORRUPTED_API_KEY_MESSAGE =
  "ANTHROPIC_API_KEY has an invalid character in it (likely from a copy-paste) and is being rejected before the request can even be sent — re-copy the key from the Anthropic console and reset it in Vercel.";
