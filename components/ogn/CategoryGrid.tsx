import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface CategoryGridProps {
  categories?: Category[];
  articleCounts?: Record<string, number>;
}

const DEFAULT_CATEGORIES: Category[] = [
  { slug: 'science-tech', name: 'Science & Tech', description: 'Breakthroughs, discoveries, and innovation changing our future.', icon: '🚀', color: '#3b82f6' },
  { slug: 'environment', name: 'Environment', description: 'Conservation wins, renewable energy, and nature restoration.', icon: '🌱', color: '#22c55e' },
  { slug: 'humanity', name: 'Humanity', description: 'Acts of kindness, community strength, and inspiring human stories.', icon: '🤝', color: '#f59e0b' },
  { slug: 'health', name: 'Health & Wellness', description: 'Medical milestones, wellness discoveries, and mental health progress.', icon: '❤️', color: '#ec4899' },
  { slug: 'education', name: 'Education', description: 'Empowering minds, open learning, and educational breakthroughs.', icon: '🎓', color: '#8b5cf6' },
  { slug: 'sports', name: 'Sports', description: 'Sportsmanship, heroic comebacks, and unifying athletic triumphs.', icon: '🏆', color: '#f97316' },
  { slug: 'business', name: 'Business & Economy', description: 'Ethical enterprise, green technology, and positive economic growth.', icon: '📈', color: '#14b8a6' },
  { slug: 'world', name: 'World Peace & Progress', description: 'Global cooperation, historic agreements, and positive global news.', icon: '🌍', color: '#6366f1' },
];

const CATEGORY_TOP_BORDERS: Record<string, string> = {
  'science-tech': 'border-t-4 border-t-[#3b82f6]',
  'environment': 'border-t-4 border-t-[#22c55e]',
  'humanity': 'border-t-4 border-t-[#f59e0b]',
  'health': 'border-t-4 border-t-[#ec4899]',
  'education': 'border-t-4 border-t-[#8b5cf6]',
  'sports': 'border-t-4 border-t-[#f97316]',
  'business': 'border-t-4 border-t-[#14b8a6]',
  'world': 'border-t-4 border-t-[#6366f1]',
};

export default function CategoryGrid({ categories, articleCounts = {} }: CategoryGridProps) {
  const displayCategories = (categories && categories.length > 0) ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayCategories.map((cat) => {
        const topBorder = CATEGORY_TOP_BORDERS[cat.slug] || 'border-t-4 border-t-amber-500';
        const defaultIcon = DEFAULT_CATEGORIES.find((d) => d.slug === cat.slug)?.icon || '✨';
        const count = articleCounts[cat.slug] ?? 0;

        return (
          <Link
            key={cat.slug}
            href={`/ogn/category/${cat.slug}`}
            className="block group h-full"
          >
            <div
              className={`glass card-hover rounded-2xl p-6 flex flex-col justify-between h-full border-x border-b border-white/30 dark:border-white/10 ${topBorder} transition-all duration-300 hover:shadow-xl`}
            >
              <div>
                {/* Emoji Icon & Count Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 w-14 h-14 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    {cat.icon || defaultIcon}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Newspaper className="h-3 w-3" />
                    {count} {count === 1 ? 'story' : 'stories'}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-ogn-gold transition-colors">
                  {cat.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {cat.description || `Read inspiring news about ${cat.name.toLowerCase()}.`}
                </p>
              </div>

              {/* Read More Link indicator */}
              <div className="flex items-center text-xs font-semibold text-ogn-teal group-hover:text-ogn-tealLight transition-colors pt-2">
                <span>Explore stories</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
