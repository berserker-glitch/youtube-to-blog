import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { getVideoDetails } from 'youtube-caption-extractor';
import { parseYouTubeUrl } from '@/lib/youtube';
import {
  chunkTranscript,
  extractTranscriptSlice,
  formatChunksForLLM,
  formatSegmentsForLLM,
  normalizeSubtitles,
} from '@/lib/transcript';
import { generateChapters } from '@/lib/chaptering';
import { assembleMarkdown, slugify } from '@/lib/markdown';
import {
  getDraftFeedback,
  reviseConclusionWithFeedback,
  reviseIntroductionWithFeedback,
  reviseSectionWithFeedback,
  writeConclusion,
  writeIntroduction,
  writeSection,
} from '@/lib/writer';
import { getAppServerSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { assertGenerationLimit, formatPlanLimitLabel } from '@/lib/rate-limit';
import type { UserPlan } from '@/lib/plan';
import { getModelRoutingForPlan } from '@/lib/model-routing';
import { getSubtitlesWithFallback } from '@/lib/captions';
import {
  computeOpenRouterCostUsd,
  getOpenRouterModelPricing,
  type OpenRouterModelPricing,
} from '@/lib/openrouter-pricing';

export async function POST(request: NextRequest) {
  try {
    const startedAt = Date.now();
    console.log('[generate-blog] start');

    const session = await getAppServerSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = ((session?.user as any)?.plan ?? 'free') as UserPlan;
    let limitState: Awaited<ReturnType<typeof assertGenerationLimit>> | null =
      null;
    try {
      limitState = await assertGenerationLimit({ userId, plan });
      console.log('[generate-blog] generation limit ok', {
        plan,
        used: limitState.used,
        limit: limitState.limit,
        window: limitState.window,
        remaining: limitState.remaining,
        resetAt: limitState.resetAt.toISOString(),
    });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Rate limit exceeded';
      return NextResponse.json(
        {
          error: msg,
          plan,
        },
        { status: 429 }
      );
    }

    const models = await getModelRoutingForPlan(plan);
    const modelIds = Array.from(
      new Set([models.chaptersModel, models.writerModel, models.feedbackModel])
    );
    const pricingEntries = await Promise.all(
      modelIds.map(async (id) => [id, await getOpenRouterModelPricing(id)] as const)
    );
    const pricingByModel = new Map<string, OpenRouterModelPricing | null>(
      pricingEntries
    );

    const costCalls: Array<{
      step: string;
      model: string;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      costUsd?: number;
    }> = [];

    const pushCost = (step: string, model: string, usage?: any) => {
      const pricing = pricingByModel.get(model) || null;
      const u = usage as
        | { prompt_tokens: number; completion_tokens: number; total_tokens: number }
        | undefined;
      const costUsd =
        pricing && u
          ? computeOpenRouterCostUsd({
              pricing,
              promptTokens: u.prompt_tokens,
              completionTokens: u.completion_tokens,
            })
          : undefined;
      costCalls.push({ step, model, usage: u, costUsd });
      return costUsd;
    };

    const body = await request.json();
    const youtubeUrl = (body?.youtubeUrl || '').toString();
    const lang = (body?.lang || 'en').toString();

    const { videoId } = parseYouTubeUrl(youtubeUrl);
    console.log('[generate-blog] validated input', { videoId, lang });

    console.log('[generate-blog] fetching subtitles + video details');
    const videoDetailsPromise = getVideoDetails({ videoID: videoId, lang });

    let subtitlesResult: Awaited<ReturnType<typeof getSubtitlesWithFallback>>;
    try {
      subtitlesResult = await getSubtitlesWithFallback({ videoID: videoId, lang });
    } catch (e) {
      const videoDetails = await videoDetailsPromise.catch(() => null as any);
      const msg = e instanceof Error ? e.message : 'No captions found';
      console.warn('[generate-blog] subtitles fetch failed', {
        videoId,
        lang,
        error: msg,
      });
      return NextResponse.json(
        {
          error: `No captions/transcript available for this video (requested: ${lang}).`,
          debug: {
            videoId,
            requestedLang: lang,
            videoTitle: videoDetails?.title || null,
            hint:
              'This can be intermittent (throttling). Try again, or use a different video. We also attempt English auto-captions.',
            details: msg,
          },
        },
        { status: 400 }
      );
    }

    const { subtitles, usedLang, triedLangs, attempts } = subtitlesResult;
    const videoDetails = await videoDetailsPromise;

    console.log('[generate-blog] fetched', {
      subtitlesCount: subtitles?.length || 0,
      title: videoDetails?.title || 'Unknown',
      captionsLang: usedLang,
      triedLangs,
      attempts: attempts.length,
    });

    if (!subtitles || subtitles.length === 0) {
      return NextResponse.json(
        { error: `No ${lang} captions/transcript available for this video.` },
        { status: 400 }
      );
    }

    console.log('[generate-blog] normalizing transcript');
    const segments = normalizeSubtitles(subtitles as any);
    if (segments.length === 0) {
      return NextResponse.json(
        { error: 'Transcript is empty after normalization.' },
        { status: 400 }
      );
    }

    const totalDurationSec = Math.ceil(segments[segments.length - 1].endSec);
    console.log('[generate-blog] transcript normalized', {
      segments: segments.length,
      totalDurationSec,
    });

    // Chaptering uses chunked transcript for token efficiency
    console.log('[generate-blog] chunking transcript for chaptering');
    const chunks = chunkTranscript(segments, {
      targetChunkSeconds: 45,
      maxChunkSeconds: 75,
    });
    const transcriptForChaptering = formatChunksForLLM(chunks);
    console.log('[generate-blog] chunked', { chunks: chunks.length });

    console.log('[generate-blog] generating semantic chapters', {
      model: models.chaptersModel,
    });
    const chaptersResp = await generateChapters({
      transcriptWithTimestamps: transcriptForChaptering,
      videoTitle: videoDetails?.title,
      totalDurationSec,
      model: models.chaptersModel,
    });
    pushCost('chapters', models.chaptersModel, chaptersResp.usage);
    const chapters = chaptersResp.chapters;
    console.log('[generate-blog] chapters ready', {
      count: chapters.length,
      titles: chapters.map((c) => c.title).slice(0, 12),
    });

    const articleTitle =
      (videoDetails?.title || '').trim() ||
      `YouTube Article (${videoId})`;

    // Word budget: enforce an overall ~2k word target across intro/sections/conclusion.
    const overallTargetWords = 1500;
    const introTargetWords = 360;
    const conclusionTargetWords = 320;
    const remaining = Math.max(
      1200,
      overallTargetWords - introTargetWords - conclusionTargetWords
    );
    const perSectionTargetWords = Math.round(remaining / chapters.length);

    console.log('[generate-blog] word budget', {
      overallTargetWords,
      introTargetWords,
      perSectionTargetWords,
      conclusionTargetWords,
      chapters: chapters.length,
    });

    console.log('[generate-blog] writing introduction', {
      model: models.writerModel,
    });
    const initialIntroResp = await writeIntroduction({
      articleTitle,
      chapters,
      video: {
        title: videoDetails?.title,
        description: videoDetails?.description,
      },
      overallTargetWords,
      targetWords: introTargetWords,
      model: models.writerModel,
    });
    pushCost('write:intro:v1', models.writerModel, initialIntroResp.usage);

    const initialSections: Array<{ content: string; usage?: any }> = [];
    for (const chapter of chapters) {
      console.log('[generate-blog] writing section', {
        id: chapter.id,
        title: chapter.title,
        startSec: Math.floor(chapter.startSec),
        endSec: Math.floor(chapter.endSec),
      });
      const slice = extractTranscriptSlice(
        segments,
        chapter.startSec,
        chapter.endSec
      );
      const sliceText = formatSegmentsForLLM(slice);

      const sectionResp = await writeSection({
        chapter,
        transcriptSlice: sliceText,
        video: {
          title: videoDetails?.title,
          description: videoDetails?.description,
        },
        overallTargetWords,
        targetWords: perSectionTargetWords,
        model: models.writerModel,
      });
      pushCost(`write:section:v1:${chapter.id}`, models.writerModel, sectionResp.usage);
      initialSections.push(sectionResp);
    }

    console.log('[generate-blog] writing conclusion');
    const initialConclusionResp = await writeConclusion({
      articleTitle,
      chapters,
      video: {
        title: videoDetails?.title,
        description: videoDetails?.description,
      },
      overallTargetWords,
      targetWords: conclusionTargetWords,
      model: models.writerModel,
    });
    pushCost('write:conclusion:v1', models.writerModel, initialConclusionResp.usage);

    console.log('[generate-blog] assembling initial markdown');
    const initialMd = assembleMarkdown({
      articleTitle,
      intro: initialIntroResp.content,
      chapters,
      sections: initialSections.map((s) => s.content),
      conclusion: initialConclusionResp.content,
      video: {
        title: videoDetails?.title,
        description: videoDetails?.description,
        url: youtubeUrl,
      },
    });

    console.log('[generate-blog] generating feedback', {
      model: models.feedbackModel,
    });
    const feedbackResp = await getDraftFeedback({
      articleTitle,
      video: { title: videoDetails?.title, description: videoDetails?.description },
      draftMarkdown: initialMd,
      model: models.feedbackModel,
    });
    pushCost('feedback', models.feedbackModel, feedbackResp.usage);

    console.log('[generate-blog] revising introduction');
    const introResp = await reviseIntroductionWithFeedback({
      articleTitle,
      chapters,
      video: { title: videoDetails?.title, description: videoDetails?.description },
      overallTargetWords,
      targetWords: introTargetWords,
      originalIntro: initialIntroResp.content,
      feedbackMarkdown: feedbackResp.content,
      model: models.writerModel,
    });
    pushCost('write:intro:v2', models.writerModel, introResp.usage);

    const sections: Array<{ content: string; usage?: any }> = [];
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      console.log('[generate-blog] revising section', {
        id: chapter.id,
        title: chapter.title,
      });

      const slice = extractTranscriptSlice(
        segments,
        chapter.startSec,
        chapter.endSec
      );
      const sliceText = formatSegmentsForLLM(slice);

      const revisedResp = await reviseSectionWithFeedback({
        chapter,
        transcriptSlice: sliceText,
        video: { title: videoDetails?.title, description: videoDetails?.description },
        overallTargetWords,
        targetWords: perSectionTargetWords,
        originalSection: initialSections[i]?.content || '',
        feedbackMarkdown: feedbackResp.content,
        model: models.writerModel,
      });
      pushCost(`write:section:v2:${chapter.id}`, models.writerModel, revisedResp.usage);
      sections.push(revisedResp);
    }

    console.log('[generate-blog] revising conclusion');
    const conclusionResp = await reviseConclusionWithFeedback({
      articleTitle,
      chapters,
      video: { title: videoDetails?.title, description: videoDetails?.description },
      overallTargetWords,
      targetWords: conclusionTargetWords,
      originalConclusion: initialConclusionResp.content,
      feedbackMarkdown: feedbackResp.content,
      model: models.writerModel,
    });
    pushCost('write:conclusion:v2', models.writerModel, conclusionResp.usage);

    console.log('[generate-blog] assembling final markdown');
    const md = assembleMarkdown({
      articleTitle,
      intro: introResp.content,
      chapters,
      sections: sections.map((s) => s.content),
      conclusion: conclusionResp.content,
      video: {
        title: videoDetails?.title,
        description: videoDetails?.description,
        url: youtubeUrl,
      },
    });

    const filename = `${slugify(articleTitle)}.md`;

    const chaptersCost = costCalls
      .filter((c) => c.step === 'chapters')
      .reduce((sum, c) => sum + (c.costUsd || 0), 0);
    const feedbackCost = costCalls
      .filter((c) => c.step === 'feedback')
      .reduce((sum, c) => sum + (c.costUsd || 0), 0);
    const writingV1Cost = costCalls
      .filter((c) => c.step.startsWith('write:') && c.step.includes(':v1'))
      .reduce((sum, c) => sum + (c.costUsd || 0), 0);
    const writingV2Cost = costCalls
      .filter((c) => c.step.startsWith('write:') && c.step.includes(':v2'))
      .reduce((sum, c) => sum + (c.costUsd || 0), 0);
    const totalUsd = costCalls.reduce((sum, c) => sum + (c.costUsd || 0), 0);
    const unknownCalls = costCalls.filter((c) => c.costUsd === undefined).length;

    console.log('[generate-blog] persisting article');
    await prisma.article.create({
      data: {
        userId,
        videoUrl: youtubeUrl,
        videoId,
        title: articleTitle,
        slug: slugify(articleTitle),
        markdown: md,
        status: 'complete',
        metaJson: {
          chapters: chapters.map((c) => ({
            id: c.id,
            title: c.title,
            startSec: c.startSec,
            endSec: c.endSec,
            primaryKeyword: c.primaryKeyword,
          })),
          models: {
            chapters: models.chaptersModel,
            writer: models.writerModel,
            feedback: models.feedbackModel,
            revisionWriter: models.writerModel,
            plan,
          },
          generationCost: {
            currency: 'USD',
            totalUsd,
            unknownCalls,
            breakdownUsd: {
              chapters: chaptersCost,
              writingV1: writingV1Cost,
              feedback: feedbackCost,
              writingV2: writingV2Cost,
            },
            pricing: Object.fromEntries(pricingEntries),
            calls: costCalls,
            computedAt: new Date().toISOString(),
          },
          generationLimit: limitState
            ? {
                plan,
                limit: limitState.limit,
                window: limitState.window,
                label: formatPlanLimitLabel({
                  limit: limitState.limit,
                  window: limitState.window,
                }),
                resetAt: limitState.resetAt.toISOString(),
              }
            : { plan },
          wordBudget: {
            overallTargetWords,
            introTargetWords,
            perSectionTargetWords,
            conclusionTargetWords,
          },
          transcript: {
            lang,
            segments: segments.length,
            chunks: chunks.length,
            totalDurationSec,
          },
        },
      },
    });

    console.log('[generate-blog] done', {
      filename,
      bytes: Buffer.byteLength(md, 'utf8'),
      ms: Date.now() - startedAt,
    });

    return new Response(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('generate-blog error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


