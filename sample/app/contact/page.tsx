'use client';

import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className='min-h-screen bg-[#fbfbfc] dark:bg-[#06070a] text-zinc-900 dark:text-zinc-50'>
      <div className='mx-auto max-w-3xl px-4 py-10 sm:py-16'>
        <header className='mb-10 flex items-center justify-between gap-4'>
          <Link href='/' className='inline-flex items-center gap-3'>
            <div className='h-9 w-9 rounded-xl bg-zinc-900 dark:bg-white' />
            <div>
              <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                ArticleAlchemist by Scolink
              </p>
              <p className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
                Contact Us
              </p>
            </div>
          </Link>
          <Link
            href='/app'
            className='text-sm text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white'
          >
            Back to app
          </Link>
        </header>

        <main className='space-y-8 text-sm sm:text-base leading-relaxed'>
          <section>
            <p className='text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <h1 className='mt-2 text-2xl sm:text-3xl font-light tracking-tight'>
              Contact Information
            </h1>
            <p className='mt-3 text-zinc-700 dark:text-zinc-300'>
              Get in touch with Scolink, the company behind ArticleAlchemist. We are here to help with any questions about our service.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              Business Information
            </h2>
            <div className='mt-2 space-y-2 text-zinc-700 dark:text-zinc-300'>
              <p><strong>Company Name:</strong> Scolink</p>
              <p><strong>Service:</strong> ArticleAlchemist</p>
              <p><strong>Website:</strong> articlealchemist.scolink.ink</p>
              <p><strong>Support Email:</strong> support@scolink.ink</p>
            </div>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              Support
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              For technical support, billing questions, or general inquiries about ArticleAlchemist, please contact us at:
            </p>
            <div className='mt-4 p-4 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40'>
              <p className='font-mono text-sm'>support@scolink.ink</p>
            </div>
            <p className='mt-3 text-zinc-700 dark:text-zinc-300'>
              For billing and subscription-related questions, you can also contact Paddle support directly through your Paddle account dashboard.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              Response Time
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              We aim to respond to all inquiries within 24-48 hours during business days. For urgent technical issues, please include URGENT in your email subject line.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              Legal Documents
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              For legal inquiries or questions about our policies, please refer to our legal documents:
            </p>
            <ul className='mt-2 list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300'>
              <li><Link href='/terms' className='text-indigo-600 dark:text-indigo-400 hover:underline'>Terms of Service</Link></li>
              <li><Link href='/privacy' className='text-indigo-600 dark:text-indigo-400 hover:underline'>Privacy Policy</Link></li>
              <li><Link href='/refund' className='text-indigo-600 dark:text-indigo-400 hover:underline'>Refund Policy</Link></li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}