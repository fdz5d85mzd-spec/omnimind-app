import ArticleCard, { ArticleCardProps } from './ArticleCard';

export interface ArticleListProps {
  title?: string;
  articles: ArticleCardProps['article'][];
}

export default function ArticleList({ title, articles }: ArticleListProps) {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12 glass rounded-2xl p-8">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No articles found. Check back soon for positive news!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
          {title}
        </h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <ArticleCard
            key={article.id || article.slug || index}
            article={article}
          />
        ))}
      </div>
    </div>
  );
}
