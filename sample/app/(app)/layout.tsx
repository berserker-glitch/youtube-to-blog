import Link from 'next/link';
import { UserMenu } from './_components/UserMenu';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-zinc-950 dark:to-zinc-900'>
      <div className='mx-auto max-w-7xl px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6'>
          <aside className='bg-white/80 dark:bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-5'>
            <Link href='/' className='flex items-center gap-3 mb-6'>
              <div className='h-9 w-9 rounded-xl bg-zinc-900 dark:bg-white' />
              <div>
                <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                  ArticleAlchemist
                </p>
                <p className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
                  Dashboard
                </p>
              </div>
            </Link>

            <nav className='space-y-1'>
              <Link
                href='/app/generate'
                className='block rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
              >
                Generate
              </Link>
              <Link
                href='/app/articles'
                className='block rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
              >
                Articles
              </Link>
              <Link
                href='/app/settings'
                className='block rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
              >
                Settings
              </Link>
            </nav>
          </aside>

          <div className='space-y-6'>
            <header className='bg-white/80 dark:bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 px-6 py-4 flex items-center justify-between'>
              <div>
                <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                  ArticleAlchemist
                </p>
                <p className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
                  Workspace
                </p>
              </div>
              <UserMenu />
            </header>

            <main className='bg-white/80 dark:bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-6'>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}


