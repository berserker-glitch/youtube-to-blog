import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { getAppServerSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { normalizeWpSiteUrl } from '@/lib/wordpress';

export async function POST(req: NextRequest) {
  try {
    const session = await getAppServerSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const siteUrlRaw = String(body?.siteUrl || '');

    if (siteUrlRaw) {
      const siteUrl = normalizeWpSiteUrl(siteUrlRaw);
      await prisma.wordpressIntegration.deleteMany({ where: { userId, siteUrl } });
      return NextResponse.json({ ok: true });
    }

    // If no siteUrl is provided, disconnect all.
    await prisma.wordpressIntegration.deleteMany({ where: { userId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}






