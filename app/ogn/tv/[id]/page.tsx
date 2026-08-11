import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Play, ArrowLeft, Clock, Volume2, FileText, Sparkles, Film, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/ogn/db';
import { timeAgo } from '@/lib/ogn/utils';
import { formatDuration } from '@/components/ogn/VideoCard';

export const revalidate = 60;

export default async function VideoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const video = await prisma.video.findUnique({
    where: { id: params.id },
    include: {
      article: true,
    },
  }).catch(() => null);

  if (!video) {
    notFound();
  }

  const thumbnail = video.thumbnailUrl || video.article?.imageUrl;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/ogn/tv"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-ogn-gold dark:hover:text-ogn-gold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to OGN TV</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/40 dark:border-white/10 shadow-xl space-y-6">
        {/* Player Area */}
        {video.videoUrl ? (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-white/10">
            <video
              src={video.videoUrl}
              poster={thumbnail || undefined}
              controls
              autoPlay={false}
              className="w-full h-full object-contain"
            />
          </div>
        ) : video.voiceoverUrl ? (
          <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 space-y-6 shadow-2xl border border-white/10">
            {thumbnail && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950">
                <img
                  src={thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ogn-gold/90 text-slate-900 shadow-xl">
                    <Volume2 className="h-8 w-8 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-ogn-gold text-sm font-semibold uppercase tracking-wider">
                <Volume2 className="h-5 w-5" />
                <span>Audio Narration & Voiceover</span>
              </div>
              <audio src={video.voiceoverUrl} controls className="w-full" />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/60 dark:bg-slate-800/60 p-6 sm:p-8 border border-white/30 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm uppercase tracking-wider">
              <FileText className="h-5 w-5" />
              <span>Video Narration Script</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-serif text-base sm:text-lg whitespace-pre-wrap">
              {video.script || 'No video player, voiceover, or narration script available for this entry.'}
            </p>
          </div>
        )}

        {/* Video Metadata Header */}
        <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              {video.type === 'ai_generated' ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-ogn-gold" />
                  <span>AI Generated</span>
                </>
              ) : (
                <>
                  <Film className="h-3.5 w-3.5 text-ogn-teal" />
                  <span>Slideshow</span>
                </>
              )}
            </span>

            {video.duration && video.duration > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-200/80 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{formatDuration(video.duration)}</span>
              </span>
            ) : null}

            <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
              Published {timeAgo(video.createdAt)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {video.title}
          </h1>

          {video.description && (
            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        {/* Video Script (if videoUrl or voiceoverUrl exists) */}
        {video.script && (video.videoUrl || video.voiceoverUrl) && (
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/40 p-5 sm:p-6 border border-white/30 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
              <FileText className="h-4 w-4 text-ogn-teal" />
              <span>Transcript & Script</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-serif whitespace-pre-wrap">
              {video.script}
            </p>
          </div>
        )}

        {/* Related Article Link */}
        {video.article && (
          <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Related Article
            </h3>
            <Link
              href={`/ogn/article/${video.article.slug}`}
              className="group flex flex-col sm:flex-row items-center gap-4 rounded-2xl glass p-4 border border-white/40 dark:border-white/10 hover:border-ogn-gold/50 transition-all"
            >
              {video.article.imageUrl && (
                <div className="relative aspect-video sm:w-36 w-full shrink-0 rounded-xl overflow-hidden bg-slate-900">
                  <img
                    src={video.article.imageUrl}
                    alt={video.article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-ogn-gold transition-colors line-clamp-2">
                  {video.article.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {video.article.summary}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-ogn-teal group-hover:underline">
                <span>Read Full Story</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
