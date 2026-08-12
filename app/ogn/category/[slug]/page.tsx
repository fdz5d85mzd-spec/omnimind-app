import { prisma } from '@/lib/ogn/db';
import { notFound } from 'next/navigation';
import ArticleList from '@/components/ogn/ArticleList';
import type { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const category = await prisma.category.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!category) return { title: 'Category Not Found — OGN' };
  return {
    title: `${category.name} — OGN`,
    description: category.description || `Good news about ${category.name.toLowerCase()}`,
  };
}

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  }).catch(() => null);

  if (!category) notFound();

  const articles = await prisma.article.findMany({
    where: { categorySlug: params.slug, isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 24,
  }).catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          {category.icon && <span className="text-4xl">{category.icon}</span>}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{category.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{category.description}</p>
          </div>
        </div>
        <div className="h-1 w-full rounded-full" style={{ backgroundColor: category.color }} />
      </div>

      {/* Articles */}
      {articles.length > 0 ? (
        <ArticleList articles={articles} />
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            No stories in this category yet. The AI agents are collecting more — check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
