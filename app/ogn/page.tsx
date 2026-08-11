import { prisma } from '@/lib/ogn/db';
import HeroStory from '@/components/ogn/HeroStory';
import TrendingStories from '@/components/ogn/TrendingStories';
import CategoryGrid from '@/components/ogn/CategoryGrid';
import HopeIndex from '@/components/ogn/HopeIndex';
import ArticleList from '@/components/ogn/ArticleList';
import { Sparkles, Mail, ArrowRight } from 'lucide-react';

export default async function Home() {
  // Fetch data in parallel
  const [featured, fallback, trending, latest, categories] = await Promise.all([
    // Featured hero story
    prisma.article.findFirst({
      where: { isPublished: true, isFeatured: true },
      orderBy: { publishedAt: 'desc' },
    }).catch(() => null),

    // Fallback: any published article if no featured
    prisma.article.findFirst({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    }).catch(() => null),

    // Trending (top 10 recent)
    prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    }).catch(() => []),

    // Latest 12
    prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 12,
      skip: 0,
    }).catch(() => []),

    // Categories
    prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    }).catch(() => []),
  ]);

  // Use featured or fallback
  const heroArticle = featured || fallback;

  // Get article counts per category
  const categoryCounts: Record<string, number> = {};
  for (const cat of categories) {
    const count = await prisma.article.count({
      where: { categorySlug: cat.slug, isPublished: true },
    }).catch(() => 0);
    categoryCounts[cat.slug] = count;
  }

  // Calculate hope index from recent articles
  const recentForIndex = await prisma.article.findMany({
    where: { isPublished: true, publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    select: { sentimentScore: true, categorySlug: true },
  }).catch(() => []);

  const overall = recentForIndex.length > 0
    ? recentForIndex.reduce((sum, a) => sum + a.sentimentScore, 0) / recentForIndex.length
    : 0.5;

  const byCategoryMap: Record<string, number[]> = {};
  for (const a of recentForIndex) {
    if (!byCategoryMap[a.categorySlug]) byCategoryMap[a.categorySlug] = [];
    byCategoryMap[a.categorySlug].push(a.sentimentScore);
  }
  const byCategory = Object.entries(byCategoryMap).map(([category, scores]) => ({
    category,
    score: scores.reduce((s, v) => s + v, 0) / scores.length,
    count: scores.length,
  }));

  // Remove hero article from latest to avoid duplication
  const latestFiltered = latest.filter((a) => a.id !== heroArticle?.id).slice(0, 12);
  // Also filter from trending
  const trendingFiltered = trending.filter((a) => a.id !== heroArticle?.id).slice(0, 10);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      {heroArticle && <HeroStory article={heroArticle} />}

      {/* Hope Index */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <HopeIndex
          data={{
            overall,
            byCategory,
            trend: 2.5, // placeholder — would calculate from yesterday
            totalArticles: recentForIndex.length,
          }}
        />
      </section>

      {/* Trending */}
      {trendingFiltered.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <TrendingStories articles={trendingFiltered} />
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Explore Categories</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Good news from every corner of the world.</p>
          <CategoryGrid categories={categories} articleCounts={categoryCounts} />
        </section>
      )}

      {/* Latest Stories */}
      {latestFiltered.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Latest Stories</h2>
          <ArticleList articles={latestFiltered} />
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="glass-strong rounded-3xl p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-hope mx-auto mb-6">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Join the Good News Movement</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-8">
            Get a weekly dose of hope delivered to your inbox. No spam, no negativity — just good news.
          </p>
          <form className="flex items-center gap-3 max-w-md mx-auto">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pl-10 pr-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ogn-gold/30"
              />
            </div>
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-xl gradient-hope px-5 py-3 font-medium text-white hover:opacity-90 transition-opacity"
            >
              <span>Subscribe</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
