import { prisma } from '@/lib/ogn/db';
import { CollectedArticle } from './types';

// ─── Calculate Jaccard Similarity ────────────────────────────
export function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const tokenize = (text: string): Set<string> => {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);
    return new Set(words);
  };

  const set1 = tokenize(text1);
  const set2 = tokenize(text2);

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersectionCount = 0;
  for (const word of set1) {
    if (set2.has(word)) {
      intersectionCount++;
    }
  }

  const unionSize = new Set([...set1, ...set2]).size;
  if (unionSize === 0) return 0;

  return intersectionCount / unionSize;
}

// ─── Deduplicate Articles ────────────────────────────────────
export async function deduplicate(
  articles: CollectedArticle[],
  threshold = 0.7
): Promise<CollectedArticle[]> {
  if (!articles || articles.length === 0) return [];

  // Fetch recent articles from DB for duplicate checking
  let dbArticles: Array<{ title: string }> = [];
  try {
    dbArticles = await prisma.article.findMany({
      select: { title: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  } catch (error: any) {
    console.error('[Dedup] Error fetching DB articles:', error.message);
  }

  const deduplicated: CollectedArticle[] = [];

  for (const article of articles) {
    let isDuplicate = false;

    // 1. Compare with articles already accepted in this batch
    for (const accepted of deduplicated) {
      const sim = calculateSimilarity(article.title, accepted.title);
      if (sim >= threshold) {
        console.log(`[Dedup] Batch duplicate found (${sim.toFixed(2)}): "${article.title}" vs "${accepted.title}"`);
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) continue;

    // 2. Compare with recent articles from DB
    for (const dbArt of dbArticles) {
      const sim = calculateSimilarity(article.title, dbArt.title);
      if (sim >= threshold) {
        console.log(`[Dedup] DB duplicate found (${sim.toFixed(2)}): "${article.title}" vs "${dbArt.title}"`);
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      deduplicated.push(article);
    }
  }

  console.log(`[Dedup] Filtered ${articles.length - deduplicated.length} duplicate(s). Kept ${deduplicated.length}/${articles.length}.`);
  return deduplicated;
}
