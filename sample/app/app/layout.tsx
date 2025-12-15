import Link from 'next/link';
import { ThemeToggle } from '@/app/_components/ThemeToggle';
import { UserMenu } from './_components/UserMenu';
import { getAppServerSession } from '@/lib/auth-helpers';
import { GenerationProvider } from './_components/GenerationProvider';
import { GenerationBanner } from './_components/GenerationBanner';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppServerSession();
  const role = (session?.user as any)?.role as string | undefined;
  const isSuperAdmin = role === 'super_admin';

  return (
    <GenerationProvider>
    <div className='h-[100dvh] overflow-hidden bg-[#fbfbfc] dark:bg-[#06070a] text-zinc-900 dark:text-zinc-50'>
      {/* Background */}
      <div className='pointer-events-none fixed inset-0 overflow-hidden'>
        <div className='absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-indigo-200/50 via-sky-200/30 to-transparent blur-3xl dark:from-indigo-500/15 dark:via-sky-500/10' />
        <div className='absolute -bottom-48 -right-48 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-amber-200/35 via-rose-200/25 to-transparent blur-3xl dark:from-amber-500/10 dark:via-rose-500/10' />
        <div className='absolute inset-0 opacity-[0.22] dark:opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.12)_1px,transparent_0)] [background-size:28px_28px]' />
      </div>

      <div className='relative mx-auto max-w-7xl px-4 py-6 h-full'>
        <div className='grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 h-full min-h-0'>
          <aside className='bg-white/70 dark:bg-zinc-950/40 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-5 shadow-sm h-full overflow-auto'>
            <Link href='/' className='flex items-center gap-3 mb-6'>
              <div className='h-9 w-9 rounded-xl bg-zinc-900 dark:bg-white shadow-sm' />
              <div>
                <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                  ArticleAlchemist
                </p>
                <p className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
                  Dashboard
                </p>
              </div>
            </Link>

            <nav className='space-y-1'>
              {isSuperAdmin ? (
                <>
                  <Link
                    href='/app/admin'
                    className='block rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors'
                  >
                    Super Admin
                  </Link>
                  <Link
                    href='/app/settings'
                    className='block rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors'
                  >
                    Settings
                  </Link>
                </>
              ) : (
                <>
              <Link
                href='/app/generate'
                className='block rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors'
              >
                Generate
              </Link>
              <Link
                href='/app/articles'
                className='block rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors'
              >
                Articles
              </Link>
              <Link
                href='/app/integrations/wordpress'
                className='block rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors'
              >
                WordPress
              </Link>
              <Link
                href='/app/settings'
                className='block rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors'
              >
                Settings
              </Link>
                </>
              )}
            </nav>

            <div className='mt-6'>
              <ThemeToggle />
            </div>
          </aside>

          <div className='flex flex-col gap-6 min-h-0'>
            <header className='bg-white/70 dark:bg-zinc-950/40 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 px-6 py-4 shadow-sm flex items-center justify-between'>
              <div>
                <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                  Workspace
                </p>
                <p className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
                  ArticleAlchemist
                </p>
              </div>
              <div className='flex items-center gap-3'>
                <ThemeToggle />
                <UserMenu />
              </div>
            </header>

            <main className='bg-white/70 dark:bg-zinc-950/40 backdrop-blur rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-6 shadow-sm flex-1 min-h-0 overflow-auto'>
              <div className='mb-4'>
                <GenerationBanner />
              </div>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
    </GenerationProvider>
  );
}


