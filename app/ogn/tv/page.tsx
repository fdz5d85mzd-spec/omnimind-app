import Link from 'next/link';
import { Play, Clock, Video, Film, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/ogn/db';
import { timeAgo } from '@/lib/ogn/utils';
import VideoCard, { formatDuration } from '@/components/ogn/VideoCard';

export const revalidate = 60;

export default async function TvPage() {
  const completedVideos = await prisma.video.findMany({
    where: { status: 'completed' },
    orderBy: { createdAt: 'desc' },
    include: {
      article: {
        select: {
          slug: true,
          imageUrl: true,
          title: true,
        },
      },
    },
  }).catch(() => []);

  const featuredVideo = completedVideos.length > 0 ? completedVideos[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-ogn-gold text-xs font-semibold uppercase tracking-wider">
          <Film className="h-4 w-4" />
          <span>OGN Media</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          OGN TV
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          Watch good news come alive
        </p>
      </div>

      {completedVideos.length === 0 ? (
        /* Empty State */
        <div className="glass-strong rounded-3xl p-12 text-center max-w-lg mx-auto border border-white/40 dark:border-white/10 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-ogn-gold mx-auto">
            <Video className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            No videos yet. Generate videos from the admin panel.
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Check back soon or visit the admin dashboard to generate AI video stories and slideshows.
          </p>
          <Link
            href="/admin/tv"
            className="inline-flex items-center gap-2 rounded-xl gradient-hope px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Film className="h-4 w-4" /> Go to Admin TV
          </Link>
        </div>
      ) : (
        <>
          {/* Featured Video */}
          {featuredVideo && (
            <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/40 dark:border-white/10 overflow-hidden shadow-xl">
              <div className="flex items-center gap-2 text-ogn-gold text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="h-4 w-4" />
                <span>Featured Video</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Thumbnail / Video Player Preview */}
                <div className="lg:col-span-7">
                  <Link href={`/ogn/tv/${featuredVideo.id}`} className="group relative block aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-2xl">
                    {featuredVideo.thumbnailUrl || featuredVideo.article?.imageUrl ? (
                      <img
                        src={featuredVideo.thumbnailUrl || featuredVideo.article?.imageUrl || ''}
                        alt={featuredVideo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/20 via-teal-500/20 to-slate-900">
                        <Film className="h-16 w-16 text-ogn-gold mb-3 opacity-80" />
                        <span className="text-sm text-slate-300 font-medium">OGN TV Featured</span>
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/50 transition-colors flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-900 shadow-2xl transition-transform duration-300 group-hover:scale-110">
                        <Play className="h-7 w-7 fill-slate-900 ml-1" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    {featuredVideo.duration && featuredVideo.duration > 0 ? (
                      <div className="absolute bottom-4 right-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white border border-white/10">
                          <Clock className="h-3.5 w-3.5 text-slate-300" />
                          <span>{formatDuration(featuredVideo.duration)}</span>
                        </span>
                      </div>
                    ) : null}
                  </Link>
                </div>

                {/* Details */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {featuredVideo.type === 'ai_generated' ? 'AI Generated' : 'Slideshow'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {timeAgo(featuredVideo.createdAt)}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                    <Link href={`/ogn/tv/${featuredVideo.id}`} className="hover:text-ogn-gold transition-colors">
                      {featuredVideo.title}
                    </Link>
                  </h2>

                  {featuredVideo.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {featuredVideo.description}
                    </p>
                  )}

                  <div className="pt-2">
                    <Link
                      href={`/ogn/tv/${featuredVideo.id}`}
                      className="inline-flex items-center gap-2 rounded-xl gradient-hope px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>Watch Now</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid of completed videos (3 cols on desktop) */}
          {completedVideos.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Video className="h-6 w-6 text-ogn-teal" />
                  <span>All Videos</span>
                </h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {completedVideos.length} {completedVideos.length === 1 ? 'video' : 'videos'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
