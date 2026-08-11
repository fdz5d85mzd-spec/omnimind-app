import { prisma } from '@/lib/ogn/db';

export interface TrackEventOptions {
  articleId?: string | null;
  userId?: string | null;
  sessionId: string;
  url: string;
  referrer?: string | null;
  userAgent?: string | null;
  metadata?: any;
  ipAddress?: string | null;
}

/**
 * Inserts an AnalyticsEvent and updates article view counts when applicable.
 */
export async function trackEvent(type: string, data: TrackEventOptions) {
  try {
    const event = await prisma.analyticsEvent.create({
      data: {
        type,
        articleId: data.articleId || null,
        userId: data.userId || null,
        sessionId: data.sessionId,
        url: data.url,
        referrer: data.referrer || null,
        userAgent: data.userAgent || null,
        metadata: data.metadata ? (typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata)) : null,
        ipAddress: data.ipAddress || null,
      },
    });

    if (data.articleId && (type === 'article_view' || type === 'pageview')) {
      await prisma.article.update({
        where: { id: data.articleId },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});
    }

    return event;
  } catch (error) {
    console.error('[analytics] Error tracking event:', error);
    return null;
  }
}

/**
 * Convenience wrapper for tracking page views.
 */
export async function trackPageView(
  url: string,
  sessionId: string,
  userId?: string | null,
  options?: Partial<Omit<TrackEventOptions, 'url' | 'sessionId' | 'userId'>>
) {
  const isArticle = options?.articleId || url.includes('/article/');
  const type = isArticle ? 'article_view' : 'pageview';

  return trackEvent(type, {
    url,
    sessionId,
    userId: userId || null,
    articleId: options?.articleId || null,
    referrer: options?.referrer || null,
    userAgent: options?.userAgent || null,
    metadata: options?.metadata || null,
    ipAddress: options?.ipAddress || null,
  });
}

/**
 * Aggregates analytics events for a given day.
 */
export async function getDailyStats(dateInput: Date | string) {
  const targetDate = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const existingDaily = await prisma.dailyAnalytics.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const events = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      type: true,
      sessionId: true,
      articleId: true,
      userId: true,
    },
  });

  const pageViews = events.length;
  const uniqueVisitorsSet = new Set(events.map((e) => e.sessionId));
  const uniqueVisitors = uniqueVisitorsSet.size;
  const articleViews = events.filter((e) => e.type === 'article_view' || e.articleId !== null).length;
  const newUsers = events.filter((e) => e.type === 'user_signup').length;
  const likes = events.filter((e) => e.type === 'like').length;
  const comments = events.filter((e) => e.type === 'comment').length;
  const shares = events.filter((e) => e.type === 'share').length;

  return {
    id: existingDaily?.id || `computed-${startOfDay.toISOString().split('T')[0]}`,
    date: startOfDay,
    pageViews: Math.max(pageViews, existingDaily?.pageViews || 0),
    uniqueVisitors: Math.max(uniqueVisitors, existingDaily?.uniqueVisitors || 0),
    articleViews: Math.max(articleViews, existingDaily?.articleViews || 0),
    newUsers: Math.max(newUsers, existingDaily?.newUsers || 0),
    likes: Math.max(likes, existingDaily?.likes || 0),
    comments: Math.max(comments, existingDaily?.comments || 0),
    shares: Math.max(shares, existingDaily?.shares || 0),
  };
}

/**
 * Aggregates analytics events across a date range.
 */
export async function getDateRangeStats(startDateInput: Date | string, endDateInput: Date | string) {
  const start = typeof startDateInput === 'string' ? new Date(startDateInput) : startDateInput;
  const end = typeof endDateInput === 'string' ? new Date(endDateInput) : endDateInput;

  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  const totalPageViews = events.length;
  const uniqueVisitors = new Set(events.map((e) => e.sessionId)).size;
  const articleViews = events.filter((e) => e.type === 'article_view' || e.articleId !== null).length;

  const dailyMap: Record<string, { pageViews: number; uniqueVisitors: Set<string>; articleViews: number }> = {};

  const curr = new Date(start);
  while (curr <= end) {
    const dayStr = curr.toISOString().split('T')[0];
    dailyMap[dayStr] = { pageViews: 0, uniqueVisitors: new Set(), articleViews: 0 };
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  events.forEach((event) => {
    const dayStr = new Date(event.createdAt).toISOString().split('T')[0];
    if (dailyMap[dayStr]) {
      dailyMap[dayStr].pageViews += 1;
      dailyMap[dayStr].uniqueVisitors.add(event.sessionId);
      if (event.type === 'article_view' || event.articleId) {
        dailyMap[dayStr].articleViews += 1;
      }
    }
  });

  const daily = Object.keys(dailyMap).sort().map((dateStr) => ({
    date: dateStr,
    pageViews: dailyMap[dateStr].pageViews,
    uniqueVisitors: dailyMap[dateStr].uniqueVisitors.size,
    articleViews: dailyMap[dateStr].articleViews,
  }));

  return {
    totals: {
      pageViews: totalPageViews,
      uniqueVisitors,
      articleViews,
    },
    daily,
  };
}

/**
 * Retrieves top articles by views from AnalyticsEvent or Article table.
 */
export async function getPopularArticles(limit: number = 10) {
  const popularEvents = await prisma.analyticsEvent.groupBy({
    by: ['articleId'],
    where: {
      articleId: { not: null },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
  });

  const eventArticleIds = popularEvents
    .map((e) => e.articleId)
    .filter((id): id is string => Boolean(id));

  if (eventArticleIds.length > 0) {
    const articles = await prisma.article.findMany({
      where: { id: { in: eventArticleIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        categorySlug: true,
        publishedAt: true,
      },
    });

    const articleMap = new Map(articles.map((a) => [a.id, a]));
    return popularEvents.map((item) => {
      const art = articleMap.get(item.articleId!);
      return {
        id: item.articleId!,
        title: art?.title || 'Unknown Article',
        slug: art?.slug || '',
        views: item._count.id,
        dbViewCount: art?.viewCount || 0,
        categorySlug: art?.categorySlug || 'general',
      };
    });
  }

  const topArticles = await prisma.article.findMany({
    orderBy: { viewCount: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      categorySlug: true,
    },
  });

  return topArticles.map((art) => ({
    id: art.id,
    title: art.title,
    slug: art.slug,
    views: art.viewCount,
    dbViewCount: art.viewCount,
    categorySlug: art.categorySlug,
  }));
}

/**
 * Groups analytics traffic sources by referrer domain over the specified number of days.
 */
export async function getTrafficSources(days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: cutoffDate },
    },
    select: {
      referrer: true,
    },
  });

  const total = events.length;
  const sourcesMap: Record<string, number> = {};

  events.forEach((e) => {
    let source = 'Direct / Organic';
    if (e.referrer) {
      try {
        const url = new URL(e.referrer);
        source = url.hostname.replace('www.', '');
      } catch (_) {
        source = e.referrer;
      }
    }
    sourcesMap[source] = (sourcesMap[source] || 0) + 1;
  });

  const sources = Object.entries(sourcesMap)
    .map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return sources.length > 0 ? sources : [{ source: 'Direct / Organic', count: 0, percentage: 100 }];
}
