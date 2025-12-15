import { getOpenRouterConfig } from '@/lib/openrouter';
import { parseOpenRouterModelId } from '@/lib/openrouter-models';

export type OpenRouterModelPricing = {
  promptUsdPerToken: number;
  completionUsdPerToken: number;
  requestUsd: number;
  raw?: {
    prompt?: string;
    completion?: string;
    request?: string;
    image?: string;
  };
};

type EndpointsResponse = {
  data?: {
    id?: string;
    endpoints?: Array<{
      pricing?: {
        prompt?: string;
        completion?: string;
        request?: string;
        image?: string;
      };
    }>;
  };
};

const pricingCache = new Map<string, OpenRouterModelPricing>();

function toNum(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : 0;
}

export async function getOpenRouterModelPricing(
  modelId: string
): Promise<OpenRouterModelPricing | null> {
  const key = modelId.trim();
  if (!key) return null;
  const cached = pricingCache.get(key);
  if (cached) return cached;

  const parsed = parseOpenRouterModelId(key);
  if (!parsed) return null;

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
  if (!resp.ok) return null;

  const json = (await resp.json().catch(() => ({}))) as EndpointsResponse;
  const pricing = json?.data?.endpoints?.[0]?.pricing || {};

  const out: OpenRouterModelPricing = {
    promptUsdPerToken: toNum(pricing.prompt),
    completionUsdPerToken: toNum(pricing.completion),
    requestUsd: toNum(pricing.request),
    raw: {
      prompt: pricing.prompt,
      completion: pricing.completion,
      request: pricing.request,
      image: pricing.image,
    },
  };

  pricingCache.set(key, out);
  return out;
}

export function computeOpenRouterCostUsd(params: {
  pricing: OpenRouterModelPricing;
  promptTokens: number;
  completionTokens: number;
}): number {
  const prompt = Math.max(0, params.promptTokens) * params.pricing.promptUsdPerToken;
  const completion =
    Math.max(0, params.completionTokens) * params.pricing.completionUsdPerToken;
  const request = params.pricing.requestUsd;
  return prompt + completion + request;
}

