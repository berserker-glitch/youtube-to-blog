// Legacy regex retained as a fallback.
const YT_ID_RE =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/i;

export function parseYouTubeUrl(url: string): { videoId: string } {
  const trimmed = (url || '').trim();
  if (!trimmed) throw new Error('Missing YouTube URL');

  // Prefer structured parsing so we support newer share URLs like:
  // https://youtu.be/VIDEOID?si=...
  try {
    const u = new URL(trimmed);

    // youtu.be short link
    if (u.hostname.includes('youtu.be')) {
      const slug = u.pathname.split('/').filter(Boolean)[0] || '';
      if (slug.length >= 11) {
        return { videoId: slug.substring(0, 11) };
      }
    }

    // Standard youtube.com URLs
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
      const vParam = u.searchParams.get('v');
      if (vParam && vParam.length >= 11) {
        return { videoId: vParam.substring(0, 11) };
      }

      // Shorts: /shorts/VIDEOID
      if (u.pathname.startsWith('/shorts/')) {
        const slug = u.pathname.split('/').filter(Boolean)[1] || '';
        if (slug.length >= 11) {
          return { videoId: slug.substring(0, 11) };
        }
      }
    }
  } catch {
    // Ignore URL parse errors and fall back to regex below.
  }

  // Fallback to legacy regex for any remaining formats
  const match = trimmed.match(YT_ID_RE);
  if (!match?.[1]) throw new Error('Invalid YouTube URL');

  return { videoId: match[1] };
}

