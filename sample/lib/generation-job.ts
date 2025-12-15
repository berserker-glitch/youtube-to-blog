import { getVideoDetails } from 'youtube-caption-extractor';
import { prisma } from '@/lib/db';
import type { UserPlan } from '@/lib/plan';
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
import { getModelRoutingForPlan } from '@/lib/model-routing';
import { getSubtitlesWithFallback } from '@/lib/captions';
import {
  computeOpenRouterCostUsd,
  getOpenRouterModelPricing,
  type OpenRouterModelPricing,
} from '@/lib/openrouter-pricing';

type ProgressPhase =
  | 'fetching'
  | 'chaptering'
  | 'writing_v1'
  | 'feedback'
  | 'writing_v2'
  | 'assembling'
  | 'saving'
  | 'failed';

async function patchArticleMetaJson(articleId: string, patch: Record<string, any>) {
  const existing = await prisma.article.findUnique({
    where: { id: articleId },
    select: { metaJson: true },
  });
  const base = (existing?.metaJson as any) || {};
  const next = { ...base, ...patch };
  await prisma.article.update({
    where: { id: articleId },
    data: { metaJson: next },
  });
}

async function setProgress(articleId: string, params: { phase: ProgressPhase; message?: string }) {
  const now = new Date().toISOString();
  const existing = await prisma.article.findUnique({
    where: { id: articleId },
    select: { metaJson: true },
  });
  const prevStartedAt = (existing?.metaJson as any)?.generationProgress?.startedAt;
  await patchArticleMetaJson(articleId, {
    generationProgress: {
      phase: params.phase,
      message: params.message || '',
      startedAt: prevStartedAt || now,
      updatedAt: now,
    },
  });
}

