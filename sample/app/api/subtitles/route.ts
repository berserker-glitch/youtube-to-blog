import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { getSubtitlesWithFallback } from '@/lib/captions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoID = searchParams.get('videoID');
  const lang = searchParams.get('lang') || 'en';

  if (!videoID) {
    return NextResponse.json({ error: 'Missing videoID' }, { status: 400 });
  }

  try {
    const { subtitles, usedLang, triedLangs, attempts } =
      await getSubtitlesWithFallback({ videoID, lang });
    return NextResponse.json(
      { subtitles, usedLang, triedLangs, attempts },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message, videoID, requestedLang: lang },
      { status: 400 }
    );
  }
}
