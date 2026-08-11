import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { prisma } from '@/lib/ogn/db';
import { generateCategoryRSS } from '@/lib/ogn/agents/rss';

export async function GET(
  req: NextRequest,
  context: { params: { category: string } | Promise<{ category: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const category = resolvedParams.category;

    if (!category) {
      return NextResponse.json({ error: 'Category slug is required' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl?.origin || 'https://onlygoodnews.com';

    const articles = await prisma.article.findMany({
      where: {
        isPublished: true,
        categorySlug: category,
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      include: { category: true },
    });

    const rssXml = generateCategoryRSS(articles, category, siteUrl);

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('[Category RSS API] Error generating category RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate category RSS feed', details: error.message },
      { status: 500 }
    );
  }
}
