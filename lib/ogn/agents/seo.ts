import { prisma } from '@/lib/ogn/db';
import { callLLM } from './llm';

export interface SEOInputArticle {
  id?: string;
  title: string;
  summary: string;
  content?: string | null;
  slug: string;
  imageUrl?: string | null;
  publishedAt?: Date | string | null;
  sourceName?: string | null;
}

export interface SEOResult {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  jsonLdSchema: string;
}

// ─── Generate SEO Metadata ───────────────────────────────────
export async function generateSEO(article: SEOInputArticle): Promise<SEOResult> {
  const systemPrompt = `You are an expert SEO specialist for "Only Good News" (OGN).
Analyze the article provided and generate optimized SEO metadata.

Requirements:
- metaTitle: Catchy, search-optimized title (maximum 60 characters).
- metaDescription: Informative summary for search engine results (maximum 160 characters).
- keywords: Array of 5 to 8 relevant keywords or search keyphrases.

Return ONLY valid JSON matching this structure:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "keywords": ["...", "..."]
}`;

  const userPrompt = `Title: ${article.title}
Summary: ${article.summary}
Content Excerpt: ${(article.content || '').substring(0, 1500)}`;

  let metaTitle = article.title;
  let metaDescription = article.summary;
  let keywords: string[] = [];

  try {
    const response = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 500, json: true }
    );

    let parsed: any = {};
    try {
      parsed = JSON.parse(response.content);
    } catch {
      const match = response.content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (parsed.metaTitle) metaTitle = String(parsed.metaTitle).trim();
    if (parsed.metaDescription) metaDescription = String(parsed.metaDescription).trim();
    if (Array.isArray(parsed.keywords)) {
      keywords = parsed.keywords.map((k: any) => String(k).trim()).filter(Boolean);
    }
  } catch (error: any) {
    console.error('[SEO] Error generating SEO metadata with LLM:', error.message);
  }

  // Enforce max lengths
  if (metaTitle.length > 60) {
    metaTitle = metaTitle.substring(0, 57).trim() + '...';
  }

  if (metaDescription.length > 160) {
    metaDescription = metaDescription.substring(0, 157).trim() + '...';
  }

  // Ensure 5-8 keywords
  if (keywords.length < 5) {
    const titleWords = article.title
      .split(/\s+/)
      .map((w) => w.replace(/[^\w]/g, ''))
      .filter((w) => w.length > 3);
    const defaults = ['good news', 'positive news', 'hopeful news', 'inspiring stories', 'only good news'];
    const merged = Array.from(new Set([...keywords, ...titleWords, ...defaults]));
    keywords = merged.slice(0, 8);
  } else if (keywords.length > 8) {
    keywords = keywords.slice(0, 8);
  }

  // Manually build JSON-LD NewsArticle schema
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ogn.news';
  const articleUrl = `${siteUrl}/article/${article.slug}`;
  const pubDate = article.publishedAt
    ? new Date(article.publishedAt).toISOString()
    : new Date().toISOString();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: metaTitle,
    description: metaDescription,
    image: article.imageUrl ? [article.imageUrl] : [],
    datePublished: pubDate,
    dateModified: pubDate,
    author: {
      '@type': 'Organization',
      name: article.sourceName || 'Only Good News',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Only Good News',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  };

  const jsonLdSchema = JSON.stringify(jsonLd, null, 2);

  return {
    metaTitle,
    metaDescription,
    keywords,
    jsonLdSchema,
  };
}

// ─── Apply SEO to DB Article ────────────────────────────────
export async function applySEO(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    throw new Error(`Article not found with ID: ${articleId}`);
  }

  const seoData = await generateSEO(article);

  const updatedArticle = await prisma.article.update({
    where: { id: articleId },
    data: {
      metaTitle: seoData.metaTitle,
      metaDescription: seoData.metaDescription,
      keywords: seoData.keywords,
      jsonLdSchema: seoData.jsonLdSchema,
    },
  });

  console.log(`[SEO] Applied SEO metadata to article ${articleId} ("${seoData.metaTitle}")`);
  return updatedArticle;
}
