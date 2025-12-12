'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const YT_ID_RE =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/i;

const HomePage = () => {
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
  const [filename, setFilename] = useState<string>('youtube-to-blog.md');
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isValidUrl = useMemo(() => {
    const v = videoUrl.trim();
    if (!v) return true; // don’t show “invalid” while empty
    return YT_ID_RE.test(v);
  }, [videoUrl]);

  const canGenerate = useMemo(
    () => !!videoUrl.trim() && !isGenerating && isValidUrl,
    [videoUrl, isGenerating, isValidUrl]
  );

  useEffect(() => {
    // Cleanup any in-flight request if the component unmounts
    return () => abortRef.current?.abort();
  }, []);

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

  const triggerDownload = (md: string, name: string) => {
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'youtube-to-blog.md';
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

    // Lightweight client-side phase progression (server is one-shot)
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
      const name = match?.[1] || 'youtube-to-blog.md';

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
    <div className='min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-zinc-950 dark:to-zinc-900'>
      <div className='container mx-auto px-4 py-12 max-w-6xl'>
        <div className='mb-10 flex flex-col gap-2'>
          <div className='inline-flex items-center gap-2'>
            <div className='h-9 w-9 rounded-xl bg-zinc-900 dark:bg-white' />
            <h1 className='text-4xl md:text-5xl font-light text-zinc-900 dark:text-zinc-50 tracking-tight'>
              YouTube-to-Blog
            </h1>
          </div>
          <p className='text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl'>
            Turn a captioned YouTube video into a deep, text-heavy, SEO-optimized
            long-form article. Output is a single Markdown file.
          </p>
          <p className='text-sm text-zinc-500 dark:text-zinc-400 max-w-3xl'>
            Note: videos without captions will fail in v1.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='bg-white/80 dark:bg-zinc-900/60 backdrop-blur rounded-2xl shadow-sm border border-zinc-200/70 dark:border-zinc-800 p-6'>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2'>
                  YouTube URL
                </label>
                <input
                  type='url'
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder='https://www.youtube.com/watch?v=...'
                  className='w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all'
                />
                {!isValidUrl && (
                  <p className='mt-2 text-sm text-red-700 dark:text-red-300'>
                    Please paste a valid YouTube URL.
                  </p>
                )}
              </div>

              {phase !== 'idle' && (
                <div className='rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/30 px-4 py-3'>
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
                  <div className='mt-3 flex items-center gap-2'>
                    {steps.map((s, idx) => {
                      const isActive = idx === activeStepIndex;
                      const isDone =
                        activeStepIndex >= 0 && idx < activeStepIndex;
                      return (
                        <div
                          key={s.key}
                          className='flex items-center gap-2'
                        >
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
                <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3'>
                  <p className='text-red-700 dark:text-red-300 text-sm'>
                    {error}
                  </p>
                </div>
              )}

              <div className='flex gap-3'>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className='flex-1 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed'
                >
                  {isGenerating ? 'Generating…' : 'Generate Blog (.md)'}
                </button>

                <button
                  onClick={() => {
                    abortRef.current?.abort();
                    setIsGenerating(false);
                    setPhase('idle');
                  }}
                  disabled={!isGenerating}
                  className='px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
                >
                  Cancel
                </button>
              </div>

              {markdown && (
                <div className='flex gap-3'>
                  <button
                    onClick={() => triggerDownload(markdown, filename)}
                    className='w-full bg-white dark:bg-zinc-950/40 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium py-3 px-6 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
                  >
                    Download {filename}
                  </button>
                </div>
              )}

              <div className='pt-2'>
                <p className='text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed'>
                  Tip: longer videos can take a few minutes due to chaptering and
                  section-by-section writing.
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white/80 dark:bg-zinc-900/60 backdrop-blur rounded-2xl shadow-sm border border-zinc-200/70 dark:border-zinc-800 p-6'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-medium text-zinc-800 dark:text-zinc-100'>
                Markdown Preview
              </h2>
              <button
                onClick={async () => {
                  if (!markdown) return;
                  await navigator.clipboard.writeText(markdown);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                }}
                disabled={!markdown}
                className='text-sm text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-50'
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              value={markdown}
              readOnly
              placeholder='Generated Markdown will appear here…'
              className='w-full h-[540px] resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 p-4 font-mono text-sm leading-relaxed'
            />
            <p className='mt-3 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed'>
              The download is generated server-side and returned as a Markdown
              attachment. The preview shows the exact file contents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
