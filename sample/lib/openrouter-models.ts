import { getOpenRouterConfig } from '@/lib/openrouter';

type EndpointsResponse = {
  data?: {
    id?: string;
    name?: string;
    endpoints?: Array<{
      status?: string | number;
      uptime_last_30m?: number;
    }>;
  };
};

export type OpenRouterModelValidation =
  | { ok: true; id: string; name?: string }
  | { ok: false; error: string };

export function parseOpenRouterModelId(modelId: string): {
  author: string;
  slug: string;
} | null {
  const trimmed = modelId.trim();
  const parts = trimmed.split('/');
  if (parts.length !== 2) return null;
  const [author, slug] = parts.map((p) => p.trim());
  if (!author || !slug) return null;
  return { author, slug };
}

export async function validateOpenRouterModelId(
  modelId: string
): Promise<OpenRouterModelValidation> {
  const parsed = parseOpenRouterModelId(modelId);
  if (!parsed) {
    return {
      ok: false,
      error: 'Model id must be in the form "author/slug" (e.g. "openai/gpt-4.1").',
    };
  }

  const cfg = getOpenRouterConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
  };
  if (cfg.referer) headers['HTTP-Referer'] = cfg.referer;
  if (cfg.title) headers['X-Title'] = cfg.title;

  const url = `https://openrouter.ai/api/v1/models/${encodeURIComponent(
    parsed.author
  )}/${encodeURIComponent(parsed.slug)}/endpoints`;

  const resp = await fetch(url, { method: 'GET', headers });
  if (!resp.ok) {
    // 404/400 -> invalid model; other errors -> surface
    const text = await resp.text().catch(() => '');
    if (resp.status === 404 || resp.status === 400) {
      return { ok: false, error: `Unknown OpenRouter model: ${modelId}` };
    }
    if (resp.status === 401) {
      return { ok: false, error: 'OpenRouter auth failed (check OPENROUTER_API_KEY).' };
    }
    return {
      ok: false,
      error: `OpenRouter validation failed: ${resp.status} ${text}`.trim(),
    };
  }

  const json = (await resp.json().catch(() => ({}))) as EndpointsResponse;
  const id = (json?.data?.id || '').toString().trim();
  const name = (json?.data?.name || '').toString().trim() || undefined;
  if (!id) return { ok: false, error: `OpenRouter returned no id for ${modelId}` };

  // Defensive check: ensure the returned id matches what we requested.
  if (id !== modelId.trim()) {
    return { ok: false, error: `Model mismatch: requested ${modelId}, got ${id}` };
  }

  return { ok: true, id, name };
}

