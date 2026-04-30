import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Connect QuickBooks | MBR Auto Services',
  description: 'How to connect or reconnect QuickBooks Online to MBR Making Better Rides.',
  robots: 'noindex, nofollow',
};

export default function QboConnectPage() {
  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="container-luxury max-w-4xl mx-auto px-4">
        <Link
          href="/qbo"
          className="inline-flex items-center text-red-400 hover:text-red-300 mb-8 transition-colors"
        >
          ← Back to QuickBooks Integration
        </Link>

        <h1 className="text-display font-light mb-8">Connect QuickBooks Online</h1>

        <div className="glass-card-premium p-8 space-y-6 text-body-enhanced leading-relaxed">
          <section>
            <h2 className="text-heading font-light text-white mb-4">Who this is for</h2>
            <p>
              This page is intended for MBR administrators connecting (or reconnecting)
              MBR&apos;s QuickBooks Online company to our internal reporting integration. The
              integration is <strong>private to MBR</strong> — it is not listed on the Intuit
              App Store and not available to other QuickBooks customers.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">How to connect</h2>
            <p>
              The connection is initiated server-side by the MBR operations team. You
              will receive an Intuit consent URL from your operator contact. Open the
              URL in a browser where you are signed in to QuickBooks Online as an
              administrator of the MBR company, review the requested permissions, and
              click <strong>Connect</strong>.
            </p>
            <p>
              The requested scope is{' '}
              <code className="text-red-400">com.intuit.quickbooks.accounting</code> — read-only access to
              accounting data. No additional scopes are requested.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">What happens after you connect</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Intuit issues a long-lived refresh token bound to the MBR company.</li>
              <li>The token is stored in our encrypted secret manager.</li>
              <li>The integration begins fetching reports on the schedule agreed with MBR (typically on demand or daily).</li>
              <li>Tokens auto-rotate on every API call per Intuit&apos;s OAuth 2.0 policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">Reconnecting</h2>
            <p>
              Refresh tokens become invalid if 100 days pass without an API call, if a
              token rotation step fails partway through, or if an MBR admin manually
              disconnects the integration from QuickBooks Online. To reconnect, request
              a fresh consent URL from the MBR operations team and repeat the flow
              above.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">Need to disconnect?</h2>
            <p>
              You can disconnect the integration at any time directly from QuickBooks
              Online: <strong>Settings (gear) → Apps → My Apps → Disconnect</strong>. See
              the{' '}
              <Link href="/qbo" className="text-red-400 hover:text-red-300 underline">
                QuickBooks Integration overview
              </Link>{' '}
              for details on what disconnection does on our side.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">Terms</h2>
            <p>
              Connecting accepts our{' '}
              <Link href="/integrations-terms" className="text-red-400 hover:text-red-300 underline">
                Integrations Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="text-red-400 hover:text-red-300 underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">Support</h2>
            <p>
              For help connecting, troubleshooting an authorization failure, or
              requesting a fresh consent URL: <a href="mailto:info@mbrme.com" className="text-red-400 hover:text-red-300">info@mbrme.com</a> ·{' '}
              <a href="tel:+971565015800" className="text-red-400 hover:text-red-300">+971 56 501 5800</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
