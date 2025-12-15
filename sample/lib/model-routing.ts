import { prisma } from '@/lib/db';
import { getModelsForPlan, type PlanModelRouting, type UserPlan } from '@/lib/plan';

export interface StoredRouting {
  plan: UserPlan;
  chaptersModel: string;
  writerModel: string;
  feedbackModel: string;
}

function toStored(plan: UserPlan, r: PlanModelRouting): StoredRouting {
  return {
    plan,
    chaptersModel: r.chaptersModel,
    writerModel: r.writerModel,
    feedbackModel: r.feedbackModel,
  };
}

export async function ensureDefaultModelRoutingRows(): Promise<void> {
  const plans: UserPlan[] = ['free', 'pro', 'premium'];

  await Promise.all(
    plans.map(async (plan) => {
      const defaults = getModelsForPlan(plan);
      await prisma.planModelRouting.upsert({
        where: { plan },
        create: {
          plan,
          chaptersModel: defaults.chaptersModel,
          writerModel: defaults.writerModel,
          feedbackModel: defaults.feedbackModel,
        },
        update: {},
      });
    })
  );
}

export async function getModelRoutingForPlan(plan: UserPlan): Promise<StoredRouting> {
  const defaults = getModelsForPlan(plan);

  const row = await prisma.planModelRouting.findUnique({
    where: { plan },
    select: {
      plan: true,
      chaptersModel: true,
      writerModel: true,
      feedbackModel: true,
    },
  });

  if (!row) {
    // If DB wasn't initialized yet, fall back to defaults.
    return toStored(plan, defaults);
  }

  return {
    plan: row.plan as UserPlan,
    chaptersModel: row.chaptersModel,
    writerModel: row.writerModel,
    feedbackModel: row.feedbackModel,
  };
}

export async function getAllModelRoutings(): Promise<StoredRouting[]> {
  const rows = await prisma.planModelRouting.findMany({
    orderBy: { plan: 'asc' },
    select: {
      plan: true,
      chaptersModel: true,
      writerModel: true,
      feedbackModel: true,
    },
  });

  const found = new Map<UserPlan, StoredRouting>();
  for (const r of rows) {
    found.set(r.plan as UserPlan, {
      plan: r.plan as UserPlan,
      chaptersModel: r.chaptersModel,
      writerModel: r.writerModel,
      feedbackModel: r.feedbackModel,
    });
  }

  // Ensure stable output (and sensible defaults if missing)
  return (['free', 'pro', 'premium'] as UserPlan[]).map((plan) =>
    found.get(plan) || toStored(plan, getModelsForPlan(plan))
  );
}

export async function updateModelRouting(params: {
  plan: UserPlan;
  chaptersModel: string;
  writerModel: string;
  feedbackModel: string;
}): Promise<StoredRouting> {
  const row = await prisma.planModelRouting.upsert({
    where: { plan: params.plan },
    create: {
      plan: params.plan,
      chaptersModel: params.chaptersModel,
      writerModel: params.writerModel,
      feedbackModel: params.feedbackModel,
    },
    update: {
      chaptersModel: params.chaptersModel,
      writerModel: params.writerModel,
      feedbackModel: params.feedbackModel,
    },
    select: {
      plan: true,
      chaptersModel: true,
      writerModel: true,
      feedbackModel: true,
    },
  });

  return {
    plan: row.plan as UserPlan,
    chaptersModel: row.chaptersModel,
    writerModel: row.writerModel,
    feedbackModel: row.feedbackModel,
  };
}
