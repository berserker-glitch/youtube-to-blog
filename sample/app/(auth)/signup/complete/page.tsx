'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { ThemeToggle } from '@/app/_components/ThemeToggle';

export default function SignupCompletePage() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get('token') || '';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!token) return false;
    if (!name.trim()) return false;
    if (password.length < 8) return false;
    if (password !== password2) return false;
    return true;
  }, [token, name, password, password2]);

  const submit = async () => {
    setError(null);
    if (!token) {
      setError('Invalid or missing token.');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch('/api/signup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password, password2 }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Failed to create account');

      const email = json?.email;
      if (!email) throw new Error('Missing email from server');

      // Auto-login as requested
      await signIn('credentials', {
        email,
        password,
        callbackUrl: '/app/articles',
        redirect: true,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className='min-h-screen bg-[#fbfbfc] dark:bg-[#06070a] flex items-center text-zinc-900 dark:text-zinc-50'>
        <div className='pointer-events-none fixed inset-0 overflow-hidden'>
          <div className='absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-indigo-200/60 via-sky-200/40 to-transparent blur-3xl dark:from-indigo-500/20 dark:via-sky-500/10' />
          <div className='absolute -bottom-48 -right-48 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-amber-200/50 via-rose-200/30 to-transparent blur-3xl dark:from-amber-500/10 dark:via-rose-500/10' />
          <div className='absolute inset-0 opacity-[0.22] dark:opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.12)_1px,transparent_0)] [background-size:28px_28px]' />
        </div>
        <div className='mx-auto w-full max-w-lg px-4 py-16'>
          <div className='relative flex items-center justify-between mb-10'>
            <Link href='/' className='inline-flex items-center gap-3'>
              <div className='h-10 w-10 rounded-2xl bg-zinc-900 dark:bg-white shadow-sm' />
              <div>
                <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                  ArticleAlchemist
                </p>
                <p className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
                  Create account
                </p>
              </div>
            </Link>
            <ThemeToggle />
          </div>

          <div className='relative bg-white/70 dark:bg-zinc-950/40 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-7 shadow-sm'>
            <h1 className='text-2xl font-light text-zinc-900 dark:text-zinc-50 tracking-tight'>
              Link invalid
            </h1>
            <p className='mt-2 text-zinc-600 dark:text-zinc-300'>
              This account creation link is missing or invalid.
            </p>
            <div className='mt-6 flex gap-3'>
              <button
                onClick={() => router.push('/signup')}
                className='bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl transition-colors'
              >
                Request a new link
              </button>
              <Link
                href='/login'
                className='px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#fbfbfc] dark:bg-[#06070a] flex items-center text-zinc-900 dark:text-zinc-50'>
      <div className='pointer-events-none fixed inset-0 overflow-hidden'>
        <div className='absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-indigo-200/60 via-sky-200/40 to-transparent blur-3xl dark:from-indigo-500/20 dark:via-sky-500/10' />
        <div className='absolute -bottom-48 -right-48 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-amber-200/50 via-rose-200/30 to-transparent blur-3xl dark:from-amber-500/10 dark:via-rose-500/10' />
        <div className='absolute inset-0 opacity-[0.22] dark:opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.12)_1px,transparent_0)] [background-size:28px_28px]' />
      </div>
      <div className='mx-auto w-full max-w-lg px-4 py-16'>
        <div className='relative flex items-center justify-between mb-10'>
          <Link href='/' className='inline-flex items-center gap-3'>
            <div className='h-10 w-10 rounded-2xl bg-zinc-900 dark:bg-white shadow-sm' />
            <div>
              <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                ArticleAlchemist
              </p>
              <p className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
                Create account
              </p>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        <div className='relative bg-white/70 dark:bg-zinc-950/40 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-7 shadow-sm'>
          <h1 className='text-2xl font-light text-zinc-900 dark:text-zinc-50 tracking-tight'>
            Finish setup
          </h1>
          <p className='mt-2 text-zinc-600 dark:text-zinc-300'>
            Add your name and set a password. You’ll be logged in immediately.
          </p>

          {error && (
            <div className='mt-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/20 px-4 py-3'>
              <p className='text-sm text-red-800 dark:text-red-200'>{error}</p>
            </div>
          )}

          <div className='mt-6 space-y-4'>
            <div>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2'>
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all'
                placeholder='Your name'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2'>
                Password
              </label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all'
                placeholder='At least 8 characters'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2'>
                Confirm password
              </label>
              <input
                type='password'
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className='w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all'
                placeholder='Repeat password'
              />
              {password && password2 && password !== password2 && (
                <p className='mt-2 text-sm text-red-700 dark:text-red-300'>
                  Passwords do not match.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit || loading}
            className='mt-5 w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed'
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  );
}


