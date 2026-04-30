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
                <strong>Scope minimization.</strong> We request only the OAuth scopes
                needed to deliver the stated function. For QuickBooks Online this is
                <code className="text-red-400"> com.intuit.quickbooks.accounting</code> (read-only). No payments,
                payroll, or write scopes are requested.
              </li>
              <li>
                <strong>In-memory processing.</strong> Data fetched from connected
                services is processed in operator memory at the time of request. We do
                not maintain a long-term cache of customer-identifying financial detail
                on our servers.
              </li>
              <li>
                <strong>Aggregated reporting.</strong> Non-identifying period totals may
                be retained in internal operator dashboards or shared with MBR
                stakeholders.
              </li>
              <li>
                <strong>Credential storage.</strong> API keys and OAuth refresh tokens
                are stored encrypted at rest in our secret-management platform
                (Infisical). They are never written to source control, application logs,
                browser bundles, or shared with third parties beyond named
                sub-processors.
              </li>
              <li>
                <strong>Sub-processors.</strong> Hosting and secret storage for the
                disconnect notification endpoint and the encrypted credential vault are
                provided by Vercel and Infisical respectively. Both are SOC 2 Type II
                audited under their own privacy commitments.
              </li>
              <li>
                <strong>Retention &amp; deletion on disconnect.</strong> When a connected
                platform notifies us of a disconnection, the associated OAuth refresh
                token and realm/account identifier are purged from our secret store
                within <strong>24 hours</strong>. No fetched report data persists beyond
                the active in-memory request.
              </li>
              <li>
                <strong>No resale or third-party marketing.</strong> We do not sell, rent,
                or share data fetched from connected services for advertising or
                analytics, with anyone outside MBR and the named sub-processors above.
              </li>
              <li>
                <strong>Audit logging.</strong> API call metadata (timestamps, status,
                Intuit&apos;s <code className="text-red-400">intuit_tid</code> trace identifier, realm ID) is logged
                server-side for support, debugging, and compliance review. Logs do not
                contain tokens or customer-identifying transaction detail.
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
            <h2 className="text-heading font-light text-white mb-4">6. Disclaimer of Warranties</h2>
            <p>
              Connected-service integrations are provided <strong>&quot;as is&quot;</strong> and{' '}
              <strong>&quot;as available&quot;</strong> for internal MBR operational use. MBR makes
              no warranty, express or implied, regarding the accuracy, completeness,
              reliability, or fitness-for-purpose of any data fetched from a third-party
              platform, including without limitation QuickBooks Online financial data.
              Authoritative records always reside with the third-party platform, not with
              this integration layer.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, MBR Making Better Rides
              and its operators are not liable for indirect, incidental, special,
              consequential, or punitive damages arising from these integrations,
              including business interruption, lost profits, lost data, or
              decisions made on the basis of fetched data, even if advised of the
              possibility of such damages. Each connected service is independently
              governed by its own terms of service and privacy policy, which apply
              directly between the relevant party and that service.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">8. Termination</h2>
            <p>
              You may terminate any integration at any time by disconnecting it from the
              third-party platform&apos;s app management settings (for QuickBooks Online:{' '}
              <strong>Settings (gear) → Apps → My Apps → Disconnect</strong>). On
              receipt of the platform&apos;s disconnect notification, our OAuth refresh
              token and realm identifier for that integration are purged from our secret
              store within 24 hours, in line with our <Link href="/privacy-policy" className="text-red-400 hover:text-red-300 underline">Privacy Policy</Link>.
              MBR may also terminate or suspend an integration unilaterally if a security
              incident, compliance requirement, or operational need warrants it.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">9. Governing Law</h2>
            <p>
              These terms are governed by the laws of the United Arab Emirates and the
              Emirate of Dubai, without regard to conflict-of-laws principles. Disputes
              arising from these integrations are subject to the exclusive jurisdiction
              of the courts of Dubai.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">10. Contact</h2>
            <p>
              Questions about a specific integration, or to request disconnection or data
              deletion on behalf of an MBR account, contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p><strong>MBR Making Better Rides</strong></p>
              <p>16 8 St Al Qouz Ind. Fourth — Al Quoz, Dubai, UAE</p>
              <p>Phone: <a href="tel:+971565015800" className="text-red-400 hover:text-red-300">+971 56 501 5800</a></p>
              <p>Email: <a href="mailto:info@mbrme.com" className="text-red-400 hover:text-red-300">info@mbrme.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">11. Changes</h2>
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
