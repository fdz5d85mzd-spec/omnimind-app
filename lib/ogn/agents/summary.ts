import { callLLM } from './llm';
import { RawArticle, ArticleSummary } from './types';

// ─── Summarizer Agent ─────────────────────────────────────────
// Rewrites raw articles into positive, solutions-oriented
// summaries while retaining accuracy.

const SUMMARY_PROMPT = `You are a journalist for Only Good News (OGN), a news platform focused exclusively on positive, constructive, and inspiring news.

Given a raw article, rewrite it into an engaging, positive summary.

Rules:
1. Preserve factual accuracy — do NOT fabricate details.
2. Focus on solutions, progress, hope, human resilience, or scientific breakthroughs.
3. Keep the tone warm, clear, and professional.
4. Provide a catchy, constructive title.
5. The summary should be 2-4 sentences (around 60-100 words).

Format your response as a JSON object with keys "title", "summary", and "category".
Category MUST be one of: "technology", "climate", "health", "community", "culture", "science", "business".`;

export async function summarizeArticle(
  article: RawArticle,
  targetCategory?: string
): Promise<ArticleSummary> {
  const prompt = `${SUMMARY_PROMPT}

Target Category: ${targetCategory || 'general'}
Original Title: ${article.title}
Original Source: ${article.sourceName}
Content: ${article.content.substring(0, 3000)}`;

  try {
    const response = await callLLM(
      [
        { role: 'system', content: SUMMARY_PROMPT },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.7, json: true }
    );

    // Extract JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse summary JSON from LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      title: parsed.title || article.title,
      summary: parsed.summary || article.content.substring(0, 200),
      category: parsed.category || targetCategory || 'community',
    };
  } catch (error: any) {
    console.error(`[Summarizer] Error processing "${article.title}":`, error.message);
    // Fallback if LLM fails
    return {
      title: article.title,
      summary: article.content.substring(0, 200) + '...',
      category: targetCategory || 'community',
    };
  }
}

// Helper to batch-summarize
export async function summarizeBatch(
  articles: Array<{ article: RawArticle; category: string }>
): Promise<Array<{ article: RawArticle; summary: ArticleSummary }>> {
  const results: Array<{ article: RawArticle; summary: ArticleSummary }> = [];

  for (const item of articles) {
    const summary = await summarizeArticle(item.article, item.category);
    results.push({ article: item.article, summary });
  }

  return results;
}

// Hope Index calculator
export interface HopeIndexData {
  overall: number; // 0-1
  byCategory: Record<string, number>;
  trend: number; // percentage change vs yesterday
}

export function calculateHopeIndex(
  articles: Array<{ sentimentScore: number; categorySlug: string; publishedAt?: Date | null }>
): HopeIndexData {
  if (articles.length === 0) {
    return { overall: 0.5, byCategory: {}, trend: 0 };
  }

  const overall = articles.reduce((sum, a) => sum + a.sentimentScore, 0) / articles.length;
  const byCategory: Record<string, number> = {};
  const categoryArticles = articles.filter((a) => a.categorySlug);
  const categoryGroups: Record<string, typeof articles> = {};
  for (const a of categoryArticles) {
    if (!categoryGroups[a.categorySlug]) categoryGroups[a.categorySlug] = [];
    categoryGroups[a.categorySlug].push(a);
  }
  for (const [cat, items] of Object.entries(categoryGroups)) {
    byCategory[cat] = items.reduce((sum, a) => sum + a.sentimentScore, 0) / items.length;
  }

  // Trend: compare today's avg to yesterday's avg
  const today = articles.filter((a) => a.publishedAt && a.publishedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000));
  const yesterday = articles.filter((a) =>
    a.publishedAt &&
    a.publishedAt >= new Date(Date.now() - 48 * 60 * 60 * 1000) &&
    a.publishedAt < new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  const todayAvg = today.length > 0 ? today.reduce((s, a) => s + a.sentimentScore, 0) / today.length : 0.5;
  const yesterdayAvg = yesterday.length > 0 ? yesterday.reduce((s, a) => s + a.sentimentScore, 0) / yesterday.length : 0.5;
  const trend = yesterdayAvg > 0 ? ((todayAvg - yesterdayAvg) / yesterdayAvg) * 100 : 0;

  return { overall, byCategory, trend };
}
