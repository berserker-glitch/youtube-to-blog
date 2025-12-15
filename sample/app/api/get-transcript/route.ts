import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { getSubtitlesWithFallback } from '@/lib/captions';

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    // Fetch subtitles with timestamps
    const { subtitles, usedLang, triedLangs, attempts } =
      await getSubtitlesWithFallback({ videoID: videoId, lang: 'en' });

    if (!subtitles || subtitles.length === 0) {
      return NextResponse.json(
        {
          error: 'No subtitles available',
          debug: { usedLang, triedLangs, attempts },
        },
        { status: 400 }
      );
    }

    // Format the transcript with timestamps
    const transcriptWithTimestamps = subtitles.map((subtitle: any) => ({
      start: Math.floor(subtitle.start),
      duration: subtitle.duration,
      text: subtitle.text.trim()
    }));

    return NextResponse.json({
      transcript: transcriptWithTimestamps,
      totalDuration: subtitles[subtitles.length - 1]?.start || 0
    }, { status: 200 });

  } catch (error) {
    console.error('Transcript fetch error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

