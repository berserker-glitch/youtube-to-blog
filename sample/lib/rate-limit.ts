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
  // Default limit: 100/day (can be overridden by plan-based limits)
  const limit = params.limit ?? 100;

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



