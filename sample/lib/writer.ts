import { callOpenRouterChat } from '@/lib/openrouter';
import type { Chapter } from '@/lib/chaptering';

export interface VideoMetaForWriting {
  title?: string;
  description?: string;
}

function strictWriterSystemPrompt() {
  return `You are an expert technical editor and SEO strategist. Your job is to REFORM, STRUCTURE, and OPTIMIZE the provided video transcript content into a high-quality long-form article.\n\nCore instruction:\n- Do NOT try to expand beyond what is given. Do NOT add new topics.\n- Your primary value is: clarity, structure, flow, terminology precision, and SEO optimization.\n- You may add light connective tissue (1–2 sentences at a time) only to improve coherence.\n\nNon-negotiable rules:\n- Tone: authoritative, educational, analytical.\n- Style: text-heavy; long, flowing paragraphs.\n- Do NOT be conversational. No filler. No rhetorical questions. No second-person coaching.\n- No emojis.\n- Avoid excessive bullet points. Bullets are allowed ONLY for technical specs or distinct procedural steps.\n- Use proper Markdown headers with ## and ###.\n\nSEO requirements (hard):\n- The output MUST be SEO-optimized for the video’s actual topic.\n- Use the video title/description as ground truth context for SEO targeting.\n- Infer search intent (informational/commercial/transactional) and write to it.\n- Integrate the provided primary/secondary keywords naturally AND add close variants and relevant entities that are explicitly present in the transcript.\n- Prefer descriptive, keyword-relevant H2/H3 headings. Avoid generic headings.\n- Never keyword-stuff; keep readability and semantic coherence.\n\nFaithfulness (hard):\n- Do not invent facts. If something is not in the transcript slice, do not assert it as true.\n- You may rephrase, reorder, deduplicate, and tighten.\n\nOutput requirements:\n- Output ONLY Markdown.\n- No code fences unless absolutely necessary.\n- No preamble.\n`;
}

export async function writeSection(params: {
  chapter: Chapter;
  transcriptSlice: string;
  video: VideoMetaForWriting;
  overallTargetWords: number;
  targetWords: number;
  model?: string;
}): Promise<string> {
  const model = params.model || process.env.OPENROUTER_MODEL_WRITER;
  if (!model) throw new Error('Missing OPENROUTER_MODEL_WRITER');

  const user = `Overall article constraint:\n- The finished article MUST be approximately ${params.overallTargetWords} words total.\n\nThis section constraint:\n- Target length for THIS section: approximately ${params.targetWords} words (±10%).\n- Before writing, internally plan how to hit the word budget while staying faithful to the transcript.\n\nWrite the section for this chapter.\n\nChapter metadata:\n- Title: ${params.chapter.title}\n- Thesis: ${params.chapter.thesis}\n- Start: ${Math.floor(params.chapter.startSec)}s\n- End: ${Math.floor(params.chapter.endSec)}s\n- Primary keyword: ${params.chapter.primaryKeyword}\n- Secondary keywords: ${(params.chapter.secondaryKeywords || []).join(', ')}\n\nVideo title: ${params.video.title || 'Unknown'}\nVideo description: ${params.video.description || ''}\n\nTranscript slice (with timestamps):\n${params.transcriptSlice}\n\nFormatting requirements:\n- Start with \"## ${params.chapter.title}\".\n- Include multiple ### subheadings where appropriate.\n- Output ONLY Markdown.\n`;

  return await callOpenRouterChat({
    model,
    messages: [
      { role: 'system', content: strictWriterSystemPrompt() },
      { role: 'user', content: user },
    ],
    temperature: 0.6,
    max_tokens: 4000,
  });
}

export async function writeIntroduction(params: {
  articleTitle: string;
  chapters: Chapter[];
  video: VideoMetaForWriting;
  overallTargetWords: number;
  targetWords: number;
  model?: string;
}): Promise<string> {
  const model = params.model || process.env.OPENROUTER_MODEL_WRITER;
  if (!model) throw new Error('Missing OPENROUTER_MODEL_WRITER');

  const chapterList = params.chapters
    .map(
      (c, i) =>
        `${i + 1}. ${c.title} (primary keyword: ${c.primaryKeyword})`
    )
    .join('\n');

  const user = `Overall article constraint:\n- The finished article MUST be approximately ${params.overallTargetWords} words total.\n\nIntroduction constraint:\n- Target length for the introduction: approximately ${params.targetWords} words (±10%).\n- Before writing, internally plan how to set up the full article while respecting the word budget.\n\nWrite a compelling introduction for a long-form article titled:\n${params.articleTitle}\n\nVideo context:\n- Video title: ${params.video.title || 'Unknown'}\n- Video description: ${params.video.description || ''}\n\nPlanned structure (for your awareness):\n${chapterList}\n\nRequirements:\n- Output Markdown only.\n- Do NOT use a header for the introduction.\n- Prefer long, flowing paragraphs.\n`;

  return await callOpenRouterChat({
    model,
    messages: [
      { role: 'system', content: strictWriterSystemPrompt() },
      { role: 'user', content: user },
    ],
    temperature: 0.6,
    max_tokens: 1200,
  });
}

export async function writeConclusion(params: {
  articleTitle: string;
  chapters: Chapter[];
  video: VideoMetaForWriting;
  overallTargetWords: number;
  targetWords: number;
  model?: string;
}): Promise<string> {
  const model = params.model || process.env.OPENROUTER_MODEL_WRITER;
  if (!model) throw new Error('Missing OPENROUTER_MODEL_WRITER');

  const chapterList = params.chapters
    .map((c) => `- ${c.title}: ${c.thesis}`)
    .join('\n');

  const user = `Overall article constraint:\n- The finished article MUST be approximately ${params.overallTargetWords} words total.\n\nConclusion constraint:\n- Target length for the conclusion: approximately ${params.targetWords} words (±10%).\n- Before writing, internally plan how to synthesize the core ideas without repeating.\n\nWrite a synthesized conclusion for the article titled:\n${params.articleTitle}\n\nKey sections and theses:\n${chapterList}\n\nRequirements:\n- Output Markdown only.\n- Start with \"## Conclusion\".\n- Prefer long, flowing paragraphs.\n- No fluff.\n`;

  return await callOpenRouterChat({
    model,
    messages: [
      { role: 'system', content: strictWriterSystemPrompt() },
      { role: 'user', content: user },
    ],
    temperature: 0.6,
    max_tokens: 1200,
  });
}


