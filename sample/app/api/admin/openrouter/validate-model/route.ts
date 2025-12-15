import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin';
import { validateOpenRouterModelId } from '@/lib/openrouter-models';

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    const body = (await req.json().catch(() => ({}))) as { model?: string };
    const model = (body?.model || '').toString().trim();
    if (!model) {
      return NextResponse.json({ error: 'Missing model' }, { status: 400 });
    }

    const result = await validateOpenRouterModelId(model);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: result.id, name: result.name });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const status = msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

