import { prisma } from '@/lib/ogn/db';
import { callLLM } from './llm';

export interface VideoScene {
  text: string;
  imageUrl: string;
}

export interface VideoScriptResult {
  script: string;
  scenes: VideoScene[];
}

/**
 * Generates a 30-60 second narration script and 4-6 scene breakdowns from an article.
 */
export async function generateVideoScript(article: {
  title: string;
  summary: string;
  content?: string | null;
  imageUrl?: string | null;
}): Promise<VideoScriptResult> {
  const prompt = `You are a scriptwriter and storyboarding agent for OGN TV (Only Good News).
Generate a concise, uplifting 30-60 second video narration script and scene breakdown based on the article below.

Article Title: ${article.title}
Article Summary: ${article.summary}
Article Content: ${article.content ? article.content.substring(0, 2000) : article.summary}

Requirements:
1. "script": Full voiceover narration script (approx 75-120 words for 30-60 seconds reading speed).
2. "scenes": An array of 4 to 6 text segments with scene image descriptions or URLs.
   Each scene must be an object with:
   - "text": The short narration text/caption for this scene.
   - "imageUrl": A description or URL for an accompanying image/visual for this scene.

Return ONLY a valid JSON object matching this format:
{
  "script": "Voiceover narration script text...",
  "scenes": [
    { "text": "Caption for scene 1", "imageUrl": "Visual image description or URL" },
    ...
  ]
}`;

  const response = await callLLM(
    [
      { role: 'system', content: 'You create engaging short-form video scripts and storyboards for news.' },
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
      throw new Error('Failed to parse video script JSON response from LLM.');
    }
  }

  const script = parsed.script || `${article.title}. ${article.summary}`;
  let scenes: VideoScene[] = Array.isArray(parsed.scenes)
    ? parsed.scenes.map((s: any) => ({
        text: s.text || '',
        imageUrl: s.imageUrl || article.imageUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
      }))
    : [];

  if (scenes.length === 0) {
    scenes = [
      { text: article.title, imageUrl: article.imageUrl || '' },
      { text: article.summary, imageUrl: article.imageUrl || '' },
    ];
  }

  return { script, scenes };
}

/**
 * Main function: fetches article, generates script, creates Video record, generates TTS voiceover via ElevenLabs, and updates Video record.
 */
export async function generateVideo(articleId: string) {
  const startTime = Date.now();
  const agentLog = await prisma.agentLog.create({
    data: {
      agentName: 'video',
      action: 'generate-video',
      status: 'running',
      details: JSON.stringify({ articleId }),
    },
  });

  let videoRecordId: string | null = null;

  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new Error(`Article not found with ID: ${articleId}`);
    }

    // Step 1: Generate script & scene breakdown
    const scriptResult = await generateVideoScript(article);

    // Estimate duration in seconds (~2.5 words per second)
    const wordCount = scriptResult.script.split(/\s+/).filter(Boolean).length;
    const duration = Math.max(30, Math.min(60, Math.round(wordCount / 2.5)));

    // Step 2: Create Video record (status = generating)
    const video = await prisma.video.create({
      data: {
        articleId,
        title: article.title,
        description: article.summary,
        thumbnailUrl: article.imageUrl,
        type: 'slideshow',
        status: 'generating',
        script: scriptResult.script,
        duration,
      },
    });
    videoRecordId = video.id;

    let voiceoverUrl: string | null = null;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Step 3: ElevenLabs TTS integration if API key is present
    if (apiKey) {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: scriptResult.script,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text();
        throw new Error(`ElevenLabs TTS error (${ttsResponse.status}): ${errText}`);
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      voiceoverUrl = `data:audio/mpeg;base64,${base64Audio}`;
    } else {
      console.log('[VideoAgent] ELEVENLABS_API_KEY not set. Skipping ElevenLabs TTS.');
      voiceoverUrl = `/audio/videos/${video.id}-voiceover.mp3`;
    }

    // Step 4: Update Video record status to completed
    const updatedVideo = await prisma.video.update({
      where: { id: video.id },
      data: {
        status: 'completed',
        voiceoverUrl,
        videoUrl: voiceoverUrl ? `/videos/${video.id}.mp4` : null,
      },
      include: { article: true },
    });

    const runDuration = Date.now() - startTime;
    await prisma.agentLog.update({
      where: { id: agentLog.id },
      data: {
        status: 'completed',
        articlesProcessed: 1,
        duration: runDuration,
        details: JSON.stringify({ videoId: updatedVideo.id, articleId, duration }),
      },
    });

    return updatedVideo;
  } catch (error: any) {
    const runDuration = Date.now() - startTime;
    console.error(`[VideoAgent] Error generating video for article ${articleId}:`, error.message);

    if (videoRecordId) {
      await prisma.video.update({
        where: { id: videoRecordId },
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
 * Processes multiple articles and generates videos for them.
 */
export async function generateVideoBatch(articleIds: string[]) {
  const agentLog = await prisma.agentLog.create({
    data: {
      agentName: 'video',
      action: 'batch-generate-video',
      status: 'running',
      details: JSON.stringify({ articleIds, count: articleIds.length }),
    },
  });

  let generated = 0;
  let failed = 0;
  const startTime = Date.now();

  for (const articleId of articleIds) {
    try {
      await generateVideo(articleId);
      generated++;
    } catch (err: any) {
      console.error(`[VideoAgent] Batch error on article ${articleId}:`, err.message);
      failed++;
    }
  }

  const runDuration = Date.now() - startTime;
  await prisma.agentLog.update({
    where: { id: agentLog.id },
    data: {
      status: failed === articleIds.length && articleIds.length > 0 ? 'failed' : 'completed',
      articlesProcessed: generated,
      articlesFiltered: failed,
      duration: runDuration,
      details: JSON.stringify({ total: articleIds.length, generated, failed }),
    },
  });

  return { generated, failed };
}
