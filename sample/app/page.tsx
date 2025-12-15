'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './_components/ThemeToggle';
import { LandingHeaderActions } from './_components/LandingHeaderActions';
import { Reveal } from './_components/Reveal';

const features = [
  {
    title: 'Chaptered for clarity',
    desc: 'Your article is organized into clean sections so readers (and search engines) can scan and trust it.',
  },
  {
    title: 'Search-friendly structure',
    desc: 'Strong headings and a coherent narrative designed to match what people are actually searching for.',
  },
  {
    title: 'A personal library',
    desc: 'Everything you generate is saved to your dashboard so you can revisit, copy, and download anytime.',
  },
  {
    title: 'Fewer rewrites',
    desc: 'Start from a clean, structured draft so you spend time polishing—not rebuilding from scratch.',
  },
  {
    title: 'Publish-ready depth',
    desc: 'A consistent long-form length target so your content feels complete without becoming bloated.',
  },
  {
    title: 'Grounded in the video',
    desc: 'The draft is based on the source transcript—cleaned up, clarified, and formatted for reading.',
  },
];

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/50 p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className='min-h-screen bg-[#fbfbfc] dark:bg-[#06070a] text-zinc-900 dark:text-zinc-50'>
      {/* Background */}
      <div className='pointer-events-none fixed inset-0 overflow-hidden'>
        <div className='absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-indigo-200/60 via-sky-200/40 to-transparent blur-3xl dark:from-indigo-500/20 dark:via-sky-500/10' />
        <div className='absolute -bottom-48 -right-48 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-amber-200/50 via-rose-200/30 to-transparent blur-3xl dark:from-amber-500/10 dark:via-rose-500/10' />
        <div className='absolute inset-0 opacity-[0.22] dark:opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.12)_1px,transparent_0)] [background-size:28px_28px]' />
      </div>

      <div className='relative'>
        <div className='mx-auto max-w-6xl px-4'>
          {/* Header */}
          <header className='sticky top-0 z-20 pt-6'>
            <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 backdrop-blur px-4 sm:px-5 py-4 shadow-sm flex items-center justify-between gap-4'>
              <Link href='/' className='flex items-center gap-3 min-w-0 shrink-1'>
                <div className='h-10 w-10 rounded-2xl bg-zinc-900 dark:bg-white shadow-sm shrink-0' />
                <div className='leading-tight min-w-0'>
                  <p className='text-sm text-zinc-600 dark:text-zinc-300 truncate'>
                    ArticleAlchemist
                  </p>
                  <p className='hidden sm:block text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate'>
                    Scolink Tool • From video to publish-ready article
                  </p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className='hidden md:flex items-center gap-6 text-sm text-zinc-700 dark:text-zinc-300 shrink-0'>
                <a href='#how' className='hover:text-zinc-900 dark:hover:text-white transition-colors'>
                  How it works
                </a>
                <a href='#features' className='hover:text-zinc-900 dark:hover:text-white transition-colors'>
                  Features
                </a>
                <a href='#pricing' className='hover:text-zinc-900 dark:hover:text-white transition-colors'>
                  Pricing
                </a>
                <a href='#faq' className='hover:text-zinc-900 dark:hover:text-white transition-colors'>
                  FAQ
                </a>
                <Link href='/contact' className='hover:text-zinc-900 dark:hover:text-white transition-colors'>
                  Contact
                </Link>
                <Link href='/terms' className='hover:text-zinc-900 dark:hover:text-white transition-colors'>
                  Terms
                </Link>
                <Link href='/refund' className='hover:text-zinc-900 dark:hover:text-white transition-colors'>
                  Refund
                </Link>
              </nav>

              {/* Mobile Navigation Button */}
              <div className='flex items-center gap-2 sm:gap-3 shrink-0'>
                <ThemeToggle />
                <div className='hidden sm:block'>
                  <LandingHeaderActions />
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className='md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
                  aria-label='Toggle mobile menu'
                >
                  <svg
                    className='w-5 h-5 text-zinc-700 dark:text-zinc-300'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    {mobileMenuOpen ? (
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    ) : (
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            {mobileMenuOpen && (
              <div className='md:hidden mt-2 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 backdrop-blur px-5 py-4 shadow-sm'>
                <nav className='flex flex-col gap-4 text-sm'>
                  <a
                    href='#how'
                    className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-2'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How it works
                  </a>
                  <a
                    href='#features'
                    className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-2'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a
                    href='#pricing'
                    className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-2'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </a>
                  <a
                    href='#faq'
                    className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-2'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    FAQ
                  </a>
                  <Link
                    href='/contact'
                    className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-2'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                  <Link
                    href='/terms'
                    className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-2'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Terms
                  </Link>
                  <Link
                    href='/refund'
                    className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-2'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Refund
                  </Link>
                  <div className='h-px bg-zinc-200 dark:bg-zinc-800 my-1' />
                  <Link
                    href='/login'
                    className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-2 font-medium'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href='/signup'
                    className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-2 font-medium'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create account
                  </Link>
                </nav>
              </div>
            )}
          </header>

          {/* Hero */}
          <section className='pt-14 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center'>
            <Reveal>
              <div className='inline-flex items-center gap-2 rounded-full border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-300'>
                <span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                <span className='hidden sm:inline'>From transcript to draft • Saved to your library • Export as Markdown</span>
                <span className='sm:hidden'>From video to article</span>
              </div>

              <h1 className='mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-balance'>
                Turn YouTube videos into{' '}
                <span className='bg-gradient-to-r from-zinc-900 via-indigo-700 to-zinc-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent'>
                  high-trust, publishable articles
                </span>
                .
              </h1>

              <p className='mt-5 text-base sm:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-xl'>
                Stop letting great videos disappear after the upload. ArticleAlchemist is a Scolink tool that turns a YouTube transcript into a clean long-form draft you can publish on your site—structured, readable, and ready for light editing. This is a separate service from Scolink&apos;s other offerings.
              </p>

              <div className='mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
                <Link
                  href='/signup'
                  className='inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-6 py-4 sm:px-5 sm:py-3 rounded-xl transition-colors shadow-sm text-center min-h-[44px]'
                >
                  Get started
                </Link>
                <Link
                  href='/app/generate'
                  className='inline-flex items-center justify-center bg-white/80 dark:bg-zinc-950/40 border border-zinc-300/70 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium px-6 py-4 sm:px-5 sm:py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-colors text-center min-h-[44px]'
                >
                  Open generator
                </Link>
              </div>

              <div className='mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3'>
                {[
                  { k: 'Best for', v: 'Creators & teams' },
                  { k: 'Output', v: 'Markdown (.md)' },
                  { k: 'Speed', v: 'Minutes, not hours' },
                ].map((s) => (
                  <Card key={s.k} className='p-4 rounded-2xl'>
                    <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                      {s.k}
                    </p>
                    <p className='mt-1 text-sm font-medium'>{s.v}</p>
                  </Card>
                ))}
              </div>
            </Reveal>

            <Reveal delayMs={120}>
              <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium'>What you get</p>
                <p className='text-xs text-zinc-500 dark:text-zinc-400'>A saved draft</p>
              </div>
              <div className='mt-4 grid grid-cols-1 gap-3'>
                <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 p-5'>
                  <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                    Example result
                  </p>
                  <p className='mt-1 text-lg font-medium'>
                    A structured long-form draft with clear sections
                  </p>
                  <p className='mt-3 text-sm text-zinc-700 dark:text-zinc-300'>
                    Source: your video transcript
                  </p>
                </div>
                <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 p-4 sm:p-5 overflow-hidden'>
                  <p className='font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words'>
                    # Article Title\n\n## Chapter 1\nLong, clean paragraphs…\n\n## Chapter 2\nSEO-focused headings…
                  </p>
                </div>
              </div>
              </Card>
            </Reveal>
          </section>

          {/* How it works */}
          <section id='how' className='py-16'>
            <Reveal>
              <div>
                <h2 className='text-2xl sm:text-3xl md:text-4xl font-light tracking-tight'>
                  How it works
                </h2>
                <p className='mt-2 text-zinc-700 dark:text-zinc-300 max-w-2xl text-sm sm:text-base'>
                  Paste a link. Get a draft. Edit and publish. Simple enough for solo creators, reliable enough for teams.
                </p>
              </div>
            </Reveal>

            <div className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-4'>
              {[
                { step: '01', title: 'Paste a YouTube link', desc: 'We pull the transcript (auto-captions supported) and prepare the source content.' },
                { step: '02', title: 'AI generates & refines', desc: 'AI creates chapters, writes the article, provides feedback, then revises for quality.' },
                { step: '03', title: 'Download or keep it saved', desc: 'Export Markdown or access the article anytime from your library.' },
              ].map((s) => (
                <Reveal key={s.step} delayMs={Number(s.step) * 30}>
                  <Card>
                  <p className='text-xs text-zinc-500 dark:text-zinc-400'>{s.step}</p>
                  <p className='mt-2 text-base sm:text-lg font-medium'>{s.title}</p>
                  <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed'>{s.desc}</p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Features */}
          <section id='features' className='py-16'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl font-light tracking-tight'>
              Features
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300 max-w-2xl text-sm sm:text-base'>
              Everything you need to turn videos into articles you can confidently publish.
            </p>

            <div className='mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4'>
              <Card className='lg:col-span-2'>
                <p className='text-base sm:text-lg font-medium'>Designed for production publishing</p>
                <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed'>
                  Your first draft should be readable and structured. ArticleAlchemist outputs clean Markdown with clear headings so you can edit quickly, publish faster, and keep everything organized in one place.
                </p>
                <div className='mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {features.slice(0, 4).map((f) => (
                    <div key={f.title} className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-4'>
                      <p className='text-sm font-medium'>{f.title}</p>
                      <p className='mt-1 text-sm text-zinc-700 dark:text-zinc-300'>{f.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <p className='text-base sm:text-lg font-medium'>What you can expect</p>
                <div className='mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300'>
                  <p>• A structured, long-form draft</p>
                  <p>• Clean headings and readable formatting</p>
                  <p>• Export as Markdown</p>
                  <p>• Saved history in your dashboard</p>
                  <p>• AI feedback loop for quality</p>
                  <p>• Auto-caption fallback support</p>
                  <p>• Plan-based AI model routing</p>
                </div>
                <Link
                  href='/signup'
                  className='mt-6 inline-flex w-full items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-6 py-4 sm:px-5 sm:py-3 rounded-xl transition-colors shadow-sm min-h-[44px]'
                >
                  Create account
                </Link>
              </Card>
            </div>
          </section>

          {/* Pricing */}
          <section id='pricing' className='py-16'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl font-light tracking-tight'>
              Pricing
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300 max-w-2xl text-sm sm:text-base'>
              Start free, then upgrade to Pro or Premium when you&apos;re ready.
            </p>

            <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='rounded-3xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 p-6 sm:p-7 shadow-sm'>
                <p className='text-sm text-zinc-500 dark:text-zinc-400'>Free</p>
                <p className='mt-2 text-2xl sm:text-3xl font-light'>$0</p>
                <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300'>Perfect for trying it on your next video.</p>
                <div className='mt-6 space-y-2 text-sm text-zinc-700 dark:text-zinc-300'>
                  <p>• 4 articles/month</p>
                  <p>• Saved library</p>
                  <p>• Markdown export</p>
                  <p>• AI feedback loop for quality</p>
                </div>
                <Link
                  href='/signup'
                  className='mt-6 inline-flex w-full items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-6 py-4 sm:px-5 sm:py-3 rounded-xl transition-colors min-h-[44px]'
                >
                  Create free account
                </Link>
              </div>

              <div className='rounded-3xl border border-zinc-200/70 dark:border-zinc-800 bg-gradient-to-b from-white/70 to-white/40 dark:from-zinc-950/40 dark:to-zinc-950/20 p-6 sm:p-7 shadow-sm'>
                <p className='text-sm text-zinc-500 dark:text-zinc-400'>Paid plans</p>
                <p className='mt-2 text-2xl sm:text-3xl font-light'>Pro &amp; Premium</p>
                <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300'>Higher limits and team-friendly features.</p>

                <div className='mt-6 space-y-4 text-sm text-zinc-700 dark:text-zinc-300'>
                  <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-4'>
                    <p className='text-sm font-medium'>Pro · $8/month</p>
                    <p className='mt-1 text-xs text-zinc-600 dark:text-zinc-400'>
                      4 articles per week • GPT-5.2 writer • AI feedback loop
                    </p>
                  </div>
                  <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-4'>
                    <p className='text-sm font-medium'>Premium · $12/month</p>
                    <p className='mt-1 text-xs text-zinc-600 dark:text-zinc-400'>
                      1 article per day • GPT-5.2 writer • AI feedback loop
                    </p>
                  </div>
                </div>

                <Link
                  href='/signup'
                  className='mt-6 inline-flex w-full items-center justify-center bg-white/80 dark:bg-zinc-950/40 border border-zinc-300/70 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium px-6 py-4 sm:px-5 sm:py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-colors min-h-[44px]'
                >
                  Choose a paid plan
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id='faq' className='py-16'>
            <h2 className='text-3xl md:text-4xl font-light tracking-tight'>FAQ</h2>
            <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-4'>
              {[
                {
                  q: 'Why do I need captions?',
                  a: 'ArticleAlchemist uses the video transcript/captions as the source. If a video has no captions, we can’t generate a draft yet.',
                },
                {
                  q: 'Where are my articles stored?',
                  a: 'In your account library, so you can come back later and access every past draft.',
                },
                {
                  q: 'Can I download Markdown?',
                  a: 'Yes. You can export every article as Markdown and keep it saved in your library.',
                },
                {
                  q: 'Does it “invent” content?',
                  a: 'The draft is grounded in your transcript. It’s cleaned up, clarified, and structured for reading.',
                },
              ].map((item) => (
                <div key={item.q} className='rounded-3xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 p-5 sm:p-6 shadow-sm'>
                  <p className='text-base sm:text-lg font-medium'>{item.q}</p>
                  <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed'>{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className='py-12 border-t border-zinc-200/70 dark:border-zinc-800'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
              <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                © {new Date().getFullYear()} ArticleAlchemist
              </p>
              <div className='flex items-center gap-4 text-sm'>
                <Link href='/login' className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'>
                  Sign in
                </Link>
                <Link href='/signup' className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'>
                  Create account
                </Link>
                <Link href='/app' className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'>
                  App
                </Link>
                <Link href='/contact' className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'>
                  Contact
                </Link>
                <Link href='/terms' className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'>
                  Terms
                </Link>
                <Link href='/privacy' className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'>
                  Privacy
                </Link>
                <Link href='/refund' className='text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'>
                  Refund
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
