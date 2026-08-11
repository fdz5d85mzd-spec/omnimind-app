import Link from 'next/link';
import { Play, Clock, Headphones } from 'lucide-react';
import { timeAgo, truncate } from '@/lib/ogn/utils';
import { formatDuration } from '@/components/ogn/VideoCard';

export interface PodcastRowProps {
  episode: {
    id: string;
    title: string;
    description?: string | null;
    duration?: number | null;
    episodeNumber: number;
    publishedAt?: Date | string | null;
    createdAt: Date | string;
    coverArtUrl?: string | null;
  };
}

export default function PodcastRow({ episode }: PodcastRowProps) {
  const displayDate = episode.publishedAt || episode.createdAt;

  return (
    <Link
      href={`/ogn/radio/${episode.id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl glass border border-white/40 dark:border-white/10 card-hover transition-all"
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Play Icon / Cover */}
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 text-ogn-gold border border-amber-500/30 group-hover:scale-105 transition-transform">
          {episode.coverArtUrl ? (
            <img
              src={episode.coverArtUrl}
              alt={episode.title}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <Headphones className="h-6 w-6 text-ogn-gold" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
        </div>

        {/* Title & Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex rounded-md bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              EP #{episode.episodeNumber}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {timeAgo(displayDate)}
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-ogn-gold transition-colors">
            {truncate(episode.title, 90)}
          </h4>
          {episode.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 hidden sm:block">
              {truncate(episode.description, 120)}
            </p>
          )}
        </div>
      </div>

      {/* Right Details */}
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-white/5">
        {episode.duration && episode.duration > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatDuration(episode.duration)}</span>
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 text-xs font-semibold text-white gradient-hope px-3.5 py-2 rounded-xl group-hover:opacity-90 transition-opacity">
          <Play className="h-3.5 w-3.5 fill-white" />
          <span>Listen</span>
        </div>
      </div>
    </Link>
  );
}
