import { prisma } from '@/lib/ogn/db';
import { callLLM } from './llm';

// ─── Supported Languages ──────────────────────────────────────
export interface Language {
  code: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh', name: 'Chinese' },
  { code: 'pt', name: 'Portuguese' },
];

// ─── Translate Single Article ────────────────────────────────
export async function translateArticle(articleId: string, targetLang: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    throw new Error(`Article not found with ID: ${articleId}`);
  }

  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);
  const targetLangName = langObj ? langObj.name : targetLang;

  const systemPrompt = `You are a professional news translator for "Only Good News" (OGN).
Translate the following news article title, summary, and content into ${targetLangName} (${targetLang}).

Rules:
- Maintain an accurate, warm, positive, and professional tone.
- Preserve factual accuracy and original meaning.
- Return ONLY valid JSON with keys: "title", "summary", and "content".`;

  const userPrompt = `Title: ${article.title}

Summary: ${article.summary}

Content: ${article.content || article.summary}`;

  try {
    const response = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 3000, json: true }
    );

    let parsed: { title?: string; summary?: string; content?: string } = {};
    try {
      parsed = JSON.parse(response.content);
    } catch {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse translation JSON output`);
      }
    }

    const translatedTitle = parsed.title || article.title;
    const translatedSummary = parsed.summary || article.summary;
    const translatedContent = parsed.content || article.content;

    const translation = await prisma.translation.upsert({
      where: {
        articleId_language: {
          articleId,
          language: targetLang,
        },
      },
      update: {
        title: translatedTitle,
        summary: translatedSummary,
        content: translatedContent,
      },
      create: {
        articleId,
        language: targetLang,
        title: translatedTitle,
        summary: translatedSummary,
        content: translatedContent,
      },
    });

    console.log(`[Translation] Article ${articleId} translated to ${targetLang} (${targetLangName})`);
    return translation;
  } catch (error: any) {
    console.error(`[Translation] Error translating article ${articleId} to ${targetLang}:`, error.message);
    throw error;
  }
}

// ─── Batch Translate Articles ────────────────────────────────
export async function translateBatch(
  articleIds: string[],
  languages: string[] = ['es', 'fr', 'de']
) {
  const targetLangs = languages && languages.length > 0 ? languages : ['es', 'fr', 'de'];
  const results: any[] = [];

  for (const articleId of articleIds) {
    for (const lang of targetLangs) {
      try {
        const translation = await translateArticle(articleId, lang);
        if (translation) {
          results.push(translation);
        }
      } catch (error: any) {
        console.error(`[Translation] Batch skip article ${articleId} lang ${lang}: ${error.message}`);
      }
    }
  }

  console.log(`[Translation] Batch completed. Total translations created/updated: ${results.length}`);
  return results;
}
