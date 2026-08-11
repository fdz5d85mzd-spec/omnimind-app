import { prisma } from '@/lib/ogn/db';
import { callLLM } from './llm';

export interface PodcastScriptResult {
  title: string;
  script: string;
  estimatedDuration: number; // in seconds
}

/**
 * Generates a full podcast script with intro, article narrations, and outro for 3-5 articles.
 */
export async function generatePodcastScript(
  articles: Array<{ title: string; summary: string; content?: string | null; categorySlug?: string }>
): Promise<PodcastScriptResult> {
  const articlesListText = articles
    .map(
      (a, i) =>
        `Story ${i + 1}:
Title: ${a.title}
Category: ${a.categorySlug || 'General'}
Summary: ${a.summary}
Details: ${a.content ? a.content.substring(0, 1000) : a.summary}`
    )
    .join('\n\n');

  const prompt = `You are the lead podcast producer and host for OGN Radio (Only Good News Radio).
Write a warm, engaging, and professional podcast episode script based on the following positive news stories.

Stories to cover:
${articlesListText}

Script Format & Structure Requirements:
1. Warm Welcome & Intro: Hook the listener and introduce today's episode topic/theme.
2. Segment Narrations: Smoothly transition between each story, sharing the key highlights and why it matters.
3. Uplifting Outro: Inspiring closing remarks reminding listeners that good things happen every day.
4. Provide a catchy, descriptive Podcast Episode Title.
5. Provide an estimated reading duration in seconds.

Return ONLY a valid JSON object matching this schema:
{
  "title": "Episode title here",
  "script": "Full host speech script here...",
  "estimatedDuration": 300
}`;

  const response = await callLLM(
    [
      { role: 'system', content: 'You produce inspiring, radio-quality positive news podcasts.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, json: true }
  );

  let parsed: any;
  try {
    parsed = JSON.parse(response.content);
  } catch {
    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse podcast script JSON response from LLM.');
    }
  }

  const scriptText = parsed.script || articles.map((a) => `${a.title}. ${a.summary}`).join('\n\n');
  const wordCount = scriptText.split(/\s+/).filter(Boolean).length;
  const estimatedDuration = parsed.estimatedDuration || Math.max(120, Math.round(wordCount / 2.5));

  return {
    title: parsed.title || `OGN Radio: Daily Good News Digest - ${new Date().toLocaleDateString()}`,
    script: scriptText,
    estimatedDuration,
  };
}

/**
 * Splits text into chunk sizes suitable for ElevenLabs TTS (~1500 chars).
 */
function chunkText(text: string, maxChunkLength = 1500): string[] {
  const paragraphs = text.split(/\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChunkLength) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = para + '\n';
    } else {
      currentChunk += para + '\n';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Main function: fetches articles, generates script, creates PodcastEpisode record, generates TTS audio via ElevenLabs, and updates record.
 */
export async function generatePodcastEpisode(articleIds: string[]) {
  const startTime = Date.now();
  const agentLog = await prisma.agentLog.create({
    data: {
      agentName: 'podcast',
      action: 'generate-podcast-episode',
      status: 'running',
      details: JSON.stringify({ articleIds }),
    },
  });

  let episodeId: string | null = null;

  try {
    if (!articleIds || articleIds.length === 0) {
      throw new Error('No article IDs provided for podcast generation.');
    }

    // Fetch target articles
    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
    });

    if (articles.length === 0) {
      throw new Error('None of the requested articles were found in the database.');
    }

    // Determine auto-increment episode number
    const lastEpisode = await prisma.podcastEpisode.findFirst({
      orderBy: { episodeNumber: 'desc' },
      select: { episodeNumber: true },
    });
    const episodeNumber = (lastEpisode?.episodeNumber || 0) + 1;

    // Step 1: Generate podcast script
    const scriptResult = await generatePodcastScript(articles);

    // Cover art from first article or default
    const coverArtUrl = articles[0]?.imageUrl || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618';
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6ovDq8yoEQmJB94';

    // Step 2: Create PodcastEpisode record in DB (status = generating)
    const episode = await prisma.podcastEpisode.create({
      data: {
        title: scriptResult.title,
        description: `In this episode of OGN Radio, we cover ${articles.length} uplifting stories including: ${articles.map((a) => a.title).join('; ')}`,
        status: 'generating',
        script: scriptResult.script,
        duration: scriptResult.estimatedDuration,
        episodeNumber,
        voiceId,
        coverArtUrl,
      },
    });
    episodeId = episode.id;

    // Link articles with PodcastEpisodeArticle join records
    await prisma.podcastEpisodeArticle.createMany({
      data: articles.map((article, index) => ({
        episodeId: episode.id,
        articleId: article.id,
        sortOrder: index,
      })),
    });

    // Step 3: ElevenLabs TTS audio generation
    let audioUrl: string | null = null;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (apiKey) {
      const textChunks = chunkText(scriptResult.script, 1500);
      const audioBuffers: Buffer[] = [];

      for (const chunk of textChunks) {
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: chunk,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        if (!ttsResponse.ok) {
          const errText = await ttsResponse.text();
          throw new Error(`ElevenLabs Podcast TTS error (${ttsResponse.status}): ${errText}`);
        }

        const buf = await ttsResponse.arrayBuffer();
        audioBuffers.push(Buffer.from(buf));
      }

      const combinedAudio = Buffer.concat(audioBuffers);
      audioUrl = `data:audio/mpeg;base64,${combinedAudio.toString('base64')}`;
    } else {
      console.log('[PodcastAgent] ELEVENLABS_API_KEY not set. Skipping ElevenLabs audio generation.');
      audioUrl = `/audio/podcasts/episode-${episode.id}.mp3`;
    }

    // Step 4: Update episode status to completed and set publishedAt
    const updatedEpisode = await prisma.podcastEpisode.update({
      where: { id: episode.id },
      data: {
        status: 'completed',
        audioUrl,
        publishedAt: new Date(),
      },
      include: {
        articles: {
          include: { article: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const runDuration = Date.now() - startTime;
    await prisma.agentLog.update({
      where: { id: agentLog.id },
      data: {
        status: 'completed',
        articlesProcessed: articles.length,
        duration: runDuration,
        details: JSON.stringify({
          episodeId: updatedEpisode.id,
          episodeNumber,
          articleCount: articles.length,
        }),
      },
    });

    return updatedEpisode;
  } catch (error: any) {
    const runDuration = Date.now() - startTime;
    console.error(`[PodcastAgent] Error generating podcast episode:`, error.message);

    if (episodeId) {
      await prisma.podcastEpisode.update({
        where: { id: episodeId },
        data: {
          status: 'failed',
          errorMessage: error.message || String(error),
        },
      });
    }

    await prisma.agentLog.update({
      where: { id: agentLog.id },
      data: {
        status: 'failed',
        errorMessage: error.message || String(error),
        duration: runDuration,
      },
    });

    throw error;
  }
}

/**
 * Fetches top 5 published articles from the last 24h and creates a podcast episode.
 */
export async function generatePodcastFromRecent() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let articles = await prisma.article.findMany({
    where: {
      isPublished: true,
      publishedAt: { gte: twentyFourHoursAgo },
    },
    take: 5,
    orderBy: [
      { sentimentScore: 'desc' },
      { publishedAt: 'desc' },
    ],
  });

  // Fallback to top recent articles if fewer than 3 in last 24h
  if (articles.length < 3) {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      take: 5,
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  if (articles.length === 0) {
    throw new Error('No published articles available to generate a podcast episode.');
  }

  const articleIds = articles.map((a) => a.id);
  return await generatePodcastEpisode(articleIds);
}
