import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | MBR Auto Services',
  description: 'Cookie Policy for MBR Making Better Rides - Premium Car Repair Dubai, UAE',
  robots: 'index, follow',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="container-luxury max-w-4xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-link mb-8 transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="text-display font-light mb-8">Cookie Policy</h1>
        
        <div className="glass-card-premium p-8 space-y-6 text-body-enhanced leading-relaxed">
          <p className="text-subheading text-white mb-4">
            <strong>Last Updated:</strong> December 2024
          </p>

          <section>
            <h2 className="text-heading font-light text-white mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit a website. They are widely 
              used to make websites work more efficiently and provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">2. How We Use Cookies</h2>
            <p>
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
              We only use cookies with your explicit consent, except for necessary cookies that are required for 
              the website to function.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">3. Types of Cookies We Use</h2>
            
            <div className="space-y-4">
              <div className="glass-card-subtle p-4">
                <h3 className="text-subheading font-medium text-white mb-2">3.1 Necessary Cookies</h3>
                <p>
                  These cookies are essential for the website to function properly. They enable basic functions 
                  like page navigation and access to secure areas. These cookies cannot be disabled.
                </p>
                <p className="text-sm text-muted-enhanced mt-2">
                  <strong>Examples:</strong> Session management, security, load balancing
                </p>
              </div>

              <div className="glass-card-subtle p-4">
                <h3 className="text-subheading font-medium text-white mb-2">3.2 Analytics Cookies</h3>
                <p>
                  These cookies help us understand how visitors interact with our website by collecting and reporting 
                  information anonymously. We use Google Analytics for this purpose.
                </p>
                <p className="text-sm text-muted-enhanced mt-2">
                  <strong>Provider:</strong> Google Analytics<br />
                  <strong>Purpose:</strong> Website analytics and performance monitoring<br />
                  <strong>Duration:</strong> Up to 2 years
                </p>
                <p className="text-sm text-muted-enhanced mt-2">
                  <strong>Opt-out:</strong> You can opt-out of Google Analytics by disabling analytics cookies 
                  in our cookie consent banner or by installing the{' '}
                  <a 
                    href="https://tools.google.com/dlpage/gaoptout" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-link"
                  >
                    Google Analytics Opt-out Browser Add-on
                  </a>
                </p>
              </div>

              <div className="glass-card-subtle p-4">
                <h3 className="text-subheading font-medium text-white mb-2">3.3 Marketing Cookies</h3>
                <p>
                  These cookies are used to deliver personalized advertisements and track campaign performance. 
                  Currently, we do not use marketing cookies, but this category is available for future use.
                </p>
              </div>

              <div className="glass-card-subtle p-4">
                <h3 className="text-subheading font-medium text-white mb-2">3.4 Preferences Cookies</h3>
                <p>
                  These cookies remember your settings and preferences (such as language or region) to provide 
                  a better, more personalized experience.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">4. Managing Your Cookie Preferences</h2>
            <p>
              You can manage your cookie preferences at any time through:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Our cookie consent banner (appears on first visit)</li>
              <li>Your browser settings (to block or delete cookies)</li>
              <li>Contacting us directly to update your preferences</li>
            </ul>
            <p className="mt-4">
              <strong>Note:</strong> Disabling certain cookies may affect website functionality and your user experience.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">5. Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services that appear on our pages. We use the following 
              third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Google Analytics:</strong> Website analytics (requires consent)</li>
              <li><strong>Google Maps:</strong> Location services (if used)</li>
            </ul>
            <p className="mt-4">
              These third parties may use cookies to collect information about your online activities across 
              different websites. We do not control these third-party cookies.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">6. Cookie Duration</h2>
            <p>Cookies can be either:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Cookies that remain on your device for a set period or until you delete them</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">7. Your Rights</h2>
            <p>
              Under GDPR and other privacy laws, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Be informed about cookie usage</li>
              <li>Give or withdraw consent for non-essential cookies</li>
              <li>Access information about cookies we use</li>
              <li>Request deletion of cookie data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">8. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for 
              legal, operational, or regulatory reasons. We will notify you of any material changes.
            </p>
          </section>

          <section>
            <h2 className="text-heading font-light text-white mb-4">9. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p><strong>MBR Making Better Rides</strong></p>
              <p>16 8 St Al Qouz Ind.fourth - Al Quoz - Dubai</p>
              <p>Phone: <a href="tel:+971565015800" className="text-link">+971 56 501 5800</a></p>
              <p>Email: <a href="mailto:info@mbrme.com" className="text-link">info@mbrme.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

