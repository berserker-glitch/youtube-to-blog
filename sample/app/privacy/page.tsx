'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
                Privacy Policy
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
              Privacy Policy
            </h1>
            <p className='mt-3 text-zinc-700 dark:text-zinc-300'>
              This Privacy Policy describes how Scolink (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
              collects, uses, and protects your information when you use ArticleAlchemist
              (the &quot;Service&quot;). We are committed to protecting your privacy and ensuring
              the security of your personal information.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              1. Information we collect
            </h2>
            <ul className='mt-2 list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300'>
              <li>
                <strong>Account Information:</strong> When you create an account, we collect
                your email address, name, and account credentials.
              </li>
              <li>
                <strong>Usage Data:</strong> We collect information about how you use the
                Service, including the YouTube URLs you process, generation timestamps, and
                your interaction patterns.
              </li>
              <li>
                <strong>Content Data:</strong> We process and store the articles you generate,
                along with the source YouTube transcripts used to create them.
              </li>
              <li>
                <strong>Payment Information:</strong> Billing data is processed by Paddle.com,
                our payment processor. We do not store your full payment card details.
              </li>
              <li>
                <strong>Technical Data:</strong> We automatically collect device information,
                IP addresses, browser types, and usage analytics to improve our Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              2. How we use your information
            </h2>
            <ul className='mt-2 list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300'>
              <li>To provide and maintain the Service</li>
              <li>To authenticate your account and process payments</li>
              <li>To store and organize your generated articles</li>
              <li>To improve the Service through analytics and user feedback</li>
              <li>To communicate with you about your account and the Service</li>
              <li>To enforce our Terms of Service and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              3. Information sharing
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              We do not sell, trade, or otherwise transfer your personal information to third
              parties, except in the following circumstances:
            </p>
            <ul className='mt-2 list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300'>
              <li>
                <strong>Service Providers:</strong> We may share information with trusted
                third-party service providers who assist us in operating the Service (such as
                Paddle for payments and cloud hosting providers).
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information if required
                by law, legal process, or government request.
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger, acquisition,
                or sale of assets, your information may be transferred as part of the transaction.
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              4. Data retention
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              We retain your personal information for as long as necessary to provide the Service
              and fulfill the purposes outlined in this Privacy Policy. Account data and generated
              articles are retained while your account is active. If you delete your account, your
              data will be permanently deleted within 30 days, except as required for legal or
              legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              5. Data security
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction. However, no method of transmission over the internet or electronic
              storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              6. Your rights
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              Depending on your location, you may have certain rights regarding your personal
              information, including:
            </p>
            <ul className='mt-2 list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300'>
              <li>The right to access the personal information we hold about you</li>
              <li>The right to correct inaccurate or incomplete information</li>
              <li>The right to delete your personal information</li>
              <li>The right to restrict or object to processing</li>
              <li>The right to data portability</li>
            </ul>
            <p className='mt-3 text-zinc-700 dark:text-zinc-300'>
              To exercise these rights, please visit our{' '}
              <Link href='/contact' className='text-indigo-600 dark:text-indigo-400 hover:underline'>
                contact page
              </Link>.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              7. Cookies and tracking
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              We use cookies and similar technologies to enhance your experience with the Service,
              including for authentication, analytics, and preferences. You can control cookie
              settings through your browser, though this may affect Service functionality.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              8. International data transfers
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              Your information may be transferred to and processed in countries other than your
              own. We ensure that such transfers comply with applicable data protection laws and
              implement appropriate safeguards.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              9. Children&apos;s privacy
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              The Service is not intended for children under 18 years of age. We do not knowingly
              collect personal information from children under 18. If we become aware that we have
              collected such information, we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              10. Changes to this Privacy Policy
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              We may update this Privacy Policy from time to time. If we make material changes,
              we will provide reasonable notice (for example, via the app or email). Your continued
              use of the Service after the effective date of the updated Privacy Policy constitutes
              acceptance of the changes.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
              11. Contact us
            </h2>
            <p className='mt-2 text-zinc-700 dark:text-zinc-300'>
              If you have questions about this Privacy Policy or our data practices, please visit our{' '}
              <Link href='/contact' className='text-indigo-600 dark:text-indigo-400 hover:underline'>
                contact page
              </Link>.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}