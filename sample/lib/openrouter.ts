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

export async function callOpenRouterChat(
  params: OpenRouterChatParams
): Promise<string> {
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
    throw new Error(`OpenRouter API Error: ${resp.status} ${text}`.trim());
  }

  const data = (await resp.json()) as OpenRouterChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned an empty response');
  return content;
}


