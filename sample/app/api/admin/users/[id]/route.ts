import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/admin';
import type { UserPlan } from '@/lib/plan';

function isPlan(v: unknown): v is UserPlan {
  return v === 'free' || v === 'pro' || v === 'premium';
}

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } }
) {
  try {
    await requireSuperAdmin();

    const body = (await req.json().catch(() => ({}))) as {
      plan?: UserPlan;
      subscriptionStatus?: 'inactive' | 'active' | 'past_due' | 'canceled';
      role?: 'user' | 'super_admin';
    };

    const updates: Record<string, unknown> = {};

    if (typeof body.role === 'string') {
      if (body.role !== 'user' && body.role !== 'super_admin') {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updates.role = body.role;
    }

    if (body.plan !== undefined) {
      if (!isPlan(body.plan)) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }
      updates.plan = body.plan;

      // If downgrading to free, clear paid subscription state.
      if (body.plan === 'free') {
        updates.subscriptionStatus = 'inactive';
        updates.paddleSubscriptionId = null;
        updates.paddlePriceId = null;
        updates.currentPeriodEnd = null;
      }
    }

    if (body.subscriptionStatus !== undefined) {
      if (
        body.subscriptionStatus !== 'inactive' &&
        body.subscriptionStatus !== 'active' &&
        body.subscriptionStatus !== 'past_due' &&
        body.subscriptionStatus !== 'canceled'
      ) {
        return NextResponse.json(
          { error: 'Invalid subscriptionStatus' },
          { status: 400 }
        );
      }
      updates.subscriptionStatus = body.subscriptionStatus;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: ctx.params.id },
      data: updates as any,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        role: true,
      },
    });

    return NextResponse.json({ user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const status = msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

