import Link from 'next/link';
import { timeAgo } from '@/lib/ogn/utils';

export interface ArticleCardProps {
  article: {
    id?: string;
    title: string;
    slug: string;
    summary: string;
    imageUrl?: string | null;
    categorySlug: string;
    sourceName: string;
    sentimentScore?: number;
    publishedAt?: Date | string | null;
  };
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'science-tech': { bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30', text: 'text-blue-600', label: 'Science & Tech' },
  'environment': { bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', text: 'text-emerald-600', label: 'Environment' },
  'humanity': { bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', text: 'text-amber-600', label: 'Humanity' },
  'health': { bg: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30', text: 'text-pink-600', label: 'Health' },
  'education': { bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30', text: 'text-purple-600', label: 'Education' },
  'sports': { bg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30', text: 'text-orange-600', label: 'Sports' },
  'business': { bg: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30', text: 'text-teal-600', label: 'Business' },
  'world': { bg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30', text: 'text-indigo-600', label: 'World' },
};

export function getCategoryStyle(slug: string) {
  return (
    CATEGORY_STYLES[slug] || {
      bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      text: 'text-amber-600',
      label: slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'General',
    }
  );
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const { title, slug, summary, imageUrl, categorySlug, sourceName, publishedAt } = article;
  const category = getCategoryStyle(categorySlug);
  const formattedTime = publishedAt ? timeAgo(publishedAt) : '';

  const displayImage = imageUrl || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80`;

  return (
    <Link href={`/ogn/article/${slug}`} className="block group h-full">
      <div className="glass card-hover rounded-2xl overflow-hidden border border-white/30 dark:border-white/10 flex flex-col h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        {/* Image Container */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
          <img
            src={displayImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${category.bg}`}>
              {category.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 justify-between">
          <div>
            {/* Title - 2 lines */}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-ogn-gold dark:group-hover:text-ogn-gold transition-colors duration-200 mb-2 leading-snug">
              {title}
            </h3>

            {/* Summary - 2 lines */}
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4">
              {summary}
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="truncate max-w-[140px] font-semibold text-slate-700 dark:text-slate-300">
              {sourceName}
            </span>
            {formattedTime && (
              <time dateTime={publishedAt ? new Date(publishedAt).toISOString() : undefined}>
                {formattedTime}
              </time>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
