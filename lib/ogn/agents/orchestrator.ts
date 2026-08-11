import { prisma } from '@/lib/ogn/db';
import { runCollection } from './collection';
import { deduplicate } from './dedup';
import { verifyBatch } from './verification';
import { summarizeArticle } from './summary';
import { applySEO } from './seo';
import { translateArticle } from './translation';
import { slugify } from '@/lib/ogn/utils';

export interface PipelineSummary {
  collected: number;
  deduplicated: number;
  verified: number;
  published: number;
  translated: number;
  seoGenerated: number;
  rejected: number;
}

// Helper to log individual agent steps to AgentLog table
async function runAgentStep<T>(
  agentName: string,
  action: string,
  fn: () => Promise<{ result: T; articlesProcessed?: number; articlesFiltered?: number; details?: any }>
): Promise<T> {
  const startTime = Date.now();
  const log = await prisma.agentLog.create({
    data: {
      agentName,
      action,
      status: 'running',
    },
  });

  try {
    const stepData = await fn();
    const duration = Date.now() - startTime;
    await prisma.agentLog.update({
      where: { id: log.id },
      data: {
        status: 'completed',
        articlesProcessed: stepData.articlesProcessed || 0,
        articlesFiltered: stepData.articlesFiltered || 0,
        details: stepData.details ? JSON.stringify(stepData.details) : null,
        duration,
      },
    });
    return stepData.result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    await prisma.agentLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        errorMessage: error.message || String(error),
        duration,
      },
    });
    throw error;
  }
}

// ─── Updated Pipeline: collect -> dedup -> verify -> summarize -> SEO -> translate -> publish
export async function runPipeline(): Promise<PipelineSummary> {
  const pipelineStartTime = Date.now();
  let pipelineLogId: string | undefined;

  try {
    // Root pipeline log
    const log = await prisma.agentLog.create({
      data: {
        agentName: 'pipeline',
        action: 'full-cycle',
        status: 'running',
      },
    });
    pipelineLogId = log.id;

    // ─── Step 1: Collect ──────────────────────────────────────
    const collectedArticles = await runAgentStep('collection', 'collect', async () => {
      const articles = await runCollection();
      return {
        result: articles,
        articlesProcessed: articles.length,
        articlesFiltered: 0,
      };
    });

    if (collectedArticles.length === 0) {
      const summary: PipelineSummary = {
        collected: 0,
        deduplicated: 0,
        verified: 0,
        published: 0,
        translated: 0,
        seoGenerated: 0,
        rejected: 0,
      };

      await prisma.agentLog.update({
        where: { id: pipelineLogId },
        data: {
          status: 'completed',
          articlesProcessed: 0,
          articlesFiltered: 0,
          details: JSON.stringify(summary),
          duration: Date.now() - pipelineStartTime,
        },
      });

      return summary;
    }

    // ─── Step 2: Dedup ────────────────────────────────────────
    const deduplicatedArticles = await runAgentStep('dedup', 'deduplicate', async () => {
      const articles = await deduplicate(collectedArticles);
      return {
        result: articles,
        articlesProcessed: collectedArticles.length,
        articlesFiltered: collectedArticles.length - articles.length,
      };
    });

    // ─── Step 3: Verify ───────────────────────────────────────
    const verifiedItems = await runAgentStep('verification', 'verify', async () => {
      const items = await verifyBatch(deduplicatedArticles);
      return {
        result: items,
        articlesProcessed: deduplicatedArticles.length,
        articlesFiltered: deduplicatedArticles.length - items.length,
      };
    });

    // ─── Step 4: Summarize -> Publish -> SEO -> Translate ────
    let published = 0;
    let rejected = 0;
    let seoGenerated = 0;
    let translated = 0;

    for (const { article, verification } of verifiedItems) {
      try {
        // 1. Summarize
        const summary = await summarizeArticle(article, verification.category);
        const slug = slugify(summary.title);

        // Check for duplicate slug
        const existing = await prisma.article.findUnique({
          where: { slug },
        });

        if (existing) {
          console.log(`[Pipeline] Article with slug "${slug}" already exists. Skipping.`);
          rejected++;
          continue;
        }

        // Ensure category exists
        await prisma.category.upsert({
          where: { slug: summary.category },
          update: {},
          create: {
            slug: summary.category,
            name: summary.category
              .split('-')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
          },
        });

        // Publish to DB
        const newArticle = await prisma.article.create({
          data: {
            title: summary.title,
            slug,
            summary: summary.summary,
            content: article.content,
            sourceUrl: article.url,
            sourceName: article.sourceName,
            imageUrl: article.imageUrl || null,
            categorySlug: summary.category,
            sentimentScore: verification.sentimentScore,
            credibilityScore: verification.credibilityScore,
            isPublished: true,
            isVerified: true,
            publishedAt: new Date(),
          },
        });

        published++;
        console.log(`[Pipeline] Published article: "${newArticle.title}" (ID: ${newArticle.id})`);

        // 2. Generate and apply SEO
        try {
          await applySEO(newArticle.id);
          seoGenerated++;
        } catch (seoErr: any) {
          console.error(`[Pipeline] SEO generation failed for article ${newArticle.id}:`, seoErr.message);
        }

        // 3. Translate to es, fr, de
        const defaultLangs = ['es', 'fr', 'de'];
        for (const lang of defaultLangs) {
          try {
            await translateArticle(newArticle.id, lang);
            translated++;
          } catch (transErr: any) {
            console.error(`[Pipeline] Translation (${lang}) failed for article ${newArticle.id}:`, transErr.message);
          }
        }

      } catch (itemErr: any) {
        console.error(`[Pipeline] Error processing article item:`, itemErr.message);
        rejected++;
      }
    }

    // Step logs for Summary, SEO, and Translation
    await runAgentStep('summary', 'summarize', async () => ({
      result: null,
      articlesProcessed: verifiedItems.length,
      articlesFiltered: rejected,
    })).catch(() => {});

    await runAgentStep('seo', 'generate-seo', async () => ({
      result: null,
      articlesProcessed: published,
      articlesFiltered: published - seoGenerated,
    })).catch(() => {});

    await runAgentStep('translation', 'translate', async () => ({
      result: null,
      articlesProcessed: published * 3,
      articlesFiltered: (published * 3) - translated,
    })).catch(() => {});

    // Final result summary
    const resultSummary: PipelineSummary = {
      collected: collectedArticles.length,
      deduplicated: deduplicatedArticles.length,
      verified: verifiedItems.length,
      published,
      translated,
      seoGenerated,
      rejected,
    };

    // Update root pipeline log
    await prisma.agentLog.update({
      where: { id: pipelineLogId },
      data: {
        status: 'completed',
        articlesProcessed: collectedArticles.length,
        articlesFiltered: rejected + (collectedArticles.length - verifiedItems.length),
        details: JSON.stringify(resultSummary),
        duration: Date.now() - pipelineStartTime,
      },
    });

    console.log(`[Pipeline] Execution completed in ${Date.now() - pipelineStartTime}ms:`, resultSummary);
    return resultSummary;

  } catch (error: any) {
    console.error('[Pipeline] Fatal pipeline error:', error);
    if (pipelineLogId) {
      await prisma.agentLog.update({
        where: { id: pipelineLogId },
        data: {
          status: 'failed',
          errorMessage: error.message || String(error),
          duration: Date.now() - pipelineStartTime,
        },
      });
    }
    throw error;
  }
}
