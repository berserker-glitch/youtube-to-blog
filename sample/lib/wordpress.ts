export function normalizeWpSiteUrl(input: string): string {
  const s = (input || '').trim();
  if (!s) throw new Error('WordPress site URL is required.');
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    throw new Error('Invalid WordPress site URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('WordPress site URL must start with http:// or https://');
  }
  // Drop trailing slash for consistent storage.
  return url.toString().replace(/\/$/, '');
}

export function wpBasicAuthHeader(username: string, appPassword: string): string {
  const u = (username || '').trim();
  const p = (appPassword || '').trim().replace(/\s+/g, '');
  if (!u) throw new Error('WordPress username is required.');
  if (!p) throw new Error('WordPress application password is required.');
  const token = Buffer.from(`${u}:${p}`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

export async function wpFetchJson<T>(params: {
  siteUrl: string;
  path: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
}): Promise<T> {
  const url = `${params.siteUrl}${params.path.startsWith('/') ? '' : '/'}${params.path}`;
  const res = await fetch(url, {
    method: params.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(params.headers || {}),
    },
    body: params.body ? JSON.stringify(params.body) : undefined,
    cache: 'no-store',
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      (json && (json.message || json.error)) ||
      `WordPress request failed (${res.status}).`;
    throw new Error(msg);
  }
  return json as T;
}






