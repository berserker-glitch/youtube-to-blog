import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getAppServerSession } from '@/lib/auth-helpers';
import { getUiConfig } from '@/lib/app-config';

function formatUsd(v: unknown): string | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  // Show small values precisely
  if (v === 0) return '$0.00';
  const digits = v < 0.01 ? 5 : v < 0.1 ? 4 : 3;
  return `$${v.toFixed(digits)}`;
}

export default async function ArticlesPage() {
  const session = await getAppServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div>
        <h1 className='text-2xl font-medium'>Unauthorized</h1>
        <p className='mt-2 text-zinc-700 dark:text-zinc-300'>Please sign in.</p>
      </div>
    );
  }

  const articles = await prisma.article.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      title: true,
      videoUrl: true,
      createdAt: true,
      status: true,
      metaJson: true,
    },
  });
  const ui = await getUiConfig();

  return (
    <div>
      <div className='flex items-start justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl md:text-4xl font-light tracking-tight'>
            Articles
          </h1>
          <p className='mt-2 text-zinc-700 dark:text-zinc-300 max-w-2xl'>
            Your saved article history.
          </p>
        </div>
        <Link
          href='/app/generate'
          className='inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl transition-colors shadow-sm'
        >
          New article
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-6'>
          <p className='text-sm text-zinc-700 dark:text-zinc-300'>
            No articles yet. Generate your first one.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {articles.map((a: any) => (
            <Link
              key={a.id}
              href={`/app/articles/${a.id}`}
              className='block rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-5 hover:bg-white dark:hover:bg-zinc-950/50 transition-colors shadow-sm'
            >
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                  <p className='mt-1 text-lg font-medium'>{a.title}</p>
                  {ui.showArticleCost ? (
                    <p className='mt-2 text-xs text-zinc-500 dark:text-zinc-400'>
                      Cost:{' '}
                      {formatUsd(a?.metaJson?.generationCost?.totalUsd) || '—'}
                    </p>
                  ) : null}
                </div>
                <span className='text-xs px-2 py-1 rounded-full border border-zinc-300/70 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200'>
                  {a.status}
                </span>
              </div>

              <p className='mt-3 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2'>
                Source: {a.videoUrl}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


