import { callOpenRouterChat } from '@/lib/openrouter';
import type { Chapter } from '@/lib/chaptering';

export interface VideoMetaForWriting {
  title?: string;
  description?: string;
}

function strictWriterSystemPrompt() {
  return `You are an expert technical editor and SEO strategist. Your job is to transform the provided transcript content into a high-quality long-form article.\n\nCore instruction:\n- Write the article as if it were originally written as an article.\n- Do NOT describe the source material. Do NOT summarize “chapters”. Do NOT narrate what someone said.\n- Never use phrases like: \"in this video\", \"the speaker\", \"he/she says\", \"in this chapter\", \"the transcript\", \"at 03:12\".\n- Do NOT include timestamps.\n\nNon-negotiable rules:\n- Tone: authoritative, educational, analytical.\n- Style: text-heavy; long, flowing paragraphs.\n- Do NOT be conversational. No filler. No rhetorical questions. No second-person coaching.\n- No emojis.\n- Avoid excessive bullet points. Bullets are allowed ONLY for technical specs or distinct procedural steps.\n- Use proper Markdown headers with ## and ###.\n\nSEO requirements (hard):\n- The output MUST be SEO-optimized for the topic.\n- Use the provided title/description as ground-truth context for SEO targeting.\n- Infer search intent (informational/commercial/transactional) and write to it.\n- Integrate the provided primary/secondary keywords naturally AND add close variants and relevant entities that are explicitly present in the transcript.\n- Prefer descriptive, keyword-relevant H2/H3 headings. Avoid generic headings.\n- Never keyword-stuff; keep readability and semantic coherence.\n\nFaithfulness (hard):\n- Do not invent facts. If something is not in the provided transcript slice, do not assert it as true.\n- You may rephrase, reorder, deduplicate, and tighten.\n\nOutput requirements:\n- Output ONLY Markdown.\n- No preamble.\n`;
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

  const user = `Overall article constraint:\n- The finished article MUST be approximately ${params.overallTargetWords} words total.\n\nThis section constraint:\n- Target length for THIS section: approximately ${params.targetWords} words (±10%).\n- Before writing, internally plan how to hit the word budget while staying faithful to the source content.\n\nWrite the next article section.\n\nSection metadata:\n- Section title: ${params.chapter.title}\n- Section thesis: ${params.chapter.thesis}\n- Primary keyword: ${params.chapter.primaryKeyword}\n- Secondary keywords: ${(params.chapter.secondaryKeywords || []).join(', ')}\n\nContext:\n- Title: ${params.video.title || 'Unknown'}\n- Description: ${params.video.description || ''}\n\nSource transcript slice (do NOT quote timestamps and do NOT mention you used a transcript):\n${params.transcriptSlice}\n\nFormatting requirements:\n- Start with \"## ${params.chapter.title}\".\n- Include multiple ### subheadings where appropriate.\n- Output ONLY Markdown.\n`;

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

  const user = `Overall article constraint:\n- The finished article MUST be approximately ${params.overallTargetWords} words total.\n\nIntroduction constraint:\n- Target length for the introduction: approximately ${params.targetWords} words (±10%).\n- Before writing, internally plan how to set up the full article while respecting the word budget.\n\nWrite a compelling introduction for a long-form article titled:\n${params.articleTitle}\n\nContext:\n- Title: ${params.video.title || 'Unknown'}\n- Description: ${params.video.description || ''}\n\nPlanned structure (for your awareness; do NOT refer to this as chapters in the output):\n${chapterList}\n\nRequirements:\n- Output Markdown only.\n- Do NOT use a header for the introduction.\n- Prefer long, flowing paragraphs.\n`;

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

function feedbackSystemPrompt() {
  return `You are an expert content editor and SEO strategist.\n\nTask:\n- Read the provided draft article and provide detailed, actionable feedback.\n\nHard requirements:\n- Be specific: point to patterns and concrete fixes.\n- Do NOT rewrite the article. Only feedback.\n- Do NOT mention tools, models, or that you are an AI.\n\nOutput format (Markdown only):\n- ## Strengths\n- ## Weaknesses\n- ## Specific fixes (ordered, actionable)\n- ## SEO notes\n- ## Clarity & structure notes\n`;
}

export async function getDraftFeedback(params: {
  articleTitle: string;
  video: VideoMetaForWriting;
  draftMarkdown: string;
  model?: string;
}): Promise<string> {
  const model = params.model;
  if (!model) throw new Error('Missing feedback model');

  const user = `Article title: ${params.articleTitle}\n\nContext:\n- Title: ${params.video.title || 'Unknown'}\n- Description: ${params.video.description || ''}\n\nDraft article (Markdown):\n${params.draftMarkdown}\n\nReturn feedback following the required output format.\n`;

  return await callOpenRouterChat({
    model,
    messages: [
      { role: 'system', content: feedbackSystemPrompt() },
      { role: 'user', content: user },
    ],
    temperature: 0.2,
    max_tokens: 1600,
  });
}

export async function reviseIntroductionWithFeedback(params: {
  articleTitle: string;
  chapters: Chapter[];
  video: VideoMetaForWriting;
  overallTargetWords: number;
  targetWords: number;
  originalIntro: string;
  feedbackMarkdown: string;
  model?: string;
}): Promise<string> {
  const model = params.model;
  if (!model) throw new Error('Missing revision writer model');

  const chapterList = params.chapters
    .map(
      (c, i) =>
        `${i + 1}. ${c.title} (primary keyword: ${c.primaryKeyword})`
    )
    .join('\n');

  const user = `You previously wrote this introduction draft:\n${params.originalIntro}\n\nHere is editorial feedback on the full draft article:\n${params.feedbackMarkdown}\n\nRevise the introduction for the article titled:\n${params.articleTitle}\n\nConstraints:\n- Target length: approximately ${params.targetWords} words (±10%).\n- Do NOT add a header.\n- Do NOT reference the video, transcript, chapters, or feedback.\n- Prefer long, flowing paragraphs.\n\nContext:\n- Title: ${params.video.title || 'Unknown'}\n- Description: ${params.video.description || ''}\n\nPlanned structure (for your awareness; do NOT refer to this as chapters in the output):\n${chapterList}\n\nOutput Markdown only.\n`;

  return await callOpenRouterChat({
    model,
    messages: [
      { role: 'system', content: strictWriterSystemPrompt() },
      { role: 'user', content: user },
    ],
    temperature: 0.5,
    max_tokens: 1400,
  });
}

export async function reviseSectionWithFeedback(params: {
  chapter: Chapter;
  transcriptSlice: string;
  video: VideoMetaForWriting;
  overallTargetWords: number;
  targetWords: number;
  originalSection: string;
  feedbackMarkdown: string;
  model?: string;
}): Promise<string> {
  const model = params.model;
  if (!model) throw new Error('Missing revision writer model');

  const user = `You previously wrote this section draft:\n${params.originalSection}\n\nHere is editorial feedback on the full draft article:\n${params.feedbackMarkdown}\n\nRevise this section.\n\nConstraints:\n- Target length for THIS section: approximately ${params.targetWords} words (±10%).\n- Must start with \"## ${params.chapter.title}\".\n- Include multiple ### subheadings where appropriate.\n- Do NOT reference the video, transcript, chapters, or feedback.\n\nSection metadata:\n- Section title: ${params.chapter.title}\n- Section thesis: ${params.chapter.thesis}\n- Primary keyword: ${params.chapter.primaryKeyword}\n- Secondary keywords: ${(params.chapter.secondaryKeywords || []).join(', ')}\n\nContext:\n- Title: ${params.video.title || 'Unknown'}\n- Description: ${params.video.description || ''}\n\nSource transcript slice (do NOT quote timestamps and do NOT mention you used a transcript):\n${params.transcriptSlice}\n\nOutput ONLY Markdown.\n`;

  return await callOpenRouterChat({
    model,
    messages: [
      { role: 'system', content: strictWriterSystemPrompt() },
      { role: 'user', content: user },
    ],
    temperature: 0.5,
    max_tokens: 4000,
  });
}

export async function reviseConclusionWithFeedback(params: {
  articleTitle: string;
  chapters: Chapter[];
  video: VideoMetaForWriting;
  overallTargetWords: number;
  targetWords: number;
  originalConclusion: string;
  feedbackMarkdown: string;
  model?: string;
}): Promise<string> {
  const model = params.model;
  if (!model) throw new Error('Missing revision writer model');

  const chapterList = params.chapters
    .map((c) => `- ${c.title}: ${c.thesis}`)
    .join('\n');

  const user = `You previously wrote this conclusion draft:\n${params.originalConclusion}\n\nHere is editorial feedback on the full draft article:\n${params.feedbackMarkdown}\n\nRevise the conclusion for the article titled:\n${params.articleTitle}\n\nConstraints:\n- Target length: approximately ${params.targetWords} words (±10%).\n- Start with \"## Conclusion\".\n- Do NOT reference the video, transcript, chapters, or feedback.\n- Prefer long, flowing paragraphs.\n- No fluff.\n\nKey sections and theses:\n${chapterList}\n\nOutput Markdown only.\n`;

  return await callOpenRouterChat({
    model,
    messages: [
      { role: 'system', content: strictWriterSystemPrompt() },
      { role: 'user', content: user },
    ],
    temperature: 0.5,
    max_tokens: 1400,
  });
}


