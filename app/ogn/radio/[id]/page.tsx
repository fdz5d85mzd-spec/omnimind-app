import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Play, ArrowLeft, Headphones, Clock, FileText, Volume2, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/ogn/db';
import { timeAgo } from '@/lib/ogn/utils';
import { formatDuration } from '@/components/ogn/VideoCard';

export const revalidate = 60;

export default async function RadioEpisodePage({
  params,
}: {
  params: { id: string };
}) {
  const episode = await prisma.podcastEpisode.findUnique({
    where: { id: params.id },
    include: {
      articles: {
        include: {
          article: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  }).catch(() => null);

  if (!episode) {
    notFound();
  }

  const articles = episode.articles.map((item) => item.article).filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/ogn/radio"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-ogn-gold dark:hover:text-ogn-gold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to OGN Radio</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/40 dark:border-white/10 shadow-xl space-y-8">
        {/* Header section with Cover & Title */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="relative flex h-28 w-28 sm:h-36 sm:w-36 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-teal-500/20 to-slate-900 border border-white/20 shadow-xl overflow-hidden">
            {episode.coverArtUrl ? (
              <img
                src={episode.coverArtUrl}
                alt={episode.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Headphones className="h-14 w-14 text-ogn-gold" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                Episode #{episode.episodeNumber}
              </span>
              {episode.duration && episode.duration > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-200/80 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formatDuration(episode.duration)}</span>
                </span>
              ) : null}
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                {timeAgo(episode.publishedAt || episode.createdAt)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {episode.title}
            </h1>

            {episode.description && (
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                {episode.description}
              </p>
            )}
          </div>
        </div>

        {/* Audio Player Area */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 space-y-4">
          {episode.audioUrl ? (
            <div className="rounded-2xl bg-slate-900/90 text-white p-6 shadow-2xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-ogn-gold text-xs font-semibold uppercase tracking-wider">
                <Volume2 className="h-4 w-4" />
                <span>Podcast Audio Player</span>
              </div>
              <audio controls src={episode.audioUrl} className="w-full" />
            </div>
          ) : (
            <div className="rounded-2xl bg-white/60 dark:bg-slate-800/60 p-6 border border-white/30 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm uppercase tracking-wider">
                <FileText className="h-5 w-5" />
                <span>Podcast Script & Narration</span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-serif text-base whitespace-pre-wrap">
                {episode.script || 'Audio generating... No script or audio link recorded yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Full Script Text (if audioUrl exists too) */}
        {episode.script && episode.audioUrl && (
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/40 p-5 sm:p-6 border border-white/30 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
              <FileText className="h-4 w-4 text-ogn-teal" />
              <span>Episode Script</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-serif whitespace-pre-wrap">
              {episode.script}
            </p>
          </div>
        )}

        {/* Articles Included in Episode */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4 text-ogn-gold" />
            <span>Articles Featured in This Episode ({articles.length})</span>
          </h3>

          {articles.length > 0 ? (
            <div className="space-y-3">
              {articles.map((article, idx) => (
                <Link
                  key={article.id}
                  href={`/ogn/article/${article.slug}`}
                  className="group flex flex-col sm:flex-row items-center gap-4 rounded-2xl glass p-4 border border-white/40 dark:border-white/10 hover:border-ogn-gold/50 transition-all"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    {idx + 1}
                  </span>
                  {article.imageUrl && (
                    <div className="relative aspect-video sm:w-28 w-full shrink-0 rounded-xl overflow-hidden bg-slate-900">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-ogn-gold transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {article.summary}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-ogn-teal group-hover:underline">
                    <span>View Article</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              No individual articles linked to this podcast episode.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
