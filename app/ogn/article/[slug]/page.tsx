import { prisma } from '@/lib/ogn/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Share2, Bookmark, ExternalLink, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { timeAgo, truncate } from '@/lib/ogn/utils';
import ArticleCard from '@/components/ogn/ArticleCard';
import type { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const article = await prisma.article.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!article) return { title: 'Article Not Found — OGN' };
  return {
    title: `${article.title} — OGN`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: article.imageUrl ? [article.imageUrl] : undefined,
      type: 'article',
    },
  };
}

export default async function ArticlePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const article = await prisma.article.findUnique({
    where: { slug: params.slug, isPublished: true },
    include: { category: true },
  }).catch(() => null);

  if (!article) notFound();

  // Increment view count
  await prisma.article.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // Fetch related stories
  const related = await prisma.article.findMany({
    where: {
      isPublished: true,
      categorySlug: article.categorySlug,
      id: { not: article.id },
    },
    orderBy: { publishedAt: 'desc' },
    take: 4,
  }).catch(() => []);

  // Calculate read time
  const wordCount = (article.content || article.summary).split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const categoryColors: Record<string, string> = {
    'science-tech': '#3b82f6',
    'environment': '#22c55e',
    'humanity': '#f59e0b',
    'health': '#ec4899',
    'education': '#8b5cf6',
    'sports': '#f97316',
    'business': '#14b8a6',
    'world': '#6366f1',
  };
  const catColor = categoryColors[article.categorySlug] || '#6366f1';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link href="/ogn" className="inline-flex items-center space-x-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to stories</span>
      </Link>

      {/* Article header */}
      <div className="mb-8">
        {/* Category badge */}
        <div className="mb-4">
          <Link href={`/ogn/category/${article.categorySlug}`}>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: catColor }}
            >
              {article.category?.name || article.categorySlug}
            </span>
          </Link>
        </div>

        {/* Title */}
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span>{article.sourceName}</span>
          <span>•</span>
          <span>{timeAgo(article.publishedAt || article.createdAt)}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {readTime} min read
          </span>
          {/* Sentiment */}
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">
              {Math.round(article.sentimentScore * 100)}% positive
            </span>
          </span>
        </div>
      </div>

      {/* Hero image */}
      {article.imageUrl && (
        <div className="relative rounded-2xl overflow-hidden mb-8 aspect-video">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* AI Summary callout */}
      <div className="glass rounded-2xl p-6 mb-8 border-l-4 border-l-ogn-gold">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-ogn-gold" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">AI Summary</span>
        </div>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{article.summary}</p>
      </div>

      {/* Full content */}
      {article.content && (
        <article className="prose prose-lg max-w-none dark:prose-invert">
          <div className="font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
            {article.content}
          </div>
        </article>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <button className="flex items-center gap-2 rounded-lg glass px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform">
          <Share2 className="h-4 w-4" /> Share
        </button>
        <button className="flex items-center gap-2 rounded-lg glass px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform">
          <Bookmark className="h-4 w-4" /> Bookmark
        </button>
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-2 text-sm text-ogn-teal hover:text-ogn-tealLight transition-colors"
        >
          <ExternalLink className="h-4 w-4" /> Read Original Article
        </a>
      </div>

      {/* Related stories */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Related Stories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {related.map((rel) => (
              <ArticleCard key={rel.id} article={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
