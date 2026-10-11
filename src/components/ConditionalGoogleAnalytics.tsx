'use client';

import { useSyncExternalStore } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { hasAnalyticsConsent } from '@/lib/cookie-consent';

function subscribe(onChange: () => void) {
  window.addEventListener('cookieConsentUpdated', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('cookieConsentUpdated', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export default function ConditionalGoogleAnalytics() {
  const hasConsent = useSyncExternalStore(subscribe, hasAnalyticsConsent, () => false);
  return hasConsent ? <GoogleAnalytics gaId="G-C3F0YSMRPM" /> : null;
}
