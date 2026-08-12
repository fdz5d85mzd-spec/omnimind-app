"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Clock, Globe } from "lucide-react";
import { timeAgo } from "@/lib/ogn/utils";
import { getCategoryStyle } from "./ArticleCard";

export interface HeroStoryProps {
  article: {
    id?: string;
    title: string;
    slug: string;
    summary: string;
    imageUrl?: string | null;
    categorySlug: string;
    sourceName: string;
    publishedAt?: Date | string | null;
    sentimentScore?: number;
  };
}

export default function HeroStory({ article }: HeroStoryProps) {
  const {
    title,
    slug,
    summary,
    imageUrl,
    categorySlug,
    sourceName,
    publishedAt,
  } = article;
  const category = getCategoryStyle(categorySlug);
  const formattedTime = publishedAt ? timeAgo(publishedAt) : "";
  const displayImage =
    imageUrl ||
    `https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80`;

  return (
    <section className="relative w-full overflow-hidden my-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden min-h-[480px] md:min-h-[560px] flex items-end shadow-2xl border border-white/20 dark:border-white/10 group">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src={displayImage}
              alt={title}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/ogn-fallback.svg";
              }}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />
          </div>

          {/* Featured Tag (Top Left) */}
          <div className="absolute top-6 left-6 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold gradient-hope text-white shadow-md">
              <Sparkles className="h-3.5 w-3.5" />
              Featured Story
            </span>
          </div>

          {/* Glassmorphism Content Card */}
          <div className="relative z-10 w-full p-6 sm:p-8 md:p-12">
            <div className="glass-strong rounded-2xl p-6 sm:p-8 max-w-3xl backdrop-blur-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-slate-900/60 shadow-xl">
              {/* Category & Source Metadata */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${category.bg}`}
                >
                  {category.label}
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-ogn-teal" />
                  {sourceName}
                </span>
                {formattedTime && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formattedTime}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
                {title}
              </h1>

              {/* Summary */}
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 mb-6 line-clamp-3 leading-relaxed">
                {summary}
              </p>

              {/* CTA Button */}
              <Link
                href={`/ogn/article/${slug}`}
                className="inline-flex items-center space-x-2 rounded-xl gradient-hope px-6 py-3 font-semibold text-white shadow-lg hover:opacity-95 transition-transform active:scale-95 group/btn"
              >
                <span>Read Story</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
