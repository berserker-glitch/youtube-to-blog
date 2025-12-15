import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAppServerSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getAppServerSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const articleId = (url.searchParams.get('articleId') || '').trim();

    const target = articleId
      ? await prisma.article.findFirst({
          where: { id: articleId, userId },
          select: {
            id: true,
            title: true,
            videoUrl: true,
            createdAt: true,
            updatedAt: true,
            metaJson: true,
            status: true,
          },
        })
      : await prisma.article.findFirst({
          where: { userId, status: 'draft' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            videoUrl: true,
            createdAt: true,
            updatedAt: true,
            metaJson: true,
            status: true,
          },
        });

    if (!target) return NextResponse.json({ inProgress: false });

    const progress = (target.metaJson as any)?.generationProgress || null;
    const isInProgress = target.status === 'draft';

    return NextResponse.json({
      inProgress: isInProgress,
      article: {
        id: target.id,
        status: target.status,
        title: target.title,
        videoUrl: target.videoUrl,
        createdAt: target.createdAt,
        updatedAt: target.updatedAt,
        progress,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

