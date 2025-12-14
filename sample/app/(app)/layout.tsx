'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserMenu } from './_components/UserMenu';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className='min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-zinc-950 dark:to-zinc-900'>
      <div className='mx-auto max-w-7xl px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6'>
          {/* Desktop Sidebar */}
          <aside className='hidden lg:block bg-white/80 dark:bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-5'>
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

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className='fixed inset-0 z-40 lg:hidden'>
              <div className='fixed inset-0 bg-black/50' onClick={() => setSidebarOpen(false)} />
              <div className='fixed left-0 top-0 bottom-0 w-64 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-r border-zinc-200/70 dark:border-zinc-800 p-5'>
                <div className='flex items-center justify-between mb-6'>
                  <Link href='/' className='flex items-center gap-3' onClick={() => setSidebarOpen(false)}>
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
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className='p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>

                <nav className='space-y-1'>
                  <Link
                    href='/app/generate'
                    className='block rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
                    onClick={() => setSidebarOpen(false)}
                  >
                    Generate
                  </Link>
                  <Link
                    href='/app/articles'
                    className='block rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
                    onClick={() => setSidebarOpen(false)}
                  >
                    Articles
                  </Link>
                  <Link
                    href='/app/settings'
                    className='block rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
                    onClick={() => setSidebarOpen(false)}
                  >
                    Settings
                  </Link>
                </nav>
              </div>
            </div>
          )}

          <div className='space-y-6'>
            <header className='bg-white/80 dark:bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 px-4 py-4 flex items-center justify-between gap-3'>
              <div className='flex items-center gap-3 shrink-0'>
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className='lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0'
                  aria-label='Open sidebar'
                >
                  <svg className='w-5 h-5 text-zinc-700 dark:text-zinc-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                  </svg>
                </button>

                <div className='min-w-0'>
                  <p className='hidden sm:block text-sm text-zinc-500 dark:text-zinc-400 truncate'>
                    ArticleAlchemist
                  </p>
                  <p className='text-base sm:text-lg font-medium text-zinc-900 dark:text-zinc-50 truncate'>
                    Workspace
                  </p>
                </div>
              </div>
              <UserMenu />
            </header>

            <main className='bg-white/80 dark:bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-4 sm:p-6'>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}


