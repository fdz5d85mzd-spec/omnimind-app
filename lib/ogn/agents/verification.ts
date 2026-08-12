import { callLLM } from "./llm";
import { CollectedArticle, VerificationResult } from "./types";

const POSITIVE_TERMS = [
  "breakthrough",
  "achieve",
  "award",
  "cure",
  "discovery",
  "innovation",
  "renewable",
  "restored",
  "recovery",
  "rescued",
  "saved",
  "solution",
  "successful",
  "record",
  "progress",
  "improve",
  "volunteer",
  "charity",
  "peace",
  "scholarship",
  "conservation",
  "clean energy",
  "reforestation",
];
const NEGATIVE_TERMS = [
  "killed",
  "death",
  "war ",
  "attack",
  "murder",
  "scandal",
  "corruption",
  "disaster",
  "earthquake",
  "flood",
  "outbreak",
  "crisis",
  "collapse",
];

function deterministicVerification(
  article: CollectedArticle,
): VerificationResult {
  const text = `${article.title} ${article.content}`.toLowerCase();
  const positiveHits = POSITIVE_TERMS.filter((term) =>
    text.includes(term),
  ).length;
  const negativeHits = NEGATIVE_TERMS.filter((term) =>
    text.includes(term),
  ).length;
  const isPositive = positiveHits >= 1 && negativeHits === 0;
  return {
    isPositive,
    sentimentScore: isPositive
      ? Math.min(0.9, 0.66 + positiveHits * 0.04)
      : 0.35,
    credibilityScore: article.url.startsWith("https://") ? 0.72 : 0.5,
    reason: isPositive
      ? `Deterministic safety check passed (${positiveHits} constructive signals)`
      : "Deterministic safety check found insufficient positive focus or a blocked topic",
    category: article.categorySlug || "world",
  };
}

// ─── Verification Agent ───────────────────────────────────────
// Uses LLM to analyze sentiment and credibility of articles.
// Only positive news passes the filter — this is the core of OGN.

export async function verifyArticle(
  article: CollectedArticle,
): Promise<VerificationResult> {
  const systemPrompt = `You are the Verification Agent for "Only Good News" (OGN), a platform that publishes only positive, hopeful, and uplifting news.

Your job: analyze a news article and determine if it is genuinely positive.

Rules:
- POSITIVE: stories about kindness, scientific breakthroughs, environmental progress, humanitarian achievements, medical advances, education milestones, sportsmanship, community building, rescue stories, peace initiatives, innovation for good
- NOT POSITIVE: stories about war, crime, death, tragedy, political conflict, natural disasters (even if there's a "silver lining"), scandal, corruption, economic decline, disease outbreaks
- Mixed stories (e.g. "disaster struck but people helped") are NOT positive enough — we want the focus to be on the good news itself

Also assess credibility: is this from a reputable source? Is the claim reasonable? Is it factual or opinion?

Return ONLY valid JSON:
{
  "isPositive": boolean,
  "sentimentScore": number,  // 0-1, higher = more positive
  "credibilityScore": number, // 0-1, higher = more credible
  "reason": string,           // one sentence explanation
  "category": string          // best category slug: science-tech, environment, humanity, health, education, sports, business, world
}`;

  const userPrompt = `Analyze this article:

Title: ${article.title}
Source: ${article.sourceName}
Content (first 2000 chars): ${article.content.substring(0, 2000)}`;

  try {
    const response = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 500, json: true },
    );

    const result = JSON.parse(response.content);
    return {
      isPositive: result.isPositive ?? false,
      sentimentScore: Math.max(0, Math.min(1, result.sentimentScore ?? 0)),
      credibilityScore: Math.max(
        0,
        Math.min(1, result.credibilityScore ?? 0.5),
      ),
      reason: result.reason || "No reason provided",
      category: result.category || "world",
    };
  } catch (error: any) {
    console.error("[Verification] LLM error:", error.message);
    // Keep OGN operational when an AI provider is temporarily unavailable,
    // while remaining conservative: any blocked negative topic rejects.
    return deterministicVerification(article);
  }
}

// Batch verify articles — returns only the ones that pass
export async function verifyBatch(
  articles: CollectedArticle[],
): Promise<{ article: CollectedArticle; verification: VerificationResult }[]> {
  const results: {
    article: CollectedArticle;
    verification: VerificationResult;
  }[] = [];

  for (const article of articles) {
    const verification = await verifyArticle(article);
    if (
      verification.isPositive &&
      verification.sentimentScore >= 0.6 &&
      verification.credibilityScore >= 0.5
    ) {
      results.push({ article, verification });
      console.log(
        `[Verification] ✓ ${article.title.substring(0, 60)} (sentiment: ${verification.sentimentScore})`,
      );
    } else {
      console.log(
        `[Verification] ✗ ${article.title.substring(0, 60)} (${verification.reason})`,
      );
    }
  }

  console.log(
    `[Verification] ${results.length}/${articles.length} articles passed`,
  );
  return results;
}
