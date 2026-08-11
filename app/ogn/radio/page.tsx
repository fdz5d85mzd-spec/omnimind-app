import Link from 'next/link';
import { Headphones, Play, Clock, Radio, Volume2, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/ogn/db';
import { timeAgo } from '@/lib/ogn/utils';
import PodcastRow from '@/components/ogn/PodcastRow';
import { formatDuration } from '@/components/ogn/VideoCard';

export const revalidate = 60;

export default async function RadioPage() {
  const completedEpisodes = await prisma.podcastEpisode.findMany({
    where: { status: 'completed' },
    orderBy: { episodeNumber: 'desc' },
  }).catch(() => []);

  const featuredEpisode = completedEpisodes.length > 0 ? completedEpisodes[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-ogn-teal text-xs font-semibold uppercase tracking-wider">
          <Radio className="h-4 w-4" />
          <span>OGN Audio</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          OGN Radio
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          Listen to the good news
        </p>
      </div>

      {completedEpisodes.length === 0 ? (
        /* Empty State */
        <div className="glass-strong rounded-3xl p-12 text-center max-w-lg mx-auto border border-white/40 dark:border-white/10 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-ogn-teal mx-auto">
            <Headphones className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            No podcast episodes yet. Generate episodes from the admin panel.
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Check back soon or visit the admin dashboard to generate weekly audio digests.
          </p>
          <Link
            href="/admin/radio"
            className="inline-flex items-center gap-2 rounded-xl gradient-hope px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Radio className="h-4 w-4" /> Go to Admin Radio
          </Link>
        </div>
      ) : (
        <>
          {/* Featured Episode */}
          {featuredEpisode && (
            <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/40 dark:border-white/10 overflow-hidden shadow-xl space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-ogn-gold text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>Latest Episode</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Episode #{featuredEpisode.episodeNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Cover Art */}
                <div className="md:col-span-4">
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/20 via-teal-500/20 to-slate-900 flex items-center justify-center p-6 border border-white/20 shadow-2xl">
                    {featuredEpisode.coverArtUrl ? (
                      <img
                        src={featuredEpisode.coverArtUrl}
                        alt={featuredEpisode.title}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-hope text-white shadow-xl">
                          <Headphones className="h-10 w-10" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">OGN Radio</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info & Player */}
                <div className="md:col-span-8 space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{timeAgo(featuredEpisode.publishedAt || featuredEpisode.createdAt)}</span>
                      {featuredEpisode.duration && featuredEpisode.duration > 0 ? (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatDuration(featuredEpisode.duration)}
                          </span>
                        </>
                      ) : null}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      <Link href={`/ogn/radio/${featuredEpisode.id}`} className="hover:text-ogn-gold transition-colors">
                        {featuredEpisode.title}
                      </Link>
                    </h2>

                    {featuredEpisode.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {featuredEpisode.description}
                      </p>
                    )}
                  </div>

                  {/* HTML Audio Player if audioUrl exists */}
                  {featuredEpisode.audioUrl ? (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ogn-teal uppercase tracking-wider">
                        <Volume2 className="h-4 w-4" />
                        <span>Listen Now</span>
                      </div>
                      <audio controls src={featuredEpisode.audioUrl} className="w-full" />
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Link
                        href={`/ogn/radio/${featuredEpisode.id}`}
                        className="inline-flex items-center gap-2 rounded-xl gradient-hope px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
                      >
                        <Play className="h-4 w-4 fill-white" />
                        <span>Listen to Episode</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Episode List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Headphones className="h-6 w-6 text-ogn-gold" />
                <span>All Episodes</span>
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {completedEpisodes.length} {completedEpisodes.length === 1 ? 'episode' : 'episodes'}
              </span>
            </div>

            <div className="space-y-4">
              {completedEpisodes.map((episode) => (
                <PodcastRow key={episode.id} episode={episode} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
