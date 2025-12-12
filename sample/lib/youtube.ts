const YT_ID_RE =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/i;

export function parseYouTubeUrl(url: string): { videoId: string } {
  const trimmed = (url || '').trim();
  if (!trimmed) throw new Error('Missing YouTube URL');

  const match = trimmed.match(YT_ID_RE);
  if (!match?.[1]) throw new Error('Invalid YouTube URL');

  return { videoId: match[1] };
}


