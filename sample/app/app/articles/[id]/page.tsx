import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getAppServerSession } from '@/lib/auth-helpers';
import { ArticleClientActions } from './_components/ArticleClientActions';
import { MarkdownViewer } from '@/app/_components/MarkdownViewer';

export default async function ArticleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAppServerSession();
  const userId = session?.user?.id;
  if (!userId) notFound();

  const article = await prisma.article.findFirst({
    where: { id: params.id, userId },
    select: {
      id: true,
      title: true,
      slug: true,
      videoUrl: true,
      createdAt: true,
      markdown: true,
      wordpressPostUrl: true,
    },
  });

  if (!article) notFound();
  const filename = `${article.slug || 'article'}.md`;

  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8'>
        <div>
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>
            {new Date(article.createdAt).toLocaleString()}
          </p>
          <h1 className='mt-1 text-3xl md:text-4xl font-light tracking-tight'>
            {article.title}
          </h1>
          <p className='mt-3 text-sm text-zinc-700 dark:text-zinc-300 break-all'>
            Source: {article.videoUrl}
          </p>
          {article.wordpressPostUrl && (
            <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300 break-all'>
              WordPress: <a className='underline' href={article.wordpressPostUrl} target='_blank' rel='noreferrer'>{article.wordpressPostUrl}</a>
            </p>
          )}
        </div>
        <ArticleClientActions markdown={article.markdown} filename={filename} articleId={article.id} />
      </div>

      <MarkdownViewer markdown={article.markdown} defaultMode='preview' heightClassName='max-h-[720px]' />
    </div>
  );
}


