import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/ogn/auth';
import { prisma } from '@/lib/ogn/db';
import { slugify } from '@/lib/ogn/utils';

const updateArticleSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional().nullable(),
  sourceUrl: z.string().optional(),
  sourceName: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  categorySlug: z.string().optional(),
  sentimentScore: z.number().min(0).max(1).optional(),
  credibilityScore: z.number().min(0).max(1).optional(),
  language: z.string().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  publishedAt: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params;

    const existing = await prisma.article.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const article = await prisma.article.update({
      where: { id: existing.id },
      data: {
        viewCount: { increment: 1 },
      },
      include: {
        category: true,
        source: true,
        translations: true,
      },
    });

    return NextResponse.json(article);
  } catch (error: any) {
    console.error('[Article GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const existing = await prisma.article.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const body = await req.json();
    const validation = updateArticleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: any = { ...data };

    if (data.slug && data.slug !== existing.slug) {
      updateData.slug = slugify(data.slug);
    } else if (data.title && !data.slug) {
      // Keep existing slug unless explicitly changed
    }

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

    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    } else if (data.isPublished && !existing.isPublished && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updated = await prisma.article.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        category: true,
        source: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[Article PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update article', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const existing = await prisma.article.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    await prisma.article.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      message: 'Article deleted successfully',
      id: existing.id,
    });
  } catch (error: any) {
    console.error('[Article DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete article', details: error.message },
      { status: 500 }
    );
  }
}
