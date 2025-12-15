'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MarkdownViewer } from '@/app/_components/MarkdownViewer';
import { parseYouTubeUrl } from '@/lib/youtube';

export default function GeneratePage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [phase, setPhase] = useState<
    | 'idle'
    | 'fetching'
    | 'chaptering'
    | 'writing'
    | 'assembling'
    | 'done'
    | 'error'
  >('idle');
  const [markdown, setMarkdown] = useState<string>('');
  const [filename, setFilename] = useState<string>('articlealchemist.md');
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isValidUrl = useMemo(() => {
    const v = videoUrl.trim();
    if (!v) return true;
    try {
      parseYouTubeUrl(v);
      return true;
    } catch {
      return false;
    }
  }, [videoUrl]);

  const canGenerate = useMemo(
    () => !!videoUrl.trim() && !isGenerating && isValidUrl,
    [videoUrl, isGenerating, isValidUrl]
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Block navigation/refresh during generation
  useEffect(() => {
    if (!isGenerating) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Article generation is in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isGenerating) {
        console.warn('[generate] Tab hidden during generation - this may interrupt the process');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isGenerating]);

  // Play sound on completion
  useEffect(() => {
    if (phase === 'done' && markdown) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch {
        // Ignore if Web Audio API is unavailable
      }
    }
  }, [phase, markdown]);

  const steps = useMemo(
    () => [
      { key: 'fetching', label: 'Transcript' },
      { key: 'chaptering', label: 'Chapters' },
      { key: 'writing', label: 'Writing' },
      { key: 'assembling', label: 'Assemble' },
    ],
    []
  );

  const activeStepIndex = useMemo(() => {
    const idx = steps.findIndex((s) => s.key === phase);
    if (idx >= 0) return idx;
    if (phase === 'done') return steps.length;
    return -1;
  }, [phase, steps]);

  const phaseLabel = useMemo(() => {
    switch (phase) {
      case 'fetching':
        return 'Fetching transcript and metadata';
      case 'chaptering':
        return 'Dividing into semantic chapters';
      case 'writing':
        return 'Writing long-form sections';
      case 'assembling':
        return 'Assembling final Markdown';
      case 'done':
        return 'Done.';
      case 'error':
        return 'Failed.';
      default:
        return '';
    }
  }, [phase]);

  const triggerDownload = (md: string, name: string) => {
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'articlealchemist.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyMarkdown = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setVideoUrl(text.trim());
    } catch {
      // Ignore if clipboard permissions are blocked.
    }
  };

  const handleGenerate = async () => {
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    console.groupCollapsed(`[generate] start ${runId}`);
    console.log('videoUrl', videoUrl);
    console.log('isValidUrl', isValidUrl);
    console.log('canGenerate', canGenerate);

    setError(null);
    setMarkdown('');
    setCopied(false);
    setPhase('fetching');
    setIsGenerating(true);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const t1 = window.setTimeout(() => setPhase('chaptering'), 1200);
    const t2 = window.setTimeout(() => setPhase('writing'), 3500);
    const t3 = window.setTimeout(() => setPhase('assembling'), 7000);

    try {
      console.log('POST /api/generate-blog payload', { youtubeUrl: videoUrl, lang: 'en' });
      const resp = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl: videoUrl, lang: 'en' }),
        signal: ctrl.signal,
      });

      console.log('response status', resp.status, resp.statusText);
      console.log('response headers', {
        'content-type': resp.headers.get('content-type'),
        'content-disposition': resp.headers.get('content-disposition'),
      });

      if (!resp.ok) {
        const json = await resp.json().catch(() => null);
        console.log('error json', json);
        throw new Error(json?.error || `Request failed (${resp.status})`);
      }

      const md = await resp.text();
      console.log('markdown bytes', md.length);
      const disposition = resp.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/i);
      const name = match?.[1] || 'articlealchemist.md';
      console.log('filename', name);

      setFilename(name);
      setMarkdown(md);
      setPhase('done');
    } catch (e) {
      if ((e as any)?.name === 'AbortError') return;
      console.error('generation failed', e);
      setError(e instanceof Error ? e.message : 'Unknown error');
      setPhase('error');
    } finally {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      setIsGenerating(false);
      console.groupEnd();
    }
  };

  return (
    <div>
      <div className='mb-8'>
        <div className='inline-flex items-center gap-2 rounded-full border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-300'>
          Generator
          <span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
          Video → Article
        </div>
        <h1 className='text-3xl md:text-4xl font-light tracking-tight'>
          Generate an article
        </h1>
        <p className='mt-2 text-zinc-700 dark:text-zinc-300 max-w-2xl'>
          Paste a YouTube URL. We’ll generate a single Markdown file and save it to
          your library.
        </p>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
        <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-5 shadow-sm'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
                Input
              </p>
              <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
                Tip: if the selected language is missing, we fall back to English auto-captions when available.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={pasteFromClipboard}
                className='rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors'
              >
                Paste
              </button>
              <button
                type='button'
                onClick={() => setVideoUrl('')}
                className='rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors'
              >
                Clear
              </button>
            </div>
          </div>

          <label className='block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-2'>
            YouTube URL
          </label>
          <input
            type='url'
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canGenerate && handleGenerate()}
            placeholder='https://www.youtube.com/watch?v=...'
            className='w-full px-4 py-3 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all'
          />
          {!isValidUrl && (
            <p className='mt-2 text-sm text-red-700 dark:text-red-300'>
              Please paste a valid YouTube URL.
            </p>
          )}

          {isGenerating && (
            <div className='mt-4 rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-3'>
              <p className='text-sm text-amber-800 dark:text-amber-200 font-medium'>
                ⚠️ Do not leave this page or refresh
              </p>
              <p className='mt-1 text-xs text-amber-700 dark:text-amber-300'>
                Generation is in progress. Leaving or refreshing will cancel the process.
              </p>
            </div>
          )}

          {phase !== 'idle' && (
            <div className='mt-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 px-4 py-3'>
              <div className='flex items-center justify-between gap-3'>
                <p className='text-sm text-zinc-800 dark:text-zinc-200'>
                  {phaseLabel}
                  {phase !== 'done' && phase !== 'error' ? '…' : ''}
                </p>
                <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                  {phase === 'done'
                    ? 'Complete'
                    : phase === 'error'
                      ? 'Error'
                      : 'In progress'}
                </p>
              </div>
              <div className='mt-3 flex items-center gap-2 flex-wrap'>
                {steps.map((s, idx) => {
                  const isActive = idx === activeStepIndex;
                  const isDone = activeStepIndex >= 0 && idx < activeStepIndex;
                  return (
                    <div key={s.key} className='flex items-center gap-2'>
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          isDone
                            ? 'bg-zinc-900 dark:bg-zinc-100'
                            : isActive
                              ? 'bg-zinc-600 dark:bg-zinc-300'
                              : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      />
                      <p
                        className={`text-xs ${
                          isDone
                            ? 'text-zinc-800 dark:text-zinc-200'
                            : isActive
                              ? 'text-zinc-600 dark:text-zinc-300'
                              : 'text-zinc-500 dark:text-zinc-500'
                        }`}
                      >
                        {s.label}
                      </p>
                      {idx !== steps.length - 1 && (
                        <div className='h-px w-6 bg-zinc-200 dark:bg-zinc-800' />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className='mt-4 border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/20 rounded-xl p-3'>
              <p className='text-red-800 dark:text-red-200 text-sm'>{error}</p>
            </div>
          )}

          <div className='mt-4 flex gap-3'>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className='flex-1 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed'
            >
              {isGenerating ? 'Generating…' : 'Generate (.md)'}
            </button>

            <button
              onClick={() => {
                abortRef.current?.abort();
                setIsGenerating(false);
                setPhase('idle');
              }}
              disabled={!isGenerating}
              className='px-4 py-3 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 hover:bg-white dark:hover:bg-zinc-900 transition-colors'
            >
              Cancel
            </button>
          </div>

          {markdown && (
            <div className='mt-4 grid grid-cols-1 gap-3'>
              <div className='rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-4'>
                <p className='text-xs text-zinc-500 dark:text-zinc-400'>Output file</p>
                <p className='mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 break-words'>
                  {filename}
                </p>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <button
                  onClick={() => triggerDownload(markdown, filename)}
                  className='w-full bg-white/80 dark:bg-zinc-950/40 border border-zinc-300/70 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium py-3 px-6 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-colors'
                >
                  Download .md
                </button>
                <button
                  onClick={copyMarkdown}
                  className='w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-sm'
                >
                  {copied ? 'Copied' : 'Copy Markdown'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className='space-y-4'>
          <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-5 shadow-sm'>
            <p className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>Preview</p>
            <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
              Switch between a rendered preview and the raw Markdown.
            </p>
          </div>
        <MarkdownViewer markdown={markdown} />
        </div>
      </div>
    </div>
  );
}