export async function runArticleGenerationJob(params: {
  articleId: string;
  userId: string;
  plan: UserPlan;
  youtubeUrl: string;
  lang: string;
}) {
  const startedAt = Date.now();
  const { articleId, plan, youtubeUrl, lang } = params;

  try {
    await setProgress(articleId, { phase: 'fetching', message: 'Fetching captions + metadata' });

    const { videoId } = parseYouTubeUrl(youtubeUrl);

    const models = await getModelRoutingForPlan(plan);
    await patchArticleMetaJson(articleId, {
      models: {
        chapters: models.chaptersModel,
        writer: models.writerModel,
        feedback: models.feedbackModel,
        revisionWriter: models.writerModel,
        plan,
      },
    });

    const modelIds = Array.from(
      new Set([models.chaptersModel, models.writerModel, models.feedbackModel])
    );
    const pricingEntries = await Promise.all(
      modelIds.map(async (id) => [id, await getOpenRouterModelPricing(id)] as const)
    );
    const pricingByModel = new Map<string, OpenRouterModelPricing | null>(pricingEntries);

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

    const videoDetailsPromise = getVideoDetails({ videoID: videoId, lang });
    const subtitlesResult = await getSubtitlesWithFallback({ videoID: videoId, lang });
    const videoDetails = await videoDetailsPromise.catch(() => null as any);

    const { subtitles, usedLang } = subtitlesResult;
    if (!subtitles || subtitles.length === 0) {
      throw new Error(`No captions/transcript available for this video (requested: ${lang}).`);
    }

    const segments = normalizeSubtitles(subtitles as any);
    if (segments.length === 0) {
      throw new Error('Transcript is empty after normalization.');
    }

    const totalDurationSec = Math.ceil(segments[segments.length - 1].endSec);

    // Chunking + chaptering
    await setProgress(articleId, { phase: 'chaptering', message: 'Generating semantic chapters' });
    const chunks = chunkTranscript(segments, {
      targetChunkSeconds: 45,
      maxChunkSeconds: 75,
    });
    const transcriptForChaptering = formatChunksForLLM(chunks);
    const chaptersResp = await generateChapters({
      transcriptWithTimestamps: transcriptForChaptering,
      videoTitle: videoDetails?.title,
      totalDurationSec,
      model: models.chaptersModel,
    });
    pushCost('chapters', models.chaptersModel, chaptersResp.usage);
    const chapters = chaptersResp.chapters;

    const articleTitle =
      (videoDetails?.title || '').trim() || `YouTube Article (${videoId})`;

    // Update placeholder title/slug early so the UI looks good during generation
    await prisma.article.update({
      where: { id: articleId },
      data: {
        title: articleTitle,
        slug: slugify(articleTitle),
      },
    });

    // Word budget
    const overallTargetWords = 1500;
    const introTargetWords = 360;
    const conclusionTargetWords = 320;
    const remaining = Math.max(1200, overallTargetWords - introTargetWords - conclusionTargetWords);
    const perSectionTargetWords = Math.round(remaining / Math.max(1, chapters.length));

    // Writing v1
    await setProgress(articleId, { phase: 'writing_v1', message: 'Writing draft' });
    const initialIntroResp = await writeIntroduction({
      articleTitle,
      chapters,
      video: { title: videoDetails?.title, description: videoDetails?.description },
      overallTargetWords,
      targetWords: introTargetWords,
      model: models.writerModel,
    });
    pushCost('write:intro:v1', models.writerModel, initialIntroResp.usage);

    const initialSections: Array<{ content: string; usage?: any }> = [];
    for (const chapter of chapters) {
      const slice = extractTranscriptSlice(segments, chapter.startSec, chapter.endSec);
      const sliceText = formatSegmentsForLLM(slice);
      const sectionResp = await writeSection({
        chapter,
        transcriptSlice: sliceText,
        video: { title: videoDetails?.title, description: videoDetails?.description },
        overallTargetWords,
        targetWords: perSectionTargetWords,
        model: models.writerModel,
      });
      pushCost(`write:section:v1:${chapter.id}`, models.writerModel, sectionResp.usage);
      initialSections.push(sectionResp);
    }

    const initialConclusionResp = await writeConclusion({
      articleTitle,
      chapters,
      video: { title: videoDetails?.title, description: videoDetails?.description },
      overallTargetWords,
      targetWords: conclusionTargetWords,
      model: models.writerModel,
    });
    pushCost('write:conclusion:v1', models.writerModel, initialConclusionResp.usage);

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

    // Feedback
    await setProgress(articleId, { phase: 'feedback', message: 'Reviewing draft' });
    const feedbackResp = await getDraftFeedback({
      articleTitle,
      video: { title: videoDetails?.title, description: videoDetails?.description },
      draftMarkdown: initialMd,
      model: models.feedbackModel,
    });
    pushCost('feedback', models.feedbackModel, feedbackResp.usage);

    // Writing v2
    await setProgress(articleId, { phase: 'writing_v2', message: 'Rewriting final article' });
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
      const slice = extractTranscriptSlice(segments, chapter.startSec, chapter.endSec);
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

    // Assemble + save
    await setProgress(articleId, { phase: 'assembling', message: 'Assembling Markdown' });
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

    await setProgress(articleId, { phase: 'saving', message: 'Saving' });

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

    const existing = await prisma.article.findUnique({
      where: { id: articleId },
      select: { metaJson: true },
    });
    const baseMeta = (existing?.metaJson as any) || {};

    await prisma.article.update({
      where: { id: articleId },
      data: {
        markdown: md,
        status: 'complete',
        metaJson: {
          ...baseMeta,
          chapters: chapters.map((c) => ({
            id: c.id,
            title: c.title,
            startSec: c.startSec,
            endSec: c.endSec,
            primaryKeyword: c.primaryKeyword,
          })),
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
          wordBudget: {
            overallTargetWords,
            introTargetWords,
            perSectionTargetWords,
            conclusionTargetWords,
          },
          transcript: {
            lang: usedLang || lang,
            segments: segments.length,
            chunks: chunks.length,
            totalDurationSec,
          },
          generationProgress: {
            phase: 'saving',
            message: 'Complete',
            updatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        },
      },
    });

    console.log('[generation-job] complete', {
      articleId,
      ms: Date.now() - startedAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generation-job] failed', { articleId, error: msg });

    const existing = await prisma.article.findUnique({
      where: { id: articleId },
      select: { metaJson: true },
    });
    const baseMeta = (existing?.metaJson as any) || {};

    await prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'failed',
        metaJson: {
          ...baseMeta,
          generationProgress: {
            phase: 'failed',
            message: msg,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    });
  }
}


