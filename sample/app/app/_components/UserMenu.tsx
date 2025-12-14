'use client';

import { signOut, useSession } from 'next-auth/react';

export function UserMenu() {
  const { data } = useSession();
  const email = data?.user?.email || 'Signed in';

  return (
    <div className='flex items-center gap-3'>
      <p className='text-sm text-zinc-700 dark:text-zinc-300 max-w-[260px] truncate'>
        {email}
      </p>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className='text-sm px-3 py-2 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors'
      >
        Sign out
      </button>
    </div>
  );
}


