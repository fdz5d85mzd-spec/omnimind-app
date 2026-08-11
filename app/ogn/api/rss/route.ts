import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { prisma } from '@/lib/ogn/db';
import { generateArticleRSS } from '@/lib/ogn/agents/rss';

export async function GET(req: NextRequest) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl?.origin || 'https://onlygoodnews.com';

    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      include: { category: true },
    });

    const rssXml = generateArticleRSS(articles, siteUrl);

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('[RSS API] Error generating site RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS feed', details: error.message },
      { status: 500 }
    );
  }
}
