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

  const requestBody = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature,
    max_tokens: params.max_tokens,
    response_format: params.response_format,
  };

  // Retry logic for transient failures
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 2), 5000);
        console.log(`[openrouter] Retry attempt ${attempt}/${maxRetries} after ${delay}ms`, {
          model: params.model,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        const base = `OpenRouter API Error: ${resp.status} ${text}`.trim();
        
        // Retry on 5xx errors and rate limits
        if ((resp.status >= 500 && resp.status < 600) || resp.status === 429) {
          if (attempt < maxRetries) {
            lastError = new Error(`${base} (attempt ${attempt}/${maxRetries})`);
            continue;
          }
        }
        
        if (resp.status === 401) {
          throw new Error(
            `${base}\n\nAuth hint: this usually means your OPENROUTER_API_KEY is invalid OR your Next dev server is running with an old/overridden env var. Verify the key in \`sample/.env\` and fully restart \`npm run dev\`.`
          );
        }
        throw new Error(base);
      }

      const data = (await resp.json()) as OpenRouterChatResponse;
      
      // Log full response for debugging if content is missing
      if (!data.choices || data.choices.length === 0) {
        console.error('[openrouter] No choices in response', {
          status: resp.status,
          response: JSON.stringify(data, null, 2),
          model: params.model,
          attempt,
        });
        throw new Error(`OpenRouter returned no choices. Response: ${JSON.stringify(data)}`);
      }

      const choice = data.choices[0];
      const content = choice?.message?.content;
      
      // Check for empty or null content
      if (!content || (typeof content === 'string' && content.trim().length === 0)) {
        console.error('[openrouter] Empty content in response', {
          status: resp.status,
          model: params.model,
          choice: JSON.stringify(choice, null, 2),
          fullResponse: JSON.stringify(data, null, 2),
          usage: data.usage,
          attempt,
          messageKeys: choice?.message ? Object.keys(choice.message) : [],
        });
        
        // Retry on empty content (might be a transient issue)
        if (attempt < maxRetries) {
          lastError = new Error(
            `OpenRouter returned empty content (attempt ${attempt}/${maxRetries}). Model: ${params.model}`
          );
          continue;
        }
        
        throw new Error(
          `OpenRouter returned empty content after ${maxRetries} attempts. Model: ${params.model}, Choice: ${JSON.stringify(choice)}`
        );
      }

      // Log successful response for debugging (only on first attempt to avoid spam)
      if (attempt === 1) {
        console.log('[openrouter] Success', {
          model: params.model,
          contentLength: content.length,
          usage: data.usage,
        });
      }

      return { content, usage: normalizeUsage(data.usage) };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on non-retryable errors
      if (
        lastError.message.includes('401') ||
        lastError.message.includes('400') ||
        (lastError.message.includes('403') && attempt === 1)
      ) {
        throw lastError;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error('OpenRouter request failed after retries');
}

export async function callOpenRouterChat(
  params: OpenRouterChatParams
): Promise<string> {
  const r = await callOpenRouterChatDetailed(params);
  return r.content;
}


