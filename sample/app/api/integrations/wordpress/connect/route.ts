import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { getAppServerSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { encryptSecret } from '@/lib/secrets';
import { normalizeWpSiteUrl, wpBasicAuthHeader, wpFetchJson } from '@/lib/wordpress';

export async function POST(req: NextRequest) {
  try {
    const session = await getAppServerSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const siteUrl = normalizeWpSiteUrl(String(body?.siteUrl || ''));
    const username = String(body?.username || '');
    const appPassword = String(body?.appPassword || '');

    // Verify creds before storing.
    const auth = wpBasicAuthHeader(username, appPassword);
    const me = await wpFetchJson<{ id: number; name?: string; email?: string }>(
      {
        siteUrl,
        path: '/wp-json/wp/v2/users/me',
        method: 'GET',
        headers: { Authorization: auth },
      }
    );

    const integration = await prisma.wordpressIntegration.upsert({
      where: { userId_siteUrl: { userId, siteUrl } },
      create: {
        userId,
        siteUrl,
        username: username.trim(),
        appPasswordEnc: encryptSecret(appPassword),
        lastVerifiedAt: new Date(),
        wpUserId: me.id,
      },
      update: {
        username: username.trim(),
        appPasswordEnc: encryptSecret(appPassword),
        lastVerifiedAt: new Date(),
        wpUserId: me.id,
      },
      select: { id: true, siteUrl: true, username: true, lastVerifiedAt: true, wpUserId: true },
    });

    return NextResponse.json({ ok: true, integration });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}






