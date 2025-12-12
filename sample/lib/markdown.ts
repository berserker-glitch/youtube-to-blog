import type { Chapter } from '@/lib/chaptering';

export function slugify(input: string): string {
  const s = (input || '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
  return s || 'youtube-to-blog';
}

export function formatH1Title(title: string): string {
  const t = (title || '').trim();
  return t ? `# ${t}` : '# YouTube Article';
}

export function assembleMarkdown(params: {
  articleTitle: string;
  intro: string;
  chapters: Chapter[];
  sections: string[]; // should include ## headers inside
  conclusion: string; // should include ## Conclusion
  video?: { title?: string; description?: string; url?: string };
}): string {
  const parts: string[] = [];

  parts.push(formatH1Title(params.articleTitle));

  if (params.video?.url || params.video?.title) {
    const meta: string[] = [];
    if (params.video.url) meta.push(`Source: ${params.video.url}`);
    if (params.video.title) meta.push(`Video title: ${params.video.title}`);
    parts.push(meta.join('\n'));
  }

  parts.push((params.intro || '').trim());

  // Optional: a light table of contents without being bullet-heavy
  if (params.chapters?.length) {
    const toc = params.chapters
      .map((c) => `- ${c.title}`)
      .join('\n')
      .trim();
    parts.push(`## Outline\n${toc}`);
  }

  for (const s of params.sections || []) {
    const trimmed = (s || '').trim();
    if (trimmed) parts.push(trimmed);
  }

  parts.push((params.conclusion || '').trim());

  return parts
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .concat('\n');
}


