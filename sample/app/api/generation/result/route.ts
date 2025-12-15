import { NextResponse, type NextRequest } from 'next/server';
import { getAppServerSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getAppServerSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const articleId = (url.searchParams.get('articleId') || '').trim();
    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
    }

    const article = await prisma.article.findFirst({
      where: { id: articleId, userId },
      select: { id: true, slug: true, markdown: true, status: true, title: true },
    });
    if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (article.status !== 'complete') {
      return NextResponse.json(
        { error: `Article not ready (status: ${article.status})` },
        { status: 409 }
      );
    }

    const filename = `${article.slug || 'article'}.md`;
    return new Response(article.markdown || '', {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

