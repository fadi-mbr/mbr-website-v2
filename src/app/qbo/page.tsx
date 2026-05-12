import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'QuickBooks Integration | MBR Auto Services',
  description: 'Information about MBR Making Better Rides connection to QuickBooks Online.',
  robots: 'noindex, nofollow',
};

export default function QboLandingPage() {
  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="container-luxury max-w-4xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-link mb-8 transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="text-display font-light mb-8">QuickBooks Online Integration</h1>

        <div className="glass-card-premium p-8 space-y-6 text-body-enhanced leading-relaxed">
          <section>
            <h2 className="text-heading font-light text-white mb-4">Overview</h2>
            <p>
              MBR Making Better Rides connects to QuickBooks Online via Intuit&apos;s
              official OAuth 2.0 API to support internal financial reporting. The
              connection is <strong>read-only</strong>. We never write to MBR&apos;s books.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">What we read</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Aged Receivables and Aged Payables</li>
              <li>Statement of Cash Flows</li>
              <li>Profit &amp; Loss</li>
              <li>Balance Sheet</li>
              <li>Company information (name, country, fiscal year)</li>
            </ul>
            <p>
              These reports drive period reviews, cash-position checks, and operational
              decisions. We do not extract individual transactions, customer PII, or
              vendor PII unless explicitly required for a specific support ticket.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">Authorization</h2>
            <p>
              Access is granted by an MBR administrator from inside QuickBooks Online
              via Intuit&apos;s standard consent flow. Once authorized, a refresh token
              with the <code className="text-red-400">com.intuit.quickbooks.accounting</code> scope is stored in our
              encrypted secret manager. Tokens are rotated on every refresh per
              Intuit&apos;s policy.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">Disconnecting</h2>
            <p>
              MBR administrators can revoke access at any time:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Sign in to QuickBooks Online</li>
              <li>Go to <strong>Settings (gear) → Apps → My Apps</strong></li>
              <li>Find the MBR integration entry and click <strong>Disconnect</strong></li>
            </ol>
            <p>
              Intuit invalidates the refresh token immediately and notifies our
              disconnect endpoint. The integration stops fetching data on the next
              attempted call.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">Terms &amp; privacy</h2>
            <p>
              Use of this integration is governed by our{' '}
              <Link href="/integrations-terms" className="text-link">Integrations Terms</Link>,{' '}
              <Link href="/privacy" className="text-link">Privacy Policy</Link>, and{' '}
              <Link href="/cookie-policy" className="text-link">Cookie Policy</Link>.
              Intuit&apos;s use of authorized data is governed by{' '}
              <a href="https://www.intuit.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-link">Intuit&apos;s privacy notice</a>.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">Support &amp; contact</h2>
            <p>
              Integration support, data-access requests, or off-cycle disconnection
              requests:
            </p>
            <div className="mt-4 space-y-2">
              <p>Email: <a href="mailto:info@mbrme.com" className="text-link">info@mbrme.com</a></p>
              <p>Phone: <a href="tel:+971565015800" className="text-link">+971 56 501 5800</a></p>
              <p>Address: 16 8 St Al Qouz Ind. Fourth, Al Quoz, Dubai, UAE</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
