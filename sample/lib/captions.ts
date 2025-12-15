import { getSubtitles } from 'youtube-caption-extractor';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getSubtitlesWithFallback(params: {
  videoID: string;
  lang?: string;
}): Promise<{
  subtitles: any[];
  usedLang: string;
  triedLangs: string[];
  attempts: Array<{
    lang: string;
    attempt: number;
    ok: boolean;
    count?: number;
    error?: string;
  }>;
}> {
  const requested = (params.lang || 'en').toString().trim();

  // Try a small, high-signal fallback chain.
  // Note: some sources expose auto-captions as `a.en`.
  const candidates = Array.from(
    new Set([
      requested,
      requested.toLowerCase(),
      'en',
      'a.en',
      'en-US',
      'en-GB',
    ].filter(Boolean))
  );

  const attempts: Array<{
    lang: string;
    attempt: number;
    ok: boolean;
    count?: number;
    error?: string;
  }> = [];

  let lastErr: unknown = null;
  for (const lang of candidates) {
    // Retries help with intermittent YouTube throttling / transient fetch failures.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const subs = await getSubtitles({ videoID: params.videoID, lang });
        const count = Array.isArray(subs) ? subs.length : 0;
        attempts.push({ lang, attempt, ok: count > 0, count });
        if (count > 0) {
          return {
            subtitles: subs as any[],
            usedLang: lang,
            triedLangs: candidates,
            attempts,
          };
        }
      } catch (e) {
        lastErr = e;
        attempts.push({
          lang,
          attempt,
          ok: false,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
        // Backoff (small) before retrying the same lang
        await sleep(250 * attempt);
      }
    }
  }

  // As a last attempt, try without specifying lang (library-dependent).
  try {
    const subs = await (getSubtitles as any)({ videoID: params.videoID });
    const count = Array.isArray(subs) ? subs.length : 0;
    attempts.push({ lang: '(auto)', attempt: 1, ok: count > 0, count });
    if (count > 0) {
      return {
        subtitles: subs as any[],
        usedLang: requested || 'unknown',
        triedLangs: candidates,
        attempts,
      };
    }
  } catch (e) {
    lastErr = e;
    attempts.push({
      lang: '(auto)',
      attempt: 1,
      ok: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    });
  }

  const msg =
    lastErr instanceof Error
      ? lastErr.message
      : `No captions found (tried: ${candidates.join(', ')})`;
  throw new Error(
    `No captions found. tried=${candidates.join(', ')} lastError=${msg}`
  );
}

