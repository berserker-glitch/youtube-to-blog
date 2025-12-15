import { getAppServerSession } from '@/lib/auth-helpers';
import { getGenerationUsage } from '@/lib/rate-limit';
import type { UserPlan } from '@/lib/plan';

export default async function SettingsPage() {
  const session = await getAppServerSession();
  const userId = session?.user?.id;
  const plan = session?.user?.plan ?? 'free';
  const subscriptionStatus = session?.user?.subscriptionStatus ?? 'inactive';

  const planLabel =
    plan === 'pro' ? 'Pro' : plan === 'premium' ? 'Premium' : 'Free';

  const usage =
    userId && (plan === 'free' || plan === 'pro' || plan === 'premium')
      ? await getGenerationUsage({ userId, plan: plan as UserPlan })
      : null;

  return (
    <div>
      <div className='mb-8'>
        <h1 className='text-3xl md:text-4xl font-light tracking-tight'>
          Settings
        </h1>
        <p className='mt-2 text-zinc-700 dark:text-zinc-300 max-w-2xl'>
          Manage your account and billing.
        </p>
      </div>

      <div className='space-y-6'>
        <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-6'>
          <h2 className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
            Billing &amp; plan
          </h2>
          <p className='mt-1 text-sm text-zinc-700 dark:text-zinc-300'>
            Choose your ArticleAlchemist plan and manage billing with Paddle.
          </p>

          <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
            <div className='rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-4'>
              <p className='text-xs text-zinc-500 dark:text-zinc-400'>Current plan</p>
              <p className='mt-1 text-base font-medium'>
                {planLabel}
                {plan !== 'free' && (
                  <span className='ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400'>
                    ({subscriptionStatus})
                  </span>
                )}
              </p>
            </div>

            <div className='rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-4'>
              <p className='text-xs text-zinc-500 dark:text-zinc-400'>Usage limit</p>
              <p className='mt-1 text-base font-medium'>
                {usage ? usage.label : plan === 'free' ? '4/month' : plan === 'pro' ? '2/day' : '5/day'}
              </p>
              {usage ? (
                <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
                  Used {usage.used}/{usage.limit} • Resets {usage.resetAt.toLocaleString()}
                </p>
              ) : null}
            </div>

            <form
              className='rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-4 space-y-2'
              action='/api/billing/create-checkout'
              method='POST'
            >
              <p className='text-xs text-zinc-500 dark:text-zinc-400'>Upgrade to Pro</p>
              <p className='text-sm font-medium'>Pro · $8/month</p>
              <input type='hidden' name='plan' value='pro' />
              <button
                type='submit'
                className='mt-2 inline-flex w-full items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors'
              >
                Go Pro
              </button>
            </form>

            <form
              className='rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-4 space-y-2'
              action='/api/billing/create-checkout'
              method='POST'
            >
              <p className='text-xs text-zinc-500 dark:text-zinc-400'>Upgrade to Premium</p>
              <p className='text-sm font-medium'>Premium · $12/month</p>
              <input type='hidden' name='plan' value='premium' />
              <button
                type='submit'
                className='mt-2 inline-flex w-full items-center justify-center bg-white/80 dark:bg-zinc-950/40 border border-zinc-300/70 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white dark:hover:bg-zinc-900'
              >
                Go Premium
              </button>
            </form>
          </div>

          <p className='mt-4 text-xs text-zinc-500 dark:text-zinc-400'>
            Changes to your paid plan are applied once Paddle confirms your subscription.
          </p>
        </div>
      </div>
    </div>
  );
}


