import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin';
import { getUiConfig, setUiConfig } from '@/lib/app-config';

export async function GET() {
  try {
    await requireSuperAdmin();
    const ui = await getUiConfig();
    return NextResponse.json({ ui });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const status = msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PUT(req: Request) {
  try {
    await requireSuperAdmin();
    const body = (await req.json().catch(() => ({}))) as {
      showArticleCost?: boolean;
    };
    const ui = await setUiConfig({ showArticleCost: body.showArticleCost });
    return NextResponse.json({ ui });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const status = msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

