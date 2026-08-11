import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/ogn/auth';
import { prisma } from '@/lib/ogn/db';
import { slugify } from '@/lib/ogn/utils';

const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  summary: z.string().min(1, 'Summary is required'),
  content: z.string().optional().nullable(),
  sourceUrl: z.string().min(1, 'Source URL is required'),
  sourceName: z.string().min(1, 'Source name is required'),
  imageUrl: z.string().optional().nullable(),
  categorySlug: z.string().min(1, 'Category slug is required'),
  sentimentScore: z.number().min(0).max(1).optional().default(0.5),
  credibilityScore: z.number().min(0).max(1).optional().default(0.8),
  language: z.string().optional().default('en'),
  isPublished: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  isVerified: z.boolean().optional().default(false),
  publishedAt: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'recent';

    const where: any = {
      isPublished: true,
    };

    if (category) {
      where.categorySlug = category;
    }

    let orderBy: any = [{ publishedAt: 'desc' }, { createdAt: 'desc' }];

    switch (sort) {
      case 'featured':
        orderBy = [{ isFeatured: 'desc' }, { publishedAt: 'desc' }];
        break;
      case 'views':
      case 'popular':
        orderBy = [{ viewCount: 'desc' }, { publishedAt: 'desc' }];
        break;
      case 'sentiment':
        orderBy = [{ sentimentScore: 'desc' }, { publishedAt: 'desc' }];
        break;
      case 'credibility':
        orderBy = [{ credibilityScore: 'desc' }, { publishedAt: 'desc' }];
        break;
      case 'recent':
      default:
        orderBy = [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
        break;
    }

    const skip = (page - 1) * limit;

    const [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          source: true,
        },
      }),
      prisma.article.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        totalArticles: totalCount,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('[Articles GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = createArticleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    let baseSlug = data.slug ? slugify(data.slug) : slugify(data.title);
    if (!baseSlug) {
      baseSlug = `article-${Date.now()}`;
    }

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Ensure category exists
    if (data.categorySlug) {
      await prisma.category.upsert({
        where: { slug: data.categorySlug },
        update: {},
        create: {
          slug: data.categorySlug,
          name: data.categorySlug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        },
      });
    }

    const publishedAt = data.publishedAt
      ? new Date(data.publishedAt)
      : data.isPublished
      ? new Date()
      : null;

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        summary: data.summary,
        content: data.content || null,
        sourceUrl: data.sourceUrl,
        sourceName: data.sourceName,
        imageUrl: data.imageUrl || null,
        categorySlug: data.categorySlug,
        sentimentScore: data.sentimentScore,
        credibilityScore: data.credibilityScore,
        language: data.language,
        isPublished: data.isPublished,
        isFeatured: data.isFeatured,
        isVerified: data.isVerified,
        publishedAt,
      },
      include: {
        category: true,
        source: true,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error: any) {
    console.error('[Articles POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create article', details: error.message },
      { status: 500 }
    );
  }
}
