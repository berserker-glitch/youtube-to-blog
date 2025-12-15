export type UserPlan = 'free' | 'pro' | 'premium';

export interface PlanModelRouting {
  chaptersModel: string;
  writerModel: string;
  feedbackModel: string;
}

export type LimitWindow = 'daily' | 'monthly';

export interface PlanLimit {
  limit: number;
  window: LimitWindow;
}

export function getModelsForPlan(plan: UserPlan): PlanModelRouting {
  const chaptersModel = 'google/gemini-2.0-flash-001';

  if (plan === 'free') {
    return {
      chaptersModel,
      writerModel: 'moonshotai/kimi-k2-thinking',
      feedbackModel: 'moonshotai/kimi-k2-thinking',
    };
  }

  // Pro and Premium use the same writer; feedback stays on Kimi.
  return {
    chaptersModel,
    writerModel: 'openai/gpt-5.2',
    feedbackModel: 'moonshotai/kimi-k2-thinking',
  };
}

export function getLimitsForPlan(plan: UserPlan): PlanLimit {
  if (plan === 'free') return { limit: 4, window: 'monthly' };
  if (plan === 'pro') return { limit: 2, window: 'daily' };
  return { limit: 5, window: 'daily' };
}
