import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { getAppServerSession } from '@/lib/auth-helpers';
import { normalizeWpSiteUrl, wpBasicAuthHeader, wpFetchJson } from '@/lib/wordpress';

export async function POST(req: NextRequest) {
  try {
    const session = await getAppServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const siteUrl = normalizeWpSiteUrl(String(body?.siteUrl || ''));
    const username = String(body?.username || '');
    const appPassword = String(body?.appPassword || '');

    const auth = wpBasicAuthHeader(username, appPassword);
    const me = await wpFetchJson<{ id: number; name?: string; email?: string }>(
      {
        siteUrl,
        path: '/wp-json/wp/v2/users/me',
        method: 'GET',
        headers: { Authorization: auth },
      }
    );

    return NextResponse.json({
      ok: true,
      siteUrl,
      wpUser: { id: me.id, name: me.name, email: me.email },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}





