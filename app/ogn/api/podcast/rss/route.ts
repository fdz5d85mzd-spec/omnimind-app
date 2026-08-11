import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { prisma } from '@/lib/ogn/db';
import { generatePodcastRSS } from '@/lib/ogn/agents/rss';

export async function GET(req: NextRequest) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl?.origin || 'https://onlygoodnews.com';

    const episodes = await prisma.podcastEpisode.findMany({
      where: { status: 'completed' },
      orderBy: { publishedAt: 'desc' },
      include: {
        articles: {
          include: { article: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const rssXml = generatePodcastRSS(episodes, siteUrl);

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('[Podcast RSS API] Error generating podcast RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate podcast RSS feed', details: error.message },
      { status: 500 }
    );
  }
}
