'use client';

import Link from 'next/link';

export default function RefundPage() {
  return (
    <div className='min-h-screen bg-[#fbfbfc] dark:bg-[#06070a] text-zinc-900 dark:text-zinc-50'>
      <div className='mx-auto max-w-3xl px-4 py-10 sm:py-16'>
        <header className='mb-10 flex items-center justify-between gap-4'>
          <Link href='/' className='inline-flex items-center gap-3'>
            <div className='h-9 w-9 rounded-xl bg-zinc-900 dark:bg-white' />
            <div>
              <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                ArticleAlchemist
              </p>
              <p className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
                Refund Policy
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
              Refund Policy
            </h1>
            <p className='mt-3 text-zinc-700 dark:text-zinc-300'>
              At Scolink, we want you to be satisfied with ArticleAlchemist. This Refund Policy
              outlines our refund process and eligibility criteria. All payments are processed
              by Paddle.com Market Limited (&quot;Paddle&quot;), and refunds are handled through
              their system in accordance with their policies and applicable consumer protection laws.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              14-Day Refund Guarantee
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              If you are not satisfied with ArticleAlchemist, you can request a full refund within
              14 days of your initial purchase. This applies to all subscription plans (Pro and Premium).
              To be eligible for a refund, you must contact us within this 14-day period.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              How to Request a Refund
            </h2>
            <ul className='mt-2 list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300'>
              <li>Contact Paddle support through your account dashboard or receipt</li>
              <li>Include your account email and reason for the refund request</li>
              <li>Requests must be made within 14 days of purchase</li>
              <li>Paddle will process eligible refunds according to their refund policy</li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              Refund Eligibility
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              Refunds are available for the following reasons:
            </p>
            <ul className='mt-2 list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300'>
              <li>Technical issues preventing normal use of the Service</li>
              <li>Service not meeting advertised functionality</li>
              <li>Dissatisfaction with the Service within the 14-day period</li>
            </ul>
            <p className='mt-3 text-zinc-700 dark:text-zinc-300'>
              Refunds are not available for:
            </p>
            <ul className='mt-2 list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300'>
              <li>Requests made after the 14-day period has expired</li>
              <li>Change of mind after the refund window has closed</li>
              <li>Violation of our Terms of Service</li>
              <li>Requests for partial refunds or prorated amounts</li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              Subscription Cancellation
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              You can cancel your subscription at any time through your Paddle account. Cancellation
              will take effect at the end of your current billing period, and you will retain access
              to paid features until that date. Cancellations do not automatically trigger refunds
              for unused portions of the billing period.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              Processing Time
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              Approved refunds are typically processed within 3-5 business days through Paddle&apos;s
              system. The time for the refund to appear in your original payment method may vary
              depending on your bank or payment provider.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              Contact Information
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              For refund requests or questions about this policy, please contact Paddle support
              using the information provided in your purchase confirmation email or through your
              Paddle account dashboard. For general Service questions, please visit our{' '}
              <Link href='/contact' className='text-indigo-600 dark:text-indigo-400 hover:underline'>
                contact page
              </Link>.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              Changes to This Policy
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              We may update this Refund Policy from time to time. If we make material changes,
              we will provide reasonable notice (for example, via the app or email). Your continued
              use of the Service after the effective date of the updated Refund Policy constitutes
              acceptance of the changes.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}