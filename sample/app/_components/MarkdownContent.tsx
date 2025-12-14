import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <div className='prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:break-words prose-pre:bg-zinc-950/5 dark:prose-pre:bg-white/5 prose-pre:border prose-pre:border-zinc-200/70 dark:prose-pre:border-zinc-800'>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}


