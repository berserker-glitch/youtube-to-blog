import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getAppServerSession } from '@/lib/auth-helpers';

export default async function ArticlesPage() {
  const session = await getAppServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    // Middleware should handle this, but keep it safe for SSR.
    return (
      <div>
        <h1 className='text-2xl font-medium text-zinc-900 dark:text-zinc-50'>
          Unauthorized
        </h1>
        <p className='mt-2 text-zinc-600 dark:text-zinc-300'>
          Please sign in.
        </p>
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
      slug: true,
      videoUrl: true,
      videoId: true,
      createdAt: true,
      status: true,
    },
  });

  return (
    <div>
      <div className='flex items-start justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl md:text-4xl font-light text-zinc-900 dark:text-zinc-50 tracking-tight'>
            Articles
          </h1>
          <p className='mt-2 text-zinc-600 dark:text-zinc-300 max-w-2xl'>
            Your generated articles are stored in your workspace.
          </p>
        </div>
        <Link
          href='/app/generate'
          className='inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl transition-colors'
        >
          New article
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-6'>
          <p className='text-sm text-zinc-600 dark:text-zinc-300'>
            No articles yet. Generate your first one.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/app/articles/${a.id}`}
              className='block rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-5 hover:bg-white dark:hover:bg-zinc-950/50 transition-colors'
            >
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                  <p className='mt-1 text-lg font-medium text-zinc-900 dark:text-zinc-100'>
                    {a.title}
                  </p>
                </div>
                <span className='text-xs px-2 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200'>
                  {a.status}
                </span>
              </div>

              <p className='mt-3 text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2'>
                Source: {a.videoUrl}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


