/**
 * GDPR Cookie Consent Management
 * 
 * This utility manages cookie consent in compliance with GDPR regulations.
 * It stores user preferences and controls which cookies/scripts are loaded.
 */

export type CookieConsent = {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean; // Google Analytics
  marketing: boolean; // Future marketing cookies
  preferences: boolean; // User preferences
};

export type ConsentStatus = 'pending' | 'accepted' | 'rejected' | 'custom';

const COOKIE_CONSENT_KEY = 'mbr_cookie_consent';
const COOKIE_CONSENT_VERSION = '1.0';
const CONSENT_EXPIRY_DAYS = 365; // Consent expires after 1 year

export interface StoredConsent {
  consent: CookieConsent;
  status: ConsentStatus;
  timestamp: number;
  version: string;
}

/**
 * Get stored cookie consent from localStorage
 */
export function getStoredConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;

    const consent: StoredConsent = JSON.parse(stored);
    
    // Check if consent is expired (older than CONSENT_EXPIRY_DAYS)
    const daysSinceConsent = (Date.now() - consent.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceConsent > CONSENT_EXPIRY_DAYS) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }

    // Check version compatibility
    if (consent.version !== COOKIE_CONSENT_VERSION) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }

    return consent;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
}

/**
 * Save cookie consent to localStorage
 */
export function saveConsent(consent: CookieConsent, status: ConsentStatus): void {
  if (typeof window === 'undefined') return;

  try {
    const storedConsent: StoredConsent = {
      consent: {
        ...consent,
        necessary: true, // Always true
      },
      status,
      timestamp: Date.now(),
      version: COOKIE_CONSENT_VERSION,
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(storedConsent));
    
    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: storedConsent }));
  } catch (error) {
    console.error('Error saving cookie consent:', error);
  }
}

/**
 * Check if user has given consent
 */
export function hasConsent(): boolean {
  const stored = getStoredConsent();
  return stored !== null && stored.status !== 'pending';
}

/**
 * Check if analytics consent is given
 */
export function hasAnalyticsConsent(): boolean {
  const stored = getStoredConsent();
  return stored !== null && stored.consent.analytics === true;
}

/**
 * Get current consent status
 */
export function getConsentStatus(): ConsentStatus {
  const stored = getStoredConsent();
  return stored?.status || 'pending';
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): void {
  saveConsent(
    {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    },
    'accepted'
  );
}

/**
 * Reject all optional cookies
 */
export function rejectAllCookies(): void {
  saveConsent(
    {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    },
    'rejected'
  );
}

/**
 * Save custom cookie preferences
 */
export function saveCustomConsent(consent: Partial<CookieConsent>): void {
  const stored = getStoredConsent();
  const currentConsent = stored?.consent || {
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  };

  saveConsent(
    {
      ...currentConsent,
      ...consent,
      necessary: true, // Always true
    },
    'custom'
  );
}

/**
 * Clear all consent data
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: null }));
}

