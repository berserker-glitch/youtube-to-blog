'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = search.get('check') === '1';
  const callbackUrl = search.get('callbackUrl') || '/app/articles';

  const emailValid = useMemo(() => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const onSubmit = async () => {
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
      await signIn('email', {
        email: email.trim(),
        callbackUrl,
        redirect: true,
      });
    } catch (e) {
      setError('Failed to send the sign-in email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-zinc-950 dark:to-zinc-900'>
      <div className='mx-auto max-w-lg px-4 py-16'>
        <Link href='/' className='inline-flex items-center gap-3 mb-10'>
          <div className='h-10 w-10 rounded-2xl bg-zinc-900 dark:bg-white' />
          <div>
            <p className='text-sm text-zinc-500 dark:text-zinc-400'>
              ArticleAlchemist
            </p>
            <p className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
              Sign in
            </p>
          </div>
        </Link>

        <div className='bg-white/80 dark:bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-6'>
          <h1 className='text-2xl font-light text-zinc-900 dark:text-zinc-50 tracking-tight'>
            Email verification
          </h1>
          <p className='mt-2 text-zinc-600 dark:text-zinc-300'>
            We’ll send you a one-time sign-in link using Gmail SMTP.
          </p>

          {check && (
            <div className='mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-3'>
              <p className='text-sm text-emerald-800 dark:text-emerald-200'>
                Check your inbox for the sign-in email.
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
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              placeholder='you@company.com'
              className='w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all'
            />
            {!emailValid && (
              <p className='mt-2 text-sm text-red-700 dark:text-red-300'>
                Please enter a valid email address.
              </p>
            )}
          </div>

          <button
            onClick={onSubmit}
            disabled={loading || !email.trim() || !emailValid}
            className='mt-5 w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed'
          >
            {loading ? 'Sending…' : 'Send sign-in email'}
          </button>

          <p className='mt-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed'>
            By continuing, you agree to receive a one-time verification email.
          </p>
        </div>
      </div>
    </div>
  );
}



