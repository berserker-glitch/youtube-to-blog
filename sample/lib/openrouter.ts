export type OpenRouterRole = 'system' | 'user' | 'assistant';

export interface OpenRouterMessage {
  role: OpenRouterRole;
  content: string;
}

type ResponseFormat =
  | { type: 'json_object' }
  // Keep the type open for future expansion
  | Record<string, unknown>;

export interface OpenRouterChatParams {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: ResponseFormat;
}

export interface OpenRouterChatChoice {
  message?: { content?: string };
}

export interface OpenRouterChatResponse {
  choices?: OpenRouterChatChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterChatResult {
  content: string;
  usage?: OpenRouterUsage;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export function getOpenRouterConfig() {
  return {
    apiKey: requireEnv('OPENROUTER_API_KEY'),
    referer: process.env.OPENROUTER_REFERER,
    title: process.env.OPENROUTER_TITLE,
  };
}

function normalizeUsage(v: OpenRouterChatResponse['usage']): OpenRouterUsage | undefined {
  if (!v) return undefined;
  const prompt = typeof v.prompt_tokens === 'number' ? v.prompt_tokens : NaN;
  const completion =
    typeof v.completion_tokens === 'number' ? v.completion_tokens : NaN;
  const total = typeof v.total_tokens === 'number' ? v.total_tokens : NaN;
  if (!Number.isFinite(prompt) || !Number.isFinite(completion) || !Number.isFinite(total)) {
    return undefined;
  }
  return { prompt_tokens: prompt, completion_tokens: completion, total_tokens: total };
}

export async function callOpenRouterChatDetailed(
  params: OpenRouterChatParams
): Promise<OpenRouterChatResult> {
  const cfg = getOpenRouterConfig();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cfg.apiKey}`,
  };

  if (cfg.referer) headers['HTTP-Referer'] = cfg.referer;
  if (cfg.title) headers['X-Title'] = cfg.title;

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const base = `OpenRouter API Error: ${resp.status} ${text}`.trim();
    if (resp.status === 401) {
      throw new Error(
        `${base}\n\nAuth hint: this usually means your OPENROUTER_API_KEY is invalid OR your Next dev server is running with an old/overridden env var. Verify the key in \`sample/.env\` and fully restart \`npm run dev\`.`
      );
    }
    throw new Error(base);
  }

  const data = (await resp.json()) as OpenRouterChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned an empty response');

  return { content, usage: normalizeUsage(data.usage) };
}

export async function callOpenRouterChat(
  params: OpenRouterChatParams
): Promise<string> {
  const r = await callOpenRouterChatDetailed(params);
  return r.content;
}


