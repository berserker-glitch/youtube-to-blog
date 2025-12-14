type Bucket = {
  dayKey: string;
  count: number;
};

const buckets = new Map<string, Bucket>();

function todayKey(d = new Date()): string {
  // yyyy-mm-dd in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function assertDailyLimit(params: {
  userId: string;
  limit?: number;
}): { remaining: number; limit: number } {
  // Production guardrail: hard-cap at 2/day unless you explicitly pass a smaller limit.
  // (User requirement: block users to only 2 articles per day.)
  const limit = Math.min(params.limit ?? 2, 2);

  const dayKey = todayKey();
  const existing = buckets.get(params.userId);

  if (!existing || existing.dayKey !== dayKey) {
    buckets.set(params.userId, { dayKey, count: 1 });
    return { remaining: Math.max(0, limit - 1), limit };
  }

  if (existing.count >= limit) {
    throw new Error(`Daily generation limit reached (${limit}/day).`);
  }

  existing.count += 1;
  buckets.set(params.userId, existing);
  return { remaining: Math.max(0, limit - existing.count), limit };
}



