import { callOpenRouterChat } from '@/lib/openrouter';
import { isNumber, isRecord, isString, tryParseJson } from '@/lib/json';

export interface Chapter {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  thesis: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
}

interface ChaptersPayload {
  chapters: Chapter[];
}

function normalizeKeywords(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .slice(0, 12);
}

function validateChaptersPayload(v: unknown): ChaptersPayload {
  if (!isRecord(v) || !Array.isArray(v.chapters)) {
    throw new Error('Chaptering model did not return { chapters: [...] }');
  }

  const chapters: Chapter[] = [];
  for (const raw of v.chapters) {
    if (!isRecord(raw)) continue;

    const id = isString(raw.id) ? raw.id.trim() : '';
    const title = isString(raw.title) ? raw.title.trim() : '';
    const thesis = isString(raw.thesis) ? raw.thesis.trim() : '';
    const primaryKeyword = isString(raw.primaryKeyword)
      ? raw.primaryKeyword.trim()
      : '';

    const startSec = isNumber(raw.startSec) ? raw.startSec : NaN;
    const endSec = isNumber(raw.endSec) ? raw.endSec : NaN;

    if (!id || !title || !thesis || !primaryKeyword) continue;
    if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) continue;
    if (endSec <= startSec) continue;

    chapters.push({
      id,
      title,
      startSec,
      endSec,
      thesis,
      primaryKeyword,
      secondaryKeywords: normalizeKeywords(raw.secondaryKeywords),
    });
  }

  if (chapters.length < 2) {
    throw new Error('Chaptering produced too few chapters');
  }

  chapters.sort((a, b) => a.startSec - b.startSec);

  // Basic non-overlap sanity checks
  for (let i = 0; i < chapters.length - 1; i++) {
    if (chapters[i].endSec > chapters[i + 1].startSec + 1) {
      throw new Error('Chaptering produced overlapping chapters');
    }
  }

  return { chapters };
}

export async function generateChapters(params: {
  transcriptWithTimestamps: string;
  videoTitle?: string;
  totalDurationSec: number;
  model?: string;
}): Promise<Chapter[]> {
  const model = params.model || process.env.OPENROUTER_MODEL_CHAPTERS;
  if (!model) throw new Error('Missing OPENROUTER_MODEL_CHAPTERS');

  const system = `You are an expert content strategist. Your task is to segment a YouTube transcript into semantic chapters based on topic shifts and narrative structure.\n\nHard requirements:\n- Chapters MUST be based on meaning/topic shifts, not arbitrary time windows.\n- Chapters MUST cover the full timeline from 0s to the end with no gaps > 10 seconds.\n- Chapters MUST NOT overlap.\n- Prefer 4–6 chapters (MAX 6). Never output more than 6 chapters.\n- Each chapter title must be specific and content-accurate.\n- Extract SEO keyword targets per chapter.\n\nOutput format:\n- Respond with VALID JSON ONLY.\n- JSON must match this exact schema:\n{\n  \"chapters\": [\n    {\n      \"id\": \"c1\",\n      \"title\": \"Clear, specific section title\",\n      \"startSec\": 0,\n      \"endSec\": 123,\n      \"thesis\": \"One sentence stating the core claim of this section\",\n      \"primaryKeyword\": \"primary keyword phrase\",\n      \"secondaryKeywords\": [\"keyword 1\", \"keyword 2\"]\n    }\n  ]\n}\n\nConstraints:\n- startSec/endSec are numbers in seconds.\n- The first chapter must start at 0.\n- The last chapter must end at ${Math.floor(
    params.totalDurationSec
  )} (or within 5 seconds of the end).\n- Minimum chapter length: 60 seconds unless the video is very short.\n- secondaryKeywords: 3–8 items, no duplicates.\n`;

  const user = `Video title: ${params.videoTitle || 'Unknown'}\nTotal duration (seconds): ${Math.floor(
    params.totalDurationSec
  )}\n\nTranscript (with timestamps):\n${params.transcriptWithTimestamps}`;

  const content = await callOpenRouterChat({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.2,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const parsed = tryParseJson<ChaptersPayload>(content);
  if (!parsed) throw new Error('Failed to parse chaptering JSON');

  const validated = validateChaptersPayload(parsed);
  let chapters = validated.chapters;

  // If the model returns more than 6 chapters, merge adjacent chapters down to 6.
  // We preserve full coverage and non-overlap, sacrificing granularity rather than truncating.
  while (chapters.length > 6) {
    // Pick the shortest chapter to merge (smallest duration).
    let minIdx = 0;
    let minDur = chapters[0].endSec - chapters[0].startSec;
    for (let i = 1; i < chapters.length; i++) {
      const d = chapters[i].endSec - chapters[i].startSec;
      if (d < minDur) {
        minDur = d;
        minIdx = i;
      }
    }

    // Merge the shortest chapter into the previous chapter when possible; otherwise into the next.
    const idx = minIdx;
    const mergeIntoPrev = idx > 0;
    const leftIdx = mergeIntoPrev ? idx - 1 : idx;
    const rightIdx = mergeIntoPrev ? idx : idx + 1;

    const a = chapters[leftIdx];
    const b = chapters[rightIdx];
    if (!a || !b) break;

    const merged: Chapter = {
      id: a.id,
      title: `${a.title}: ${b.title}`,
      startSec: a.startSec,
      endSec: b.endSec,
      thesis: `${a.thesis} ${b.thesis}`.trim(),
      primaryKeyword: a.primaryKeyword || b.primaryKeyword,
      secondaryKeywords: Array.from(
        new Set([...(a.secondaryKeywords || []), ...(b.secondaryKeywords || [])])
      ).slice(0, 12),
    };

    const next: Chapter[] = [];
    for (let i = 0; i < chapters.length; i++) {
      if (i === leftIdx) {
        next.push(merged);
        continue;
      }
      if (i === rightIdx) continue;
      next.push(chapters[i]);
    }

    chapters = next.sort((x, y) => x.startSec - y.startSec);
  }

  // Enforce start=0 and end~duration with gentle normalization
  chapters[0].startSec = 0;
  const last = chapters[chapters.length - 1];
  if (Math.abs(last.endSec - params.totalDurationSec) <= 5) {
    last.endSec = params.totalDurationSec;
  }

  return chapters;
}


