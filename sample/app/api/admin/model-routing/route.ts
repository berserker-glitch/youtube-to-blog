import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin';
import {
  ensureDefaultModelRoutingRows,
  getAllModelRoutings,
  updateModelRouting,
} from '@/lib/model-routing';
import type { UserPlan } from '@/lib/plan';

function isPlan(v: unknown): v is UserPlan {
  return v === 'free' || v === 'pro' || v === 'premium';
}

export async function GET() {
  try {
    await requireSuperAdmin();
    await ensureDefaultModelRoutingRows();
    const routings = await getAllModelRoutings();
    return NextResponse.json({ routings });
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
      plan?: UserPlan;
      chaptersModel?: string;
      writerModel?: string;
      feedbackModel?: string;
    };

    if (!isPlan(body.plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    const chaptersModel = (body.chaptersModel || '').toString().trim();
    const writerModel = (body.writerModel || '').toString().trim();
    const feedbackModel = (body.feedbackModel || '').toString().trim();

    if (!chaptersModel || !writerModel || !feedbackModel) {
      return NextResponse.json(
        { error: 'Missing chaptersModel/writerModel/feedbackModel' },
        { status: 400 }
      );
    }

    const updated = await updateModelRouting({
      plan: body.plan,
      chaptersModel,
      writerModel,
      feedbackModel,
    });

    return NextResponse.json({ routing: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const status = msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

