'use client';

import Link from 'next/link';

export default function TermsPage() {
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
                Terms of Service
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
              Terms of Service
            </h1>
            <p className='mt-3 text-zinc-700 dark:text-zinc-300'>
              These Terms of Service (&quot;Terms&quot;) govern your access to and
              use of ArticleAlchemist (the &quot;Service&quot;). By creating an
              account or using the Service, you agree to be bound by these Terms.
              If you do not agree, you must not use the Service.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              1. Service description
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              ArticleAlchemist converts YouTube video transcripts into long-form
              article drafts and stores them in your workspace. The Service is
              provided on an &quot;as is&quot; and &quot;as available&quot;
              basis and may change over time as we iterate on the product.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              2. Accounts and acceptable use
            </h2>
            <ul className='mt-2 list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300'>
              <li>You must be at least 18 years old to use the Service.</li>
              <li>
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activity under your account.
              </li>
              <li>
                You agree not to misuse the Service, including (without
                limitation) attempting to break or bypass rate limits, reverse
                engineer the Service, or use it in violation of applicable law,
                YouTube&apos;s terms, or any third-party rights.
              </li>
              <li>
                We may suspend or terminate accounts that abuse free quotas, use
                the Service for unlawful purposes, or otherwise violate these
                Terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              3. Content and intellectual property
            </h2>
            <ul className='mt-2 list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300'>
              <li>
                You retain any rights you have to the source content (e.g. your
                videos and transcripts). You are solely responsible for ensuring
                that you have the necessary rights to use the source content with
                the Service.
              </li>
              <li>
                Generated drafts are produced based on your input and may contain
                errors or omissions. You are responsible for reviewing,
                editing, and using the output in a manner that complies with
                applicable law and platform policies.
              </li>
              <li>
                All Service code, branding, and UI are owned by us or our
                licensors and may not be copied, modified, or redistributed
                except as expressly permitted.
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              4. Plans, billing, and Paddle
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              The Service offers a free plan and paid subscription plans (such as
              Pro and Premium). Plan limits, pricing, and features are described
              on the pricing section of the landing page and may be updated from
              time to time. Changes to pricing or features will not retroactively
              apply to completed billing periods.
            </p>
            <p className='mt-3 text-zinc-700 dark:text-zinc-300'>
              All payments are processed by Paddle.com Market Limited
              (&quot;Paddle&quot;). Paddle is the Merchant of Record for all
              orders, and provides customer service and handles returns for
              those orders. When you purchase a paid plan, you enter into a
              billing relationship with Paddle, subject to Paddle&apos;s own
              terms, conditions, and policies. We do not store your full payment
              card details.
            </p>
            <p className='mt-3 text-zinc-700 dark:text-zinc-300'>
              Subscriptions renew automatically at the end of each billing period
              unless canceled in advance via the Paddle customer portal or any
              cancellation mechanism provided in the app. Access to paid features
              may be downgraded or disabled if a renewal payment fails, your
              subscription is canceled, or your account is otherwise not in good
              standing.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              5. Cancellations and refunds
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              You can cancel your subscription at any time; cancellation will
              take effect at the end of the current billing period, and you will
              retain access to paid features until that date. Refunds, if any,
              are handled in accordance with Paddle&apos;s refund policies and
              applicable consumer protection laws. For billing or refund
              questions, you may contact Paddle using the information included in
              your receipt or the Paddle checkout.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              6. Data and privacy
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              We use your account data to operate the Service (for example, to
              authenticate you, store your generated articles, and enforce plan
              limits). Billing data is processed by Paddle as Merchant of
              Record. We may collect usage metrics to improve the Service, but we
              do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              7. Disclaimers and limitation of liability
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              The Service is provided without warranties of any kind, whether
              express or implied. To the maximum extent permitted by law, we and
              our suppliers will not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or for any loss of
              profits or revenues, arising out of or in connection with your use
              of the Service.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              8. Changes to these Terms
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              We may update these Terms from time to time. If changes are
              material, we will provide reasonable notice (for example, via the
              app or email). Your continued use of the Service after the
              effective date of the updated Terms constitutes acceptance of the
              changes.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              9. Contact
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              If you have questions about these Terms or the Service, you can
              reach us at the contact email listed in the app or on your receipt
              from Paddle.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

