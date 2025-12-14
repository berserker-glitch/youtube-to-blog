'use client';

import { useState } from 'react';

export function ArticleClientActions(props: {
  markdown: string;
  filename: string;
  articleId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState<'draft' | 'publish' | null>(null);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

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

  const publishToWordPress = async (status: 'draft' | 'publish') => {
    setPublishMsg(null);
    setPublishing(status);
    try {
      const res = await fetch('/api/integrations/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: props.articleId, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Publish failed');
      setPublishMsg(`Published to WordPress (${json?.wordpress?.status}).`);
      window.location.reload();
    } catch (e) {
      setPublishMsg(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <button
        onClick={download}
        className='bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl transition-colors shadow-sm'
      >
        Download .md
      </button>
      <button
        onClick={copy}
        className='px-4 py-2 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors'
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        onClick={() => publishToWordPress('draft')}
        disabled={publishing !== null}
        className='px-4 py-2 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors disabled:opacity-60'
      >
        {publishing === 'draft' ? 'Publishing…' : 'Send to WordPress (Draft)'}
      </button>
      <button
        onClick={() => publishToWordPress('publish')}
        disabled={publishing !== null}
        className='bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl transition-colors shadow-sm disabled:opacity-60'
      >
        {publishing === 'publish' ? 'Publishing…' : 'Publish to WordPress'}
      </button>
      {publishMsg ? (
        <p className='w-full text-sm text-zinc-700 dark:text-zinc-300'>
          {publishMsg}{' '}
          {publishMsg.includes('Connect WordPress') ? (
            <a className='underline' href='/app/integrations/wordpress'>
              Connect WordPress
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}


