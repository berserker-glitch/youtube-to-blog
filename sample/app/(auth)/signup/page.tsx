'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ThemeToggle } from '@/app/_components/ThemeToggle';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = useMemo(() => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const submit = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!emailValid) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch('/api/signup/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!resp.ok) {
        const json = await resp.json().catch(() => null);
        throw new Error(json?.error || 'Failed to send email');
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#fbfbfc] dark:bg-[#06070a] flex items-center text-zinc-900 dark:text-zinc-50'>
      <div className='pointer-events-none fixed inset-0 overflow-hidden'>
        <div className='absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-indigo-200/60 via-sky-200/40 to-transparent blur-3xl dark:from-indigo-500/20 dark:via-sky-500/10' />
        <div className='absolute -bottom-48 -right-48 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-amber-200/50 via-rose-200/30 to-transparent blur-3xl dark:from-amber-500/10 dark:via-rose-500/10' />
        <div className='absolute inset-0 opacity-[0.22] dark:opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.12)_1px,transparent_0)] [background-size:28px_28px]' />
      </div>
      <div className='mx-auto w-full max-w-lg px-4 py-8 sm:py-16'>
        <div className='relative flex items-center justify-between mb-6 sm:mb-10'>
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

        <div className='relative bg-white/70 dark:bg-zinc-950/40 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-5 sm:p-7 shadow-sm'>
          <h1 className='text-2xl font-light text-zinc-900 dark:text-zinc-50 tracking-tight'>
            Start with your email
          </h1>
          <p className='mt-2 text-zinc-600 dark:text-zinc-300 text-sm sm:text-base'>
            You’ll be sent an email with a link to create your account.
          </p>

          {sent && (
            <div className='mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-3'>
              <p className='text-sm text-emerald-800 dark:text-emerald-200'>
                Check your inbox for the account creation link.
              </p>
            </div>
          )}

          {error && (
            <div className='mt-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/20 px-4 py-3'>
              <p className='text-sm text-red-800 dark:text-red-200'>{error}</p>
            </div>
          )}

          <div className='mt-6'>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2'>
              Email address
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder='you@company.com'
              className='w-full px-4 py-4 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all text-base min-h-[44px]'
            />
            {!emailValid && (
              <p className='mt-2 text-sm text-red-700 dark:text-red-300'>
                Please enter a valid email address.
              </p>
            )}
          </div>

          <button
            onClick={submit}
            disabled={loading || !email.trim() || !emailValid}
            className='mt-5 w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-medium py-4 px-6 rounded-xl transition-colors disabled:cursor-not-allowed min-h-[44px] text-base'
          >
            {loading ? 'Sending…' : 'Send account link'}
          </button>

          <p className='mt-5 text-sm text-zinc-600 dark:text-zinc-300'>
            Already have an account?{' '}
            <Link href='/login' className='underline'>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


