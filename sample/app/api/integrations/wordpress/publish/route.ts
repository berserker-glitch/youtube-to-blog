import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { getAppServerSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { decryptSecret } from '@/lib/secrets';
import { markdownToHtml } from '@/lib/markdown-to-html';
import { normalizeWpSiteUrl, wpBasicAuthHeader, wpFetchJson } from '@/lib/wordpress';

export async function POST(req: NextRequest) {
  try {
    const session = await getAppServerSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const articleId = String(body?.articleId || '');
    const statusRaw = String(body?.status || 'draft');
    const status = statusRaw === 'publish' ? 'publish' : 'draft';
    const siteUrlInput = body?.siteUrl ? String(body.siteUrl) : '';

    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required.' }, { status: 400 });
    }

    const article = await prisma.article.findFirst({
      where: { id: articleId, userId },
      select: { id: true, title: true, slug: true, markdown: true },
    });
    if (!article) return NextResponse.json({ error: 'Article not found.' }, { status: 404 });

    const integration = await (async () => {
      if (siteUrlInput) {
        const siteUrl = normalizeWpSiteUrl(siteUrlInput);
        return prisma.wordpressIntegration.findFirst({
          where: { userId, siteUrl },
          select: { id: true, siteUrl: true, username: true, appPasswordEnc: true },
        });
      }
      return prisma.wordpressIntegration.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, siteUrl: true, username: true, appPasswordEnc: true },
      });
    })();

    if (!integration) {
      return NextResponse.json(
        { error: 'No WordPress site connected. Connect WordPress first.' },
        { status: 400 }
      );
    }

    const appPassword = decryptSecret(integration.appPasswordEnc);
    const auth = wpBasicAuthHeader(integration.username, appPassword);
    const html = await markdownToHtml(article.markdown);

    const created = await wpFetchJson<{
      id: number;
      link: string;
      status: string;
    }>({
      siteUrl: integration.siteUrl,
      path: '/wp-json/wp/v2/posts',
      method: 'POST',
      headers: { Authorization: auth },
      body: {
        title: article.title,
        content: html,
        status,
        slug: article.slug || undefined,
      },
    });

    await prisma.article.update({
      where: { id: article.id },
      data: {
        wordpressIntegrationId: integration.id,
        wordpressPostId: created.id,
        wordpressPostUrl: created.link,
      },
    });

    return NextResponse.json({
      ok: true,
      wordpress: { postId: created.id, url: created.link, status: created.status },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}



