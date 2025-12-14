'use client';

import { useMemo, useState } from 'react';
import { MarkdownContent } from './MarkdownContent';

type Mode = 'preview' | 'raw';

export function MarkdownViewer(props: {
  markdown: string;
  defaultMode?: Mode;
  heightClassName?: string;
}) {
  const [mode, setMode] = useState<Mode>(props.defaultMode || 'preview');

  const hasContent = useMemo(() => !!props.markdown?.trim(), [props.markdown]);

  return (
    <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-5 shadow-sm'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3'>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
            Output
          </p>
          <span className='text-xs text-zinc-500 dark:text-zinc-400'>
            {mode === 'preview' ? 'Preview' : 'Markdown'}
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <div className='inline-flex rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 p-1'>
            <button
              type='button'
              onClick={() => setMode('preview')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === 'preview'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              Preview
            </button>
            <button
              type='button'
              onClick={() => setMode('raw')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === 'raw'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              Markdown
            </button>
          </div>
        </div>
      </div>

      {!hasContent ? (
        <div
          className={`rounded-xl border border-dashed border-zinc-300/70 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/30 p-6 text-sm text-zinc-600 dark:text-zinc-300 ${props.heightClassName || 'min-h-[360px]'}`}
        >
          Generate an article to see the output here.
        </div>
      ) : mode === 'preview' ? (
        <div
          className={`overflow-auto rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 p-5 ${props.heightClassName || 'max-h-[560px]'}`}
        >
          <MarkdownContent markdown={props.markdown} />
        </div>
      ) : (
        <textarea
          readOnly
          value={props.markdown}
          className={`w-full resize-none rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 p-4 font-mono text-sm leading-relaxed ${props.heightClassName || 'h-[560px]'}`}
        />
      )}
    </div>
  );
}


