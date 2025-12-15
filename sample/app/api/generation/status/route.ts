import { NextResponse } from 'next/server';
import { getAppServerSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getAppServerSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const inProgress = await prisma.article.findFirst({
      where: { userId, status: 'draft' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        videoUrl: true,
        createdAt: true,
        updatedAt: true,
        metaJson: true,
      },
    });

    if (!inProgress) return NextResponse.json({ inProgress: false });

    const progress = (inProgress.metaJson as any)?.generationProgress || null;

    return NextResponse.json({
      inProgress: true,
      article: {
        id: inProgress.id,
        title: inProgress.title,
        videoUrl: inProgress.videoUrl,
        createdAt: inProgress.createdAt,
        updatedAt: inProgress.updatedAt,
        progress,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

