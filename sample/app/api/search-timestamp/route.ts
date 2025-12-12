import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { callOpenRouterChat } from '@/lib/openrouter';

interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const { transcript, query } = await request.json();

    if (!transcript || !query) {
      return NextResponse.json({ error: 'Missing transcript or query' }, { status: 400 });
    }

    // Prepare the transcript with timestamps for AI analysis
    // Group subtitles into 30-second chunks for better context
    const chunks: { timestamp: number; text: string }[] = [];
    let currentChunk = { timestamp: 0, text: '' };
    
    transcript.forEach((segment: TranscriptSegment, index: number) => {
      if (currentChunk.text === '') {
        currentChunk.timestamp = segment.start;
      }
      
      currentChunk.text += segment.text + ' ';
      
      // Create chunk every 30 seconds or at end
      if (index === transcript.length - 1 || 
          (transcript[index + 1]?.start - currentChunk.timestamp > 30)) {
        chunks.push({
          timestamp: currentChunk.timestamp,
          text: currentChunk.text.trim()
        });
        currentChunk = { timestamp: 0, text: '' };
      }
    });

    // Format for AI
    const transcriptFormatted = chunks.map(chunk => 
      `[${Math.floor(chunk.timestamp)}s] ${chunk.text}`
    ).join('\n\n');

    // Call OpenRouter API to find relevant timestamp (demo route; env-driven auth)
    const content = await callOpenRouterChat({
      model: 'google/gemini-2.0-flash',
      messages: [
        {
          role: 'system',
          content: `You are a helpful video navigation assistant. Analyze the full video transcript and find where specific topics are actually discussed in depth, not just mentioned in passing.

When a user asks about a topic:
1. Read through the ENTIRE transcript carefully
2. Identify where the topic is meaningfully discussed (not just a quick mention)
3. Look for context clues like explanations, examples, or extended discussion
4. Return the timestamp where the main discussion begins

IMPORTANT: Respond with VALID JSON in this exact format:
{
  "timestamp": 123,
  "text": "At this point, the speaker discusses [topic] including [brief context of what's covered]",
  "confidence": "high"
}

- Use "high" confidence when you find a clear, extended discussion
- Use "medium" when it's briefly discussed but relevant
- Use "low" when you only find passing mentions
- Set timestamp to 0 if you can't find any relevant discussion`,
        },
        {
          role: 'user',
          content: `Find where this topic is discussed in the video: "${query}"

Full video transcript with timestamps:
${transcriptFormatted}

Analyze the entire transcript and find where this topic is meaningfully discussed. Respond with JSON only.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(
      content ||
        '{"timestamp": 0, "text": "Could not find relevant section", "confidence": "low"}'
    );

    return NextResponse.json({
      timestamp: result.timestamp || 0,
      text: result.text || 'No relevant section found',
      confidence: result.confidence || 'low'
    }, { status: 200 });

  } catch (error) {
    console.error('Timestamp search error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

