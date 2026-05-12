import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | MBR Auto Services',
  description:
    'How MBR Making Better Rides collects, uses, shares, and protects your personal data, including data processed via WhatsApp, our self-hosted contact platform, and our service partners. Compliant with UAE Federal Decree-Law No. 45 of 2021 (PDPL).',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://mbrme.com/privacy',
  },
};

const LAST_UPDATED = 'May 8, 2026';
const EFFECTIVE_DATE = 'May 8, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="container-luxury max-w-4xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-link mb-8 transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="text-display font-light mb-8">Privacy Policy</h1>

        <div className="glass-card-premium p-8 space-y-8 text-body-enhanced leading-relaxed">
          <p className="text-subheading text-white">
            <strong>Effective date:</strong> {EFFECTIVE_DATE}
            <br />
            <strong>Last updated:</strong> {LAST_UPDATED}
          </p>

          <section>
            <h2 className="text-heading font-light text-white mb-4">1. Who we are</h2>
            <p>
              This Privacy Policy describes how MBR Making Better Rides (&quot;MBR&quot;, &quot;we&quot;, &quot;our&quot;,
              or &quot;us&quot;) collects, uses, shares, and protects personal data when you visit{' '}
              <a href="https://mbrme.com" className="text-link">
                mbrme.com
              </a>
              , contact us by phone, WhatsApp, email, or social media, or use our automotive services in
              Dubai, United Arab Emirates.
            </p>
            <p className="mt-3">
              MBR is the data controller for the personal data described in this policy. We process personal
              data in accordance with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal
              Data (the &quot;PDPL&quot;), and, where applicable, the General Data Protection Regulation (EU
              2016/679, the &quot;GDPR&quot;) for visitors located in the European Economic Area or the United
              Kingdom.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">2. Personal data we collect</h2>

            <h3 className="text-subheading font-medium text-white mb-2">2.1 Information you give us directly</h3>
            <p>
              We collect information you choose to provide when you contact us, request a quote, book a
              service, message us on WhatsApp, Instagram, Facebook, or email, or interact with the live-chat
              widget on our website. This typically includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Your name and how you prefer to be addressed</li>
              <li>Phone number, WhatsApp number, and email address</li>
              <li>Vehicle information (make, model, year, registration plate, VIN, mileage)</li>
              <li>Description of the issue or service you are requesting</li>
              <li>Photos, videos, voice notes, or documents you send us</li>
              <li>Payment-related information you share to complete a transaction</li>
              <li>Any other information you choose to share in your messages</li>
            </ul>

            <h3 className="text-subheading font-medium text-white mb-2 mt-6">2.2 Information collected automatically</h3>
            <p>
              When you visit our website we automatically collect limited technical information: IP address,
              browser type and version, operating system, referring page, time zone, language preference,
              pages viewed, and timestamps. This information is collected through cookies and similar
              technologies. See our{' '}
              <Link href="/cookie-policy" className="text-link">
                Cookie Policy
              </Link>{' '}
              for details and your choices.
            </p>

            <h3 className="text-subheading font-medium text-white mb-2 mt-6">2.3 Information from messaging platforms</h3>
            <p>
              When you contact us through WhatsApp, Instagram, or Facebook, the platform shares with us
              information you have made available to it for business messaging: typically your display name,
              profile picture, the phone number or account ID you are messaging from, message content, and
              delivery metadata. We use the WhatsApp Business Platform (operated by Meta Platforms Ireland
              Limited) to receive and reply to WhatsApp messages. Your messages are encrypted in transit by
              Meta and delivered to our self-hosted contact platform. See Section 4.
            </p>

            <h3 className="text-subheading font-medium text-white mb-2 mt-6">2.4 Information generated by your service visit</h3>
            <p>
              When we service your vehicle we record information about the work performed: date and time,
              vehicle details, technician notes, parts and labour, photographs and videos taken at intake or
              during the work, inspection findings, quotes, approvals, invoices, and payment records. This
              information is stored in our garage management system (AutoRepairCloud) and our accounting
              system (QuickBooks Online).
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">3. How we use your personal data</h2>
            <p>We use personal data for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>To respond to your enquiries, provide quotes, and book appointments</li>
              <li>To deliver, manage, document, and invoice the automotive services you request</li>
              <li>To keep a service history of your vehicle so future visits are faster and better informed</li>
              <li>To send you transactional updates about your job (status, ready-for-pickup, quotes for approval)</li>
              <li>To process payments and meet our financial-record-keeping obligations</li>
              <li>To improve our website, services, and customer experience</li>
              <li>To detect, prevent, and respond to fraud, abuse, or security incidents</li>
              <li>To comply with legal, tax, regulatory, and accounting obligations</li>
              <li>With your consent, to send you marketing communications you can withdraw at any time</li>
            </ul>
            <p className="mt-3">
              Under the PDPL and GDPR, our lawful bases for processing are: your consent (for marketing and
              non-essential cookies), the performance of a contract or pre-contract steps (to deliver the
              services you request), our legitimate interests (to operate, secure, and improve our business
              in a way that does not override your rights), and legal obligations (tax and record-keeping).
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">4. Who we share your data with</h2>
            <p>
              We do not sell or rent your personal data. We share it only with the service providers that
              help us run our business, and only to the extent each provider needs to do its job. Our key
              processors are:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>
                <strong>Meta Platforms Ireland Limited.</strong> WhatsApp Business Platform, Instagram, and
                Facebook Messenger, used to receive and reply to your messages on those channels.
              </li>
              <li>
                <strong>Self-hosted contact platform (Chatwoot).</strong> Runs on infrastructure controlled
                by us in our region of operation; consolidates messages from WhatsApp, Instagram, Facebook,
                email, and the website chat widget into one inbox so we can respond and keep an internal
                record of your conversation.
              </li>
              <li>
                <strong>AutoRepairCloud.</strong> Our garage management system, used to store customer,
                vehicle, repair-order, quote, and invoice records.
              </li>
              <li>
                <strong>Intuit (QuickBooks Online).</strong> Our accounting system, used for invoicing,
                payments, and statutory financial records.
              </li>
              <li>
                <strong>Google LLC / Google Ireland Limited.</strong> Google Workspace for our business
                email and document storage, and the Google Places and Maps APIs that power our reviews and
                location features.
              </li>
              <li>
                <strong>Vercel Inc.</strong> Hosts the public website and serverless API endpoints.
              </li>
              <li>
                <strong>Cloudflare Inc.</strong> Provides DNS, content delivery, and security for our
                domains.
              </li>
              <li>
                <strong>Email delivery providers.</strong> Used to send transactional and contact-form
                email.
              </li>
              <li>
                <strong>Professional advisers.</strong> Auditors, lawyers, and insurers, where required.
              </li>
              <li>
                <strong>Authorities.</strong> Where required by law, court order, or to protect our or
                your rights, property, or safety.
              </li>
            </ul>
            <p className="mt-3">
              Each of these providers acts as a processor or independent controller depending on the
              relationship; each is bound by appropriate contractual data-protection obligations.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">5. International data transfers</h2>
            <p>
              Some of our service providers (notably Meta, Google, Intuit, Vercel, and Cloudflare) operate
              globally and may process personal data outside the United Arab Emirates, including in the
              European Economic Area, the United Kingdom, the United States, and other jurisdictions. Where
              this happens we rely on the safeguards each provider offers under applicable law, including
              standard contractual clauses, adequacy decisions, and equivalent mechanisms recognised under
              the PDPL and GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">6. How long we keep your data</h2>
            <p>We keep personal data only as long as we need it for the purpose we collected it for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>
                <strong>Customer and vehicle records, repair orders, quotes, invoices:</strong> for the
                period required by UAE tax and commercial law (currently no less than five years from the end
                of the financial year), and longer where needed to support warranty claims or future service.
              </li>
              <li>
                <strong>Conversations on WhatsApp, email, social, and web chat:</strong> retained in our
                self-hosted inbox for as long as the customer relationship is active and for a reasonable
                period afterwards to support follow-up service and dispute resolution.
              </li>
              <li>
                <strong>Website analytics and cookie data:</strong> retained for the period set out in our
                Cookie Policy.
              </li>
              <li>
                <strong>Marketing data:</strong> retained until you withdraw consent or we determine the data
                is no longer relevant.
              </li>
            </ul>
            <p className="mt-3">
              When we no longer need your personal data we delete it or anonymise it.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">7. Your rights</h2>
            <p>
              Subject to the PDPL, GDPR, and other applicable law, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>
                <strong>Access</strong> the personal data we hold about you and obtain a copy
              </li>
              <li>
                <strong>Correct</strong> personal data that is inaccurate or incomplete
              </li>
              <li>
                <strong>Delete</strong> personal data where one of the legal grounds applies
              </li>
              <li>
                <strong>Restrict</strong> or <strong>object</strong> to certain processing
              </li>
              <li>
                <strong>Port</strong> the personal data you provided to another controller
              </li>
              <li>
                <strong>Withdraw consent</strong> at any time, without affecting the lawfulness of processing
                before withdrawal
              </li>
              <li>
                <strong>Lodge a complaint</strong> with the UAE Data Office or, if applicable, your local
                supervisory authority
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us using the details in Section 11. We will respond
              within the timeframe required by applicable law and may need to verify your identity before
              acting on your request.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">8. Children</h2>
            <p>
              Our services are intended for adults. We do not knowingly collect personal data from children
              under the age of 18. If you believe a child has provided us with personal data, please contact
              us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">9. Security</h2>
            <p>
              We use technical and organisational measures appropriate to the risk to protect your personal
              data, including TLS encryption in transit, access controls, audit logging, encrypted backups,
              and least-privilege access to our internal systems. No method of transmission over the
              internet or storage is completely secure; we cannot guarantee absolute security but we work
              continuously to maintain appropriate safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy to reflect changes in our practices, services, or legal
              obligations. When we do, we will revise the &quot;Last updated&quot; date at the top of this
              page. For material changes we will provide a more prominent notice (for example, by email or a
              banner on the website).
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">11. Contact us</h2>
            <p>
              For questions about this Privacy Policy, to exercise your rights, or to raise a privacy
              concern, contact us at:
            </p>
            <div className="mt-4 space-y-1">
              <p>
                <strong>MBR Making Better Rides</strong>
              </p>
              <p>16 8 St, Al Quoz Industrial Fourth, Al Quoz, Dubai, United Arab Emirates</p>
              <p>
                Email:{' '}
                <a href="mailto:info@mbrme.com" className="text-link">
                  info@mbrme.com
                </a>
              </p>
              <p>
                Phone:{' '}
                <a href="tel:+971565015800" className="text-link">
                  +971 56 501 5800
                </a>
              </p>
            </div>
            <p className="mt-4">
              See also our{' '}
              <Link href="/cookie-policy" className="text-link">
                Cookie Policy
              </Link>{' '}
              and{' '}
              <Link href="/integrations-terms" className="text-link">
                Integrations Terms
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
