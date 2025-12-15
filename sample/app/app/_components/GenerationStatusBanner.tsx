'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type StatusResponse =
  | { inProgress: false }
  | {
      inProgress: true;
      article: {
        id: string;
        title: string;
        videoUrl: string;
        createdAt: string;
        updatedAt: string;
        progress: any;
      };
    };

function formatPhase(progress: any): string {
  const phase = (progress?.phase || '').toString();
  switch (phase) {
    case 'fetching':
      return 'Fetching captions';
    case 'chaptering':
      return 'Generating chapters';
    case 'writing_v1':
      return 'Writing draft';
    case 'feedback':
      return 'Reviewing draft';
    case 'writing_v2':
      return 'Rewriting final article';
    case 'assembling':
      return 'Assembling';
    case 'saving':
      return 'Saving';
    default:
      return phase || 'Generating';
  }
}

export function GenerationStatusBanner() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const pathname = usePathname();

  const inProgress = data?.inProgress === true;

  const label = useMemo(() => {
    if (!inProgress) return null;
    const p = (data as any).article?.progress;
    const msg = (p?.message || '').toString().trim();
    const phase = formatPhase(p);
    return msg ? `${phase}: ${msg}` : phase;
  }, [data, inProgress]);

  useEffect(() => {
    let mounted = true;
    let t: any = null;

    const tick = async () => {
      try {
        const res = await fetch('/api/generation/status', { cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as StatusResponse | null;
        if (!mounted) return;
        if (res.ok && json) {
          setData(json);
          setErr(null);
        }
      } catch (e) {
        if (!mounted) return;
        setErr(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!mounted) return;
        t = window.setTimeout(tick, 2500);
      }
    };

    tick();
    return () => {
      mounted = false;
      if (t) window.clearTimeout(t);
    };
  }, []);

  // Warn on reload/close while generating
  useEffect(() => {
    if (!inProgress) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        'An article is still being generated. Leaving may waste tokens.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [inProgress]);

  if (!inProgress) return null;

  // Avoid showing banner on admin pages if you want; keep it global otherwise.
  if (pathname?.startsWith('/app/admin')) return null;

  const article = (data as any).article;

  return (
    <div className='rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-3'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
        <div className='min-w-0'>
          <p className='text-sm font-medium text-amber-950 dark:text-amber-100 truncate'>
            Article generating…
          </p>
          <p className='text-xs text-amber-800/80 dark:text-amber-200/80 truncate'>
            {label || 'Working…'} {err ? `(${err})` : ''}
          </p>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <Link
            href='/app/articles'
            className='rounded-xl border border-amber-300/60 dark:border-amber-900/50 bg-white/60 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-950 dark:text-amber-100 hover:bg-white dark:hover:bg-amber-950/30 transition-colors'
          >
            View articles
          </Link>
          <Link
            href={`/app/articles/${article.id}`}
            className='rounded-xl bg-amber-900 hover:bg-amber-800 text-white px-3 py-2 text-xs font-medium transition-colors'
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}

