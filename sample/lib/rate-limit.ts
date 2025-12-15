import { prisma } from '@/lib/db';
import { getLimitsForPlan, type LimitWindow, type UserPlan } from '@/lib/plan';

function utcDayStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function utcNextDayStart(d = new Date()): Date {
  const start = utcDayStart(d);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

function utcMonthStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function utcNextMonthStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

export async function assertGenerationLimit(params: {
  userId: string;
  plan: UserPlan;
}): Promise<{
  remaining: number;
  limit: number;
  used: number;
  window: LimitWindow;
  resetAt: Date;
}> {
  const { limit, window } = getLimitsForPlan(params.plan);
  const now = new Date();

  const windowStart = window === 'daily' ? utcDayStart(now) : utcMonthStart(now);
  const resetAt = window === 'daily' ? utcNextDayStart(now) : utcNextMonthStart(now);

  const used = await prisma.article.count({
    where: {
      userId: params.userId,
      createdAt: { gte: windowStart },
    },
  });

  if (used >= limit) {
    const label = window === 'daily' ? 'day' : 'month';
    throw new Error(
      `Generation limit reached (${limit}/${label}). Your limit resets at ${resetAt.toISOString()}.`
    );
  }

  return {
    remaining: Math.max(0, limit - (used + 1)),
    limit,
    used: used + 1,
    window,
    resetAt,
  };
}

export async function getGenerationUsage(params: {
  userId: string;
  plan: UserPlan;
}): Promise<{
  remaining: number;
  limit: number;
  used: number;
  window: LimitWindow;
  resetAt: Date;
  label: string;
}> {
  const { limit, window } = getLimitsForPlan(params.plan);
  const now = new Date();

  const windowStart = window === 'daily' ? utcDayStart(now) : utcMonthStart(now);
  const resetAt = window === 'daily' ? utcNextDayStart(now) : utcNextMonthStart(now);

  const used = await prisma.article.count({
    where: {
      userId: params.userId,
      createdAt: { gte: windowStart },
    },
  });

  return {
    remaining: Math.max(0, limit - used),
    limit,
    used,
    window,
    resetAt,
    label: formatPlanLimitLabel({ limit, window }),
  };
}

export function formatPlanLimitLabel(params: {
  limit: number;
  window: LimitWindow;
}): string {
  return params.window === 'daily'
    ? `${params.limit}/day`
    : `${params.limit}/month`;
}
