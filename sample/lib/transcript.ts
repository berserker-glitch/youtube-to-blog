export interface RawSubtitle {
  start: string | number;
  dur: string | number;
  text: string;
}

export interface TranscriptSegment {
  startSec: number;
  endSec: number;
  text: string;
}

export interface TranscriptChunk {
  startSec: number;
  endSec: number;
  text: string;
}

function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : NaN;
}

export function normalizeSubtitles(subtitles: RawSubtitle[]): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];

  for (const s of subtitles || []) {
    const start = toNumber(s.start);
    const dur = toNumber(s.dur);
    const text = (s.text || '').toString().replace(/\s+/g, ' ').trim();
    if (!Number.isFinite(start) || !Number.isFinite(dur) || !text) continue;

    const startSec = Math.max(0, start);
    const endSec = Math.max(startSec, startSec + Math.max(0, dur));
    segments.push({ startSec, endSec, text });
  }

  segments.sort((a, b) => a.startSec - b.startSec);
  return segments;
}

export function chunkTranscript(
  segments: TranscriptSegment[],
  opts?: {
    targetChunkSeconds?: number; // soft target
    maxChunkSeconds?: number; // hard cap
  }
): TranscriptChunk[] {
  const target = opts?.targetChunkSeconds ?? 45;
  const max = opts?.maxChunkSeconds ?? 75;

  const chunks: TranscriptChunk[] = [];
  let cur: TranscriptChunk | null = null;

  for (const seg of segments) {
    if (!cur) {
      cur = { startSec: seg.startSec, endSec: seg.endSec, text: seg.text };
      continue;
    }

    const wouldEnd = Math.max(cur.endSec, seg.endSec);
    const wouldDuration = wouldEnd - cur.startSec;

    // Start a new chunk if we exceed max, or we are beyond target and there's a natural break.
    const gap = seg.startSec - cur.endSec;
    const hasBreak = gap >= 1.5; // pause between captions

    if (wouldDuration > max || (wouldDuration >= target && hasBreak)) {
      chunks.push(cur);
      cur = { startSec: seg.startSec, endSec: seg.endSec, text: seg.text };
      continue;
    }

    cur.text = `${cur.text} ${seg.text}`.trim();
    cur.endSec = wouldEnd;
  }

  if (cur) chunks.push(cur);
  return chunks;
}

export function formatChunksForLLM(chunks: TranscriptChunk[]): string {
  return (chunks || [])
    .map((c) => `[${Math.floor(c.startSec)}s] ${c.text}`)
    .join('\n\n');
}

export function extractTranscriptSlice(
  segments: TranscriptSegment[],
  startSec: number,
  endSec: number
): TranscriptSegment[] {
  const s = Math.max(0, startSec);
  const e = Math.max(s, endSec);
  return (segments || []).filter((seg) => seg.endSec > s && seg.startSec < e);
}

export function formatSegmentsForLLM(segments: TranscriptSegment[]): string {
  return (segments || [])
    .map((seg) => `[${Math.floor(seg.startSec)}s] ${seg.text}`)
    .join('\n');
}


