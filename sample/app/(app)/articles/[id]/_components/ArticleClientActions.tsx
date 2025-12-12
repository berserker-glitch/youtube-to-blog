'use client';

import { useState } from 'react';

export function ArticleClientActions(props: {
  markdown: string;
  filename: string;
}) {
  const [copied, setCopied] = useState(false);

  const download = () => {
    const blob = new Blob([props.markdown], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = props.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(props.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <button
        onClick={download}
        className='bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl transition-colors'
      >
        Download .md
      </button>
      <button
        onClick={copy}
        className='px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}



