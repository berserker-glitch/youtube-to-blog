import { NextResponse, type NextRequest } from 'next/server';
import { getAppServerSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { assertGenerationLimit, formatPlanLimitLabel } from '@/lib/rate-limit';
import type { UserPlan } from '@/lib/plan';
import { parseYouTubeUrl } from '@/lib/youtube';
import { runArticleGenerationJob } from '@/lib/generation-job';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getAppServerSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plan = ((session?.user as any)?.plan ?? 'free') as UserPlan;
    const body = await request.json().catch(() => ({} as any));
    const youtubeUrl = (body?.youtubeUrl || '').toString().trim();
    const lang = (body?.lang || 'en').toString().trim() || 'en';

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'youtubeUrl is required' }, { status: 400 });
    }

    // If a draft is already running, reuse it (avoids duplicate token spend).
    const existing = await prisma.article.findFirst({
      where: { userId, status: 'draft' },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ ok: true, articleId: existing.id, reused: true });
    }

    // Rate limit check (counts this generation attempt)
    let limitState: Awaited<ReturnType<typeof assertGenerationLimit>> | null = null;
    try {
      limitState = await assertGenerationLimit({ userId, plan });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Rate limit exceeded';
      return NextResponse.json({ error: msg, plan }, { status: 429 });
    }

    const { videoId } = parseYouTubeUrl(youtubeUrl);
    const createdAtIso = new Date().toISOString();

    const article = await prisma.article.create({
      data: {
        userId,
        videoUrl: youtubeUrl,
        videoId,
        title: `Generating (${videoId})`,
        slug: `generating-${videoId}-${Date.now()}`,
        markdown: '',
        status: 'draft',
        metaJson: {
          generationProgress: {
            phase: 'fetching',
            message: 'Queued',
            startedAt: createdAtIso,
            updatedAt: createdAtIso,
          },
          generationRequest: { youtubeUrl, lang, plan },
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
        },
      },
      select: { id: true },
    });

    // Fire-and-forget: this continues even if client disconnects.
    void runArticleGenerationJob({
      articleId: article.id,
      userId,
      plan,
      youtubeUrl,
      lang,
    });

    return NextResponse.json({ ok: true, articleId: article.id, reused: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

