export function tryParseJson<T = unknown>(text: string): T | null {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;

  // Common failure mode: model wraps JSON in markdown fences
  const unfenced = trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  try {
    return JSON.parse(unfenced) as T;
  } catch {
    return null;
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}


