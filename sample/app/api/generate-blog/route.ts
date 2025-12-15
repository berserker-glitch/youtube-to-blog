import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { getSubtitles, getVideoDetails } from 'youtube-caption-extractor';
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

    const body = await request.json();
    const youtubeUrl = (body?.youtubeUrl || '').toString();
    const lang = (body?.lang || 'en').toString();

    const { videoId } = parseYouTubeUrl(youtubeUrl);
    console.log('[generate-blog] validated input', { videoId, lang });

    console.log('[generate-blog] fetching subtitles + video details');
    const [subtitles, videoDetails] = await Promise.all([
      getSubtitles({ videoID: videoId, lang }),
      getVideoDetails({ videoID: videoId, lang }),
    ]);
    console.log('[generate-blog] fetched', {
      subtitlesCount: subtitles?.length || 0,
      title: videoDetails?.title || 'Unknown',
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
    const chapters = await generateChapters({
      transcriptWithTimestamps: transcriptForChaptering,
      videoTitle: videoDetails?.title,
      totalDurationSec,
      model: models.chaptersModel,
    });
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
    const initialIntro = await writeIntroduction({
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

    const initialSections: string[] = [];
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

      const section = await writeSection({
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
      initialSections.push(section);
    }

    console.log('[generate-blog] writing conclusion');
    const initialConclusion = await writeConclusion({
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

    console.log('[generate-blog] assembling initial markdown');
    const initialMd = assembleMarkdown({
      articleTitle,
      intro: initialIntro,
      chapters,
      sections: initialSections,
      conclusion: initialConclusion,
      video: {
        title: videoDetails?.title,
        description: videoDetails?.description,
        url: youtubeUrl,
      },
    });

    console.log('[generate-blog] generating feedback', {
      model: models.feedbackModel,
    });
    const feedback = await getDraftFeedback({
      articleTitle,
      video: { title: videoDetails?.title, description: videoDetails?.description },
      draftMarkdown: initialMd,
      model: models.feedbackModel,
    });

    console.log('[generate-blog] revising introduction');
    const intro = await reviseIntroductionWithFeedback({
      articleTitle,
      chapters,
      video: { title: videoDetails?.title, description: videoDetails?.description },
      overallTargetWords,
      targetWords: introTargetWords,
      originalIntro: initialIntro,
      feedbackMarkdown: feedback,
      model: models.writerModel,
    });

    const sections: string[] = [];
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

      const revised = await reviseSectionWithFeedback({
        chapter,
        transcriptSlice: sliceText,
        video: { title: videoDetails?.title, description: videoDetails?.description },
        overallTargetWords,
        targetWords: perSectionTargetWords,
        originalSection: initialSections[i] || '',
        feedbackMarkdown: feedback,
        model: models.writerModel,
      });
      sections.push(revised);
    }

    console.log('[generate-blog] revising conclusion');
    const conclusion = await reviseConclusionWithFeedback({
      articleTitle,
      chapters,
      video: { title: videoDetails?.title, description: videoDetails?.description },
      overallTargetWords,
      targetWords: conclusionTargetWords,
      originalConclusion: initialConclusion,
      feedbackMarkdown: feedback,
      model: models.writerModel,
    });

    console.log('[generate-blog] assembling final markdown');
    const md = assembleMarkdown({
      articleTitle,
      intro,
      chapters,
      sections,
      conclusion,
      video: {
        title: videoDetails?.title,
        description: videoDetails?.description,
        url: youtubeUrl,
      },
    });

    const filename = `${slugify(articleTitle)}.md`;

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


