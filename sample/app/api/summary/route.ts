import { getSubtitles, getVideoDetails } from 'youtube-caption-extractor';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { callOpenRouterChat } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing video URL' }, { status: 400 });
    }

    // Extract video ID from YouTube URL
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    
    if (!videoIdMatch) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const videoID = videoIdMatch[1];

    // Fetch subtitles and video details
    const [subtitles, videoDetails] = await Promise.all([
      getSubtitles({ videoID, lang: 'en' }),
      getVideoDetails({ videoID, lang: 'en' })
    ]);

    // Combine all subtitle text and truncate if too long
    let transcriptText = subtitles.map((subtitle: any) => subtitle.text).join(' ');

    if (!transcriptText.trim()) {
      return NextResponse.json({ error: 'No English subtitles available for this video' }, { status: 400 });
    }

    // Truncate transcript if it's too long (roughly 4000 characters = ~1000 tokens)
    // Leave room for system prompt and response
    if (transcriptText.length > 4000) {
      transcriptText = transcriptText.substring(0, 4000) + '... [transcript truncated]';
    }

    // Call OpenRouter API to generate summary (demo route; env-driven auth)
    const summary = await callOpenRouterChat({
      model: 'google/gemini-2.0-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that creates comprehensive summaries of YouTube video transcripts. Create a well-structured markdown summary that captures the main points, key insights, and important details from the transcript.',
        },
        {
          role: 'user',
          content: `Please create a detailed summary of this YouTube video transcript in markdown format. Include main topics, key points, and important insights.\n\nVideo Title: ${videoDetails.title || 'Unknown'}\n\nTranscript:\n${transcriptText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return NextResponse.json({
      summary,
      videoDetails: {
        title: videoDetails.title,
        description: videoDetails.description,
        thumbnail: videoDetails.thumbnail
      },
      transcriptLength: transcriptText.length
    }, { status: 200 });

  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
