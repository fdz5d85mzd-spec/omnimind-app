import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { prisma } from '@/lib/ogn/db';

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    // Fetch published articles in the last 7 days
    let articles = await prisma.article.findMany({
      where: {
        isPublished: true,
        publishedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        sentimentScore: true,
        categorySlug: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    // Fallback to recent articles if 7 days has no records
    if (articles.length === 0) {
      articles = await prisma.article.findMany({
        where: {
          isPublished: true,
        },
        take: 100,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          sentimentScore: true,
          categorySlug: true,
          publishedAt: true,
          createdAt: true,
        },
      });
    }

    const totalArticles = articles.length;
    const overallSentimentSum = articles.reduce((acc, a) => acc + a.sentimentScore, 0);
    const overallSentimentAvg = totalArticles > 0 ? Number((overallSentimentSum / totalArticles).toFixed(3)) : 0.5;
    const hopeIndexPercentage = Math.round(overallSentimentAvg * 100);

    // Fetch categories for enriched breakdown
    const categories = await prisma.category.findMany({
      select: { slug: true, name: true, color: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.slug, c]));

    const categoryGroup: Record<string, { count: number; sentimentSum: number }> = {};

    articles.forEach((a) => {
      const slug = a.categorySlug || 'uncategorized';
      if (!categoryGroup[slug]) {
        categoryGroup[slug] = { count: 0, sentimentSum: 0 };
      }
      categoryGroup[slug].count += 1;
      categoryGroup[slug].sentimentSum += a.sentimentScore;
    });

    const categoryBreakdown = Object.entries(categoryGroup)
      .map(([slug, data]) => {
        const catInfo = categoryMap.get(slug);
        const avgSentiment = Number((data.sentimentSum / data.count).toFixed(3));
        return {
          categorySlug: slug,
          categoryName:
            catInfo?.name ||
            slug
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
          color: catInfo?.color || '#f59e0b',
          articleCount: data.count,
          avgSentiment,
          avgSentimentPercentage: Math.round(avgSentiment * 100),
        };
      })
      .sort((a, b) => b.articleCount - a.articleCount);

    // Trend: today vs yesterday
    const todayArticles = articles.filter((a) => {
      const date = a.publishedAt || a.createdAt;
      return date >= startOfToday;
    });

    const yesterdayArticles = articles.filter((a) => {
      const date = a.publishedAt || a.createdAt;
      return date >= startOfYesterday && date < startOfToday;
    });

    const todayCount = todayArticles.length;
    const todayAvgSentiment =
      todayCount > 0
        ? Number((todayArticles.reduce((acc, a) => acc + a.sentimentScore, 0) / todayCount).toFixed(3))
        : overallSentimentAvg;

    const yesterdayCount = yesterdayArticles.length;
    const yesterdayAvgSentiment =
      yesterdayCount > 0
        ? Number((yesterdayArticles.reduce((acc, a) => acc + a.sentimentScore, 0) / yesterdayCount).toFixed(3))
        : overallSentimentAvg;

    const sentimentDelta = Number((todayAvgSentiment - yesterdayAvgSentiment).toFixed(3));
    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (sentimentDelta > 0.01) direction = 'up';
    else if (sentimentDelta < -0.01) direction = 'down';

    return NextResponse.json({
      hopeIndex: overallSentimentAvg,
      hopeIndexPercentage,
      totalArticles,
      period: '7d',
      trend: {
        todayCount,
        todayAvgSentiment,
        yesterdayCount,
        yesterdayAvgSentiment,
        sentimentDelta,
        direction,
      },
      categoryBreakdown,
    });
  } catch (error: any) {
    console.error('[Hope Index GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate hope index', details: error.message },
      { status: 500 }
    );
  }
}
