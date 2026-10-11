/**
 * Google Analytics 4 Event Tracking Utility
 * 
 * This utility provides a centralized way to track user interactions
 * across the website using Google Analytics 4 (GA4).
 * 
 * GDPR Compliant: Only tracks events if user has given analytics consent.
 * 
 * Best Practices:
 * - Use lowercase with underscores for event names
 * - Include relevant parameters for better insights
 * - Track meaningful user interactions
 * - Avoid over-tracking to prevent data overload
 */

import { hasAnalyticsConsent } from './cookie-consent';

// Check if gtag is available (Google Analytics loaded)
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set' | 'js',
      targetId: string | Date,
      config?: Record<string, string | number | boolean>
    ) => void;
  }
}

/**
 * Track a custom event in Google Analytics 4
 * 
 * GDPR Compliant: Only tracks if user has given analytics consent.
 * 
 * @param eventName - Event name (lowercase with underscores, e.g., 'whatsapp_click')
 * @param parameters - Event parameters (optional)
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
): void {
  // Check GDPR consent first
  if (typeof window !== 'undefined' && !hasAnalyticsConsent()) {
    // User has not consented to analytics, don't track
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 GA4 Event blocked (no consent):', eventName);
    }
    return;
  }

  // Only track if gtag is available and we're not in development mode
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', eventName, {
        ...parameters,
        // Add timestamp for debugging
        event_timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Silently fail in production, but log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('GA4 tracking error:', error);
      }
    }
  } else if (process.env.NODE_ENV === 'development') {
    // Log events in development mode for debugging
    console.log('📊 GA4 Event:', eventName, parameters);
  }
}

/**
 * Track WhatsApp button clicks
 * 
 * @param location - Where the button was clicked (e.g., 'floating_button', 'navigation', 'hero')
 * @param buttonText - Text on the button (optional)
 * @param serviceName - Service name if clicked from a service card (optional)
 */
export function trackWhatsAppClick(
  location: string,
  buttonText?: string,
  serviceName?: string
): void {
  trackEvent('whatsapp_click', {
    location,
    button_text: buttonText || '',
    service_name: serviceName || '',
    interaction_type: 'whatsapp',
  });
}

/**
 * Track phone call clicks
 * 
 * @param location - Where the phone link was clicked
 * @param phoneNumber - Phone number that was clicked
 */
export function trackPhoneCall(
  location: string,
  phoneNumber: string
): void {
  trackEvent('phone_call', {
    location,
    phone_number: phoneNumber,
    interaction_type: 'phone',
  });
}

/**
 * Track email/mailto clicks
 *
 * @param location - Where the email link was clicked
 * @param emailAddress - Email address that was clicked
 */
export function trackEmailClick(
  location: string,
  emailAddress: string
): void {
  trackEvent('email_click', {
    location,
    email_address: emailAddress,
    interaction_type: 'email',
  });
}

/**
 * Track map/location clicks
 * 
 * @param location - Where the map link was clicked
 * @param mapType - Type of map interaction (e.g., 'google_maps', 'embed')
 */
export function trackMapClick(
  location: string,
  mapType: string = 'google_maps'
): void {
  trackEvent('map_click', {
    location,
    map_type: mapType,
    interaction_type: 'location',
  });
}

/**
 * Track social media link clicks
 * 
 * @param platform - Social media platform (e.g., 'instagram', 'facebook')
 * @param location - Where the link was clicked
 */
export function trackSocialMediaClick(
  platform: string,
  location: string
): void {
  trackEvent('social_media_click', {
    platform,
    location,
    interaction_type: 'social',
  });
}

/**
 * Track service card clicks
 * 
 * @param serviceName - Name of the service
 * @param serviceId - ID of the service (optional)
 * @param action - Action taken (e.g., 'whatsapp', 'view_details')
 */
export function trackServiceClick(
  serviceName: string,
  serviceId?: string,
  action: string = 'view'
): void {
  trackEvent('service_click', {
    service_name: serviceName,
    service_id: serviceId || '',
    action,
    interaction_type: 'service',
  });
}

/**
 * Track navigation clicks
 * 
 * @param section - Section navigated to
 * @param navigationType - Type of navigation (e.g., 'desktop', 'mobile', 'footer')
 */
export function trackNavigation(
  section: string,
  navigationType: string = 'desktop'
): void {
  trackEvent('navigation_click', {
    section,
    navigation_type: navigationType,
    interaction_type: 'navigation',
  });
}

/**
 * Track CTA button clicks
 * 
 * @param ctaText - Text on the CTA button
 * @param location - Where the CTA was clicked
 * @param destination - Where the CTA leads to
 */
export function trackCTA(
  ctaText: string,
  location: string,
  destination?: string
): void {
  trackEvent('cta_click', {
    cta_text: ctaText,
    location,
    destination: destination || '',
    interaction_type: 'cta',
  });
}

/**
 * Track page view (if needed for custom tracking)
 * 
 * @param pageName - Name of the page
 * @param pagePath - Path of the page
 */
export function trackPageView(
  pageName: string,
  pagePath: string
): void {
  trackEvent('page_view', {
    page_name: pageName,
    page_path: pagePath,
  });
}

/**
 * Track scroll depth (for engagement metrics)
 * 
 * @param depth - Scroll depth percentage (25, 50, 75, 100)
 */
export function trackScrollDepth(depth: number): void {
  trackEvent('scroll_depth', {
    depth: depth.toString(),
    interaction_type: 'engagement',
  });
}

/**
 * Track time on page (for engagement metrics)
 * 
 * @param timeInSeconds - Time spent on page in seconds
 */
export function trackTimeOnPage(timeInSeconds: number): void {
  trackEvent('time_on_page', {
    time_seconds: timeInSeconds,
    interaction_type: 'engagement',
  });
}

