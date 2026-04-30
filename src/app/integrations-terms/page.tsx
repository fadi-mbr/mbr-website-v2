import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Integrations Terms | MBR Auto Services',
  description: 'Terms governing third-party integrations connected to MBR Making Better Rides systems.',
  robots: 'noindex, nofollow',
};

export default function IntegrationsTermsPage() {
  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="container-luxury max-w-4xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-red-400 hover:text-red-300 mb-8 transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="text-display font-light mb-8">Integrations Terms</h1>

        <div className="glass-card-premium p-8 space-y-6 text-body-enhanced leading-relaxed">
          <p className="text-subheading text-white mb-4">
            <strong>Last Updated:</strong> April 2026
          </p>

          <section>
            <h2 className="text-heading font-light text-white mb-4">1. Scope</h2>
            <p>
              These terms govern the connection between MBR Making Better Rides (&quot;MBR&quot;)
              internal operational systems and third-party platforms used to support
              accounting, reporting, and customer-experience functions. They apply
              alongside our <Link href="/privacy-policy" className="text-red-400 hover:text-red-300 underline">Privacy Policy</Link> and our <Link href="/cookie-policy" className="text-red-400 hover:text-red-300 underline">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">2. Connected Services</h2>
            <p>MBR currently maintains authorized connections to the following third-party platforms:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>QuickBooks Online (Intuit)</strong> — read-only access to MBR&apos;s books for
                internal financial reporting (accounts receivable, accounts payable,
                cash flow, profit and loss, balance sheet). No write operations are
                performed against MBR&apos;s QuickBooks data.
              </li>
              <li>
                <strong>Google Places API</strong> — read-only access to public review data for
                MBR&apos;s Google Business Profile, surfaced on the public website.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">3. Authorization &amp; Consent</h2>
            <p>
              Each connection is authorized by an MBR administrator using the
              third-party platform&apos;s native consent flow (typically OAuth 2.0). The
              authorizing admin can revoke access at any time directly from the
              third-party platform&apos;s app management settings, without notifying MBR.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">4. Data Handling</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Data fetched from connected services is processed in memory at the time
                of request. We do not maintain a long-term cache of customer-identifying
                financial detail.
              </li>
              <li>
                Aggregated, non-identifying figures (e.g. period totals) may be retained
                in operator dashboards or shared internally with MBR stakeholders.
              </li>
              <li>
                Credentials (API keys, OAuth refresh tokens) are stored in an encrypted
                secret manager. They are never written to source control or shared
                outside the operating team.
              </li>
              <li>
                We do not sell, rent, or share data fetched from connected services with
                third parties beyond MBR and its directly retained service providers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">5. Disconnection</h2>
            <p>
              You may disconnect any integration at any time. The third-party platform
              will invalidate the access tokens immediately on its end. We will treat the
              integration as terminated and stop attempting to fetch data once we receive
              the disconnect notification or our access tokens fail.
            </p>
            <p>
              For QuickBooks Online: <strong>Settings (gear) → Apps → My Apps → Disconnect</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">6. Liability</h2>
            <p>
              These integrations support internal MBR operations. MBR is not liable for
              service interruptions, data inaccuracies, or other issues originating from
              third-party platforms. Each connected service is governed by its own terms
              and privacy policies, which apply directly between you and that service.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">7. Contact</h2>
            <p>
              Questions about a specific integration, or to request disconnection on
              behalf of an MBR account, contact us via the channels listed on our{' '}
              <Link href="/contact" className="text-red-400 hover:text-red-300 underline">contact page</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">8. Changes</h2>
            <p>
              We may update these terms when integrations are added, removed, or
              materially changed. The &quot;Last Updated&quot; date above reflects the most
              recent revision.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
