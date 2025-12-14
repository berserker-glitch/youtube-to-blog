'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const YT_ID_RE =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/i;

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
    return YT_ID_RE.test(v);
  }, [videoUrl]);

  const canGenerate = useMemo(
    () => !!videoUrl.trim() && !isGenerating && isValidUrl,
    [videoUrl, isGenerating, isValidUrl]
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

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

  const handleGenerate = async () => {
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
      const resp = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl: videoUrl, lang: 'en' }),
        signal: ctrl.signal,
      });

      if (!resp.ok) {
        const json = await resp.json().catch(() => null);
        throw new Error(json?.error || `Request failed (${resp.status})`);
      }

      const md = await resp.text();
      const disposition = resp.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/i);
      const name = match?.[1] || 'articlealchemist.md';

      setFilename(name);
      setMarkdown(md);
      setPhase('done');
    } catch (e) {
      if ((e as any)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Unknown error');
      setPhase('error');
    } finally {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className='mb-6 sm:mb-8'>
        <h1 className='text-2xl sm:text-3xl md:text-4xl font-light text-zinc-900 dark:text-zinc-50 tracking-tight'>
          Generate an article
        </h1>
        <p className='mt-2 text-zinc-600 dark:text-zinc-300 max-w-2xl text-sm sm:text-base'>
          Paste a YouTube URL and ArticleAlchemist will generate a single Markdown
          article from the transcript.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-4 sm:p-5'>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2'>
            YouTube URL
          </label>
          <input
            type='url'
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder='https://www.youtube.com/watch?v=...'
            className='w-full px-4 py-4 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all text-base min-h-[44px]'
          />
          {!isValidUrl && (
            <p className='mt-2 text-sm text-red-700 dark:text-red-300'>
              Please paste a valid YouTube URL.
            </p>
          )}

          {phase !== 'idle' && (
            <div className='mt-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/30 px-4 py-3'>
              <div className='flex items-center justify-between gap-3'>
                <p className='text-sm text-zinc-700 dark:text-zinc-300'>
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
            <div className='mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3'>
              <p className='text-red-700 dark:text-red-300 text-sm'>{error}</p>
            </div>
          )}

          <div className='mt-4 flex flex-col sm:flex-row gap-3'>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className='flex-1 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-medium py-4 px-6 rounded-xl transition-colors disabled:cursor-not-allowed min-h-[44px] text-base'
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
              className='w-full sm:w-auto px-6 py-4 sm:px-4 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors min-h-[44px] text-base'
            >
              Cancel
            </button>
          </div>

          {markdown && (
            <div className='mt-4 grid grid-cols-1 gap-3'>
              <button
                onClick={() => triggerDownload(markdown, filename)}
                className='w-full bg-white dark:bg-zinc-950/40 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium py-4 px-6 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors min-h-[44px] text-base'
              >
                Download {filename}
              </button>
            </div>
          )}
        </div>

        <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-4 sm:p-5'>
          <div className='flex items-center justify-between mb-3'>
            <h2 className='text-base sm:text-lg font-medium text-zinc-800 dark:text-zinc-100'>
              Preview
            </h2>
            <button
              onClick={async () => {
                if (!markdown) return;
                await navigator.clipboard.writeText(markdown);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
              disabled={!markdown}
              className='text-sm px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 min-h-[36px]'
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            value={markdown}
            readOnly
            placeholder='Generated Markdown will appear here…'
            className='w-full h-[400px] sm:h-[500px] lg:h-[560px] resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 p-4 font-mono text-sm leading-relaxed'
          />
        </div>
      </div>
    </div>
  );
}



