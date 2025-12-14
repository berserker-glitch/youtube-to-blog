'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export function LandingHeaderActions() {
  const { data, status } = useSession();
  const email = data?.user?.email || '';

  if (status === 'loading') {
    return (
      <div className='flex items-center gap-3'>
        <div className='h-9 w-24 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/40 animate-pulse' />
        <div className='h-9 w-28 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/40 animate-pulse' />
      </div>
    );
  }

  if (data?.user) {
    const initial = (email?.[0] || 'U').toUpperCase();
    return (
      <div className='flex items-center gap-3'>
        <Link
          href='/app'
          className='inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-6 py-4 sm:px-4 sm:py-2 rounded-xl transition-colors shadow-sm min-h-[44px] text-base'
        >
          Dashboard
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className='inline-flex items-center gap-2 bg-white/80 dark:bg-zinc-950/40 border border-zinc-300/70 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium px-4 py-4 sm:px-3 sm:py-2 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-colors min-h-[44px] text-base'
          title={email}
        >
          <span className='inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-semibold'>
            {initial}
          </span>
          <span className='hidden sm:block max-w-[160px] truncate text-sm'>
            {email}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-3'>
      <Link
        href='/login'
        className='hidden sm:inline-flex items-center justify-center bg-white/80 dark:bg-zinc-950/40 border border-zinc-300/70 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium px-6 py-4 sm:px-4 sm:py-2 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-colors min-h-[44px] text-base'
      >
        Sign in
      </Link>
      <Link
        href='/signup'
        className='inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-6 py-4 sm:px-4 sm:py-2 rounded-xl transition-colors shadow-sm min-h-[44px] text-base'
      >
        Create account
      </Link>
    </div>
  );
}


