import RSSParser from 'rss-parser';
import { prisma } from '@/lib/ogn/db';
import { CollectedArticle } from './types';

const parser = new RSSParser({
  timeout: 10000,
  headers: { 'User-Agent': 'OGN-Bot/1.0' },
});

// ─── Collection Agent ─────────────────────────────────────────
// Fetches news from RSS feeds configured in the Source table.
// Returns a list of candidate articles for verification.

export async function runCollection(): Promise<CollectedArticle[]> {
  const sources = await prisma.source.findMany({
    where: { isActive: true, feedUrl: { not: null } },
  });

  console.log(`[Collection] Fetching from ${sources.length} sources...`);
  const allArticles: CollectedArticle[] = [];

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.feedUrl!);
      console.log(`[Collection] ${source.name}: ${feed.items.length} items`);

      for (const item of feed.items.slice(0, 10)) {
        // Skip if already exists
        const existing = await prisma.article.findUnique({
          where: { slug: slugifyItem(item.title || "") },
        });
        if (existing) continue;

        const content = item.content || item.contentSnippet || item.summary || '';
        allArticles.push({
          title: item.title || "Untitled",
          url: item.link || '',
          sourceName: source.name,
          content: content.substring(0, 5000), // Limit content length
          publishedAt: item.isoDate || item.pubDate,
          imageUrl: extractImage(item),
          categorySlug: guessCategory(item.title || "", content),
        });
      }

      // Update last fetched
      await prisma.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: new Date() },
      });
    } catch (error: any) {
      console.error(`[Collection] Error fetching ${source.name}:`, error.message);
    }
  }

  console.log(`[Collection] Total collected: ${allArticles.length}`);
  return allArticles;
}

function slugifyItem(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function extractImage(item: any): string | undefined {
  // Try media:content, media:thumbnail, enclosure, or og:image
  if (item.media?.content?.[0]?.$?.url) return item.media.content[0].$.url;
  if (item.media?.thumbnail?.[0]?.$?.url) return item.media.thumbnail[0].$.url;
  if (item.enclosure?.url) return item.enclosure.url;
  // Try to find img in content
  const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];
  return undefined;
}

function guessCategory(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase();
  const categories: Record<string, string[]> = {
    'science-tech': ['science', 'technology', 'tech', 'space', 'research', 'discovery', 'innovation', 'ai', 'robot'],
    'environment': ['climate', 'environment', 'nature', 'wildlife', 'ocean', 'forest', 'green', 'conservation', 'pollution'],
    'humanity': ['human', 'kindness', 'charity', 'volunteer', 'community', 'help', 'rescue', 'hero', 'good samaritan'],
    'health': ['health', 'medical', 'medicine', 'wellness', 'fitness', 'mental health', 'cure', 'treatment', 'vaccine'],
    'education': ['education', 'school', 'student', 'teacher', 'learning', 'scholarship', 'literacy', 'university'],
    'sports': ['sport', 'football', 'olympic', 'athlete', 'championship', 'victory', 'team', 'coach'],
    'business': ['business', 'economy', 'startup', 'entrepreneur', 'market', 'growth', 'innovation', 'investment'],
    'world': ['world', 'global', 'country', 'nation', 'international', 'peace', 'diplomacy', 'treaty'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => text.includes(kw))) return category;
  }
  return 'world';
}
