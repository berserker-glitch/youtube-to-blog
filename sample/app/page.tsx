import Link from 'next/link';

export default function HomePage() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-zinc-950 dark:to-zinc-900'>
      <div className='container mx-auto px-4 py-16 max-w-6xl'>
        <header className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-2xl bg-zinc-900 dark:bg-white' />
            <div>
              <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                ArticleAlchemist
              </p>
              <p className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
                YouTube → Article SaaS
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <Link
              href='/app/generate'
              className='inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl transition-colors'
            >
              Open app
            </Link>
          </div>
        </header>

        <section className='mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center'>
          <div>
            <h1 className='text-4xl md:text-6xl font-light text-zinc-900 dark:text-zinc-50 tracking-tight'>
              Turn YouTube transcripts into polished articles.
            </h1>
            <p className='mt-5 text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-xl'>
              ArticleAlchemist transforms captioned videos into structured,
              SEO-optimized Markdown that’s ready to publish.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Link
                href='/app/generate'
                className='inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-5 py-3 rounded-xl transition-colors'
              >
                Start generating
              </Link>
              <Link
                href='/app/articles'
                className='inline-flex items-center justify-center bg-white/80 dark:bg-zinc-950/40 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium px-5 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'
              >
                View dashboard
              </Link>
            </div>

            <div className='mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-4'>
                <p className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
                  Semantic chapters
                </p>
                <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-300'>
                  Topic shifts, not arbitrary chunks.
                </p>
              </div>
              <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-4'>
                <p className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
                  SEO structure
                </p>
                <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-300'>
                  Clean H2/H3, keyword-aware.
                </p>
              </div>
              <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-4'>
                <p className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
                  Markdown output
                </p>
                <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-300'>
                  Download a single `.md` file.
                </p>
              </div>
            </div>
          </div>

          <div className='rounded-3xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-6'>
            <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950/30 dark:to-zinc-950/10 p-6'>
              <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                What you get
              </p>
              <p className='mt-2 text-xl font-medium text-zinc-900 dark:text-zinc-100'>
                A clean, publish-ready article
              </p>
              <div className='mt-5 space-y-3 text-sm text-zinc-700 dark:text-zinc-300'>
                <p>
                  - Refined structure built from transcript meaning and flow.
                </p>
                <p>- Natural SEO optimization aligned to the video topic.</p>
                <p>- Your library of past articles (coming next).</p>
              </div>
              <p className='mt-6 text-xs text-zinc-500 dark:text-zinc-400'>
                Note: this product currently requires captioned videos.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
