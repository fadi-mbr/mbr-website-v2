"use client";

import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { hasAnalyticsConsent } from '@/lib/cookie-consent';

/**
 * Conditionally loads Google Analytics only if user has given consent
 */
export default function ConditionalGoogleAnalytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check consent status
    const consent = hasAnalyticsConsent();
    setHasConsent(consent);

    // Listen for consent changes
    const handleConsentUpdate = () => {
      setHasConsent(hasAnalyticsConsent());
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
    };
  }, []);

  // Only render Google Analytics if consent is given
  if (!hasConsent) {
    return null;
  }

  return <GoogleAnalytics gaId="G-C3F0YSMRPM" />;
}

