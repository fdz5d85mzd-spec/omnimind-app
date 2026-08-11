import ArticleCard, { ArticleCardProps } from './ArticleCard';
import { TrendingUp } from 'lucide-react';

export interface TrendingStoriesProps {
  articles: ArticleCardProps['article'][];
}

export default function TrendingStories({ articles }: TrendingStoriesProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center space-x-2.5 mb-6">
        <div className="p-2 rounded-xl bg-amber-500/10 text-ogn-gold">
          <TrendingUp className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Trending Now
        </h2>
      </div>

      {/* Netflix Horizontal Scrolling Container */}
      <div className="netflix-row scrollbar-hide py-2 px-1 -mx-1">
        {articles.map((article, index) => (
          <div
            key={article.id || article.slug || index}
            className="w-[280px] sm:w-[320px] md:w-[340px] flex-shrink-0"
          >
            <ArticleCard article={article} />
          </div>
        ))}
      </div>
    </div>
  );
}
