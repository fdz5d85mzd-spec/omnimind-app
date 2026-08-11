import Link from 'next/link';
import { Play, Clock, Film, Sparkles } from 'lucide-react';
import { timeAgo, truncate } from '@/lib/ogn/utils';

export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export interface VideoCardProps {
  video: {
    id: string;
    title: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    duration?: number | null;
    type: string;
    createdAt: Date | string;
    article?: {
      slug: string;
      imageUrl?: string | null;
      title?: string;
    } | null;
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const thumbnail = video.thumbnailUrl || video.article?.imageUrl;

  return (
    <Link
      href={`/ogn/tv/${video.id}`}
      className="group flex flex-col h-full rounded-2xl glass border border-white/40 dark:border-white/10 overflow-hidden card-hover transition-all"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/20 via-teal-500/20 to-slate-900 p-4 text-center">
            <Film className="h-10 w-10 text-ogn-gold mb-2 opacity-80" />
            <span className="text-xs text-slate-300 font-medium">OGN TV</span>
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/50 transition-colors flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl transition-transform duration-300 group-hover:scale-110">
            <Play className="h-5 w-5 fill-slate-900 ml-0.5" />
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white border border-white/10">
            {video.type === 'ai_generated' ? (
              <>
                <Sparkles className="h-3 w-3 text-ogn-gold" />
                <span>AI Generated</span>
              </>
            ) : (
              <>
                <Film className="h-3 w-3 text-ogn-teal" />
                <span>Slideshow</span>
              </>
            )}
          </span>
        </div>

        {/* Duration Badge */}
        {video.duration && video.duration > 0 ? (
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/80 backdrop-blur-md px-2 py-0.5 text-xs font-medium text-slate-200 border border-white/10">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{formatDuration(video.duration)}</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-2 group-hover:text-ogn-gold transition-colors">
          {truncate(video.title, 80)}
        </h3>

        <div className="mt-auto flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/50 dark:border-white/5">
          <span>{timeAgo(video.createdAt)}</span>
          <span className="text-ogn-teal font-medium group-hover:underline">Watch video →</span>
        </div>
      </div>
    </Link>
  );
}
