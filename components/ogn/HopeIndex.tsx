'use client';

import { TrendingUp, TrendingDown, Heart, Sparkles, Activity } from 'lucide-react';

export interface HopeIndexProps {
  data?: {
    overall?: number;
    trend?: number;
    totalArticles?: number;
    byCategory?: Array<{
      category: string;
      score: number;
      count?: number;
    }>;
  };
}

const CATEGORY_NAMES: Record<string, string> = {
  'science-tech': 'Science & Tech',
  'environment': 'Environment',
  'humanity': 'Humanity',
  'health': 'Health',
  'education': 'Education',
  'sports': 'Sports',
  'business': 'Business',
  'world': 'World',
};

const CATEGORY_BAR_COLORS: Record<string, string> = {
  'science-tech': 'bg-blue-500',
  'environment': 'bg-emerald-500',
  'humanity': 'bg-amber-500',
  'health': 'bg-pink-500',
  'education': 'bg-purple-500',
  'sports': 'bg-orange-500',
  'business': 'bg-teal-500',
  'world': 'bg-indigo-500',
};

export default function HopeIndex({ data }: HopeIndexProps) {
  const rawScore = data?.overall ?? 0.85;
  const percentage = Math.min(100, Math.max(0, Math.round(rawScore <= 1 ? rawScore * 100 : rawScore)));
  const trend = data?.trend ?? 2.4;
  const isPositiveTrend = trend >= 0;

  const defaultCategories = [
    { category: 'science-tech', score: 0.88 },
    { category: 'environment', score: 0.82 },
    { category: 'humanity', score: 0.91 },
    { category: 'health', score: 0.85 },
  ];

  const categories = data?.byCategory && data.byCategory.length > 0
    ? data.byCategory.slice(0, 6)
    : defaultCategories;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative glass-strong rounded-3xl p-6 sm:p-8 border border-white/40 dark:border-white/10 shadow-2xl overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-ogn-gold mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Global Real-Time Sentiment</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Global Hope Index
            <Heart className="h-6 w-6 text-pink-500 fill-pink-500 animate-pulse" />
          </h2>
        </div>

        {/* Trend Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl glass border border-white/30 dark:border-white/10 self-start sm:self-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">7-Day Trend:</span>
          <div
            className={`flex items-center space-x-1 text-sm font-bold ${
              isPositiveTrend ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {isPositiveTrend ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{isPositiveTrend ? `+${trend}%` : `${trend}%`}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left: Circular Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="url(#hopeGradient)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="hopeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Gauge Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {percentage}%
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                Hope Rating
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4 max-w-xs">
            Calculated using AI sentiment analysis across verified global positive news articles.
          </p>
        </div>

        {/* Right: Category Breakdown Mini Bars */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-ogn-teal" />
              Category Positivity Breakdown
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Score</span>
          </div>

          <div className="space-y-3.5">
            {categories.map((item) => {
              const catScore = Math.round(item.score <= 1 ? item.score * 100 : item.score);
              const label = CATEGORY_NAMES[item.category] || item.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              const barColor = CATEGORY_BAR_COLORS[item.category] || 'bg-ogn-gold';

              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{label}</span>
                    <span className="text-slate-900 dark:text-white font-bold">{catScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200/70 dark:bg-slate-800/70 rounded-full h-2.5 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${catScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
