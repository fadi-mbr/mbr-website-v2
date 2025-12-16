import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | MBR Auto Services',
  description: 'Privacy Policy for MBR Making Better Rides - Premium Car Repair Dubai, UAE',
  robots: 'index, follow',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="container-luxury max-w-4xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-red-400 hover:text-red-300 mb-8 transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="text-display font-light mb-8">Privacy Policy</h1>
        
        <div className="glass-card-premium p-8 space-y-6 text-body-enhanced leading-relaxed">
          <p className="text-subheading text-white mb-4">
            <strong>Last Updated:</strong> December 2024
          </p>

          <section>
            <h2 className="text-heading font-light text-white mb-4">1. Introduction</h2>
            <p>
              MBR Making Better Rides ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you visit our website mbrme.com.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">2. Information We Collect</h2>
            <h3 className="text-subheading font-medium text-white mb-2">2.1 Information You Provide</h3>
            <p>
              We may collect information that you voluntarily provide to us when you:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Contact us through our website forms</li>
              <li>Request a quote or service</li>
              <li>Subscribe to our newsletter</li>
              <li>Communicate with us via WhatsApp or phone</li>
            </ul>

            <h3 className="text-subheading font-medium text-white mb-2 mt-4">2.2 Automatically Collected Information</h3>
            <p>
              When you visit our website, we may automatically collect certain information about your device, 
              including information about your web browser, IP address, time zone, and some of the cookies that 
              are installed on your device.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Respond to your inquiries and requests</li>
              <li>Send you service-related communications</li>
              <li>Analyze website usage and trends (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">4. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our website and store certain 
              information. You can control cookies through your browser settings and our cookie consent banner. 
              For more information, please see our <Link href="/cookie-policy" className="text-red-400 hover:text-red-300 underline">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">5. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information 
              only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>With service providers who assist us in operating our website</li>
              <li>When required by law or to protect our rights</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">6. Your Rights (GDPR)</h2>
            <p>If you are located in the European Economic Area (EEA), you have certain data protection rights:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Right to Access:</strong> You can request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> You can request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> You can request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> You can request restriction of data processing</li>
              <li><strong>Right to Data Portability:</strong> You can request transfer of your data</li>
              <li><strong>Right to Object:</strong> You can object to our processing of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">7. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information. 
              However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p><strong>MBR Making Better Rides</strong></p>
              <p>Al Quoz, Dubai, UAE</p>
              <p>Phone: <a href="tel:+971565015800" className="text-red-400 hover:text-red-300">+971 56 501 5800</a></p>
              <p>Email: <a href="mailto:info@mbrme.com" className="text-red-400 hover:text-red-300">info@mbrme.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

