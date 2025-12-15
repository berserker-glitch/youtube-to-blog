'use client';

import Link from 'next/link';
import { useGeneration } from './GenerationProvider';

function phaseLabel(phase: string) {
  if (phase === 'fetching') return 'Fetching transcript';
  if (phase === 'chaptering') return 'Creating chapters';
  if (phase === 'writing') return 'Writing + rewriting';
  if (phase === 'assembling') return 'Assembling final article';
  return 'Generating';
}

export function GenerationBanner() {
  const { state } = useGeneration();

  const elapsed =
    typeof state.startedAt === 'number'
      ? Math.max(0, Math.round((Date.now() - state.startedAt) / 1000))
      : null;

  if (!state.inProgress) return null;

  return (
    <div className='rounded-2xl border border-amber-200/70 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-3 flex items-start justify-between gap-4'>
      <div className='min-w-0'>
        <p className='text-sm font-medium text-amber-900 dark:text-amber-100'>
          An article is being generated right now
        </p>
        <p className='mt-0.5 text-xs text-amber-800/80 dark:text-amber-200/80 truncate'>
          {phaseLabel(state.phase)}
          {elapsed !== null ? ` • ${elapsed}s` : ''}
          {state.videoUrl ? ` • ${state.videoUrl}` : ''}
        </p>
      </div>
      <Link
        href='/app/generate'
        className='shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-2 transition-colors'
      >
        View
      </Link>
    </div>
  );
}

