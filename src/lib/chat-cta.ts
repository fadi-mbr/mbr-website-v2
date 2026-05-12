/**
 * Chat CTA — device-detected.
 *
 * Single source of truth for every "Chat with us" button on the site:
 *   - Desktop → opens the Chatwoot widget (FloatingChatwootButton mounts the
 *     SDK at app level; the widget is `hidden md:flex` so it's only available
 *     above the md breakpoint anyway).
 *   - Mobile  → deep-links to WhatsApp. The widget is hidden on small screens
 *     and most mobile visitors already have WhatsApp installed.
 *
 * Gracefully falls back to WhatsApp if Chatwoot hasn't finished loading.
 */

import { trackEvent } from './analytics';

const WHATSAPP_NUMBER = '+971565015800';
const WHATSAPP_DEFAULT_MESSAGE =
  'Hello MBR, I need automotive service';

function buildWhatsAppUrl(message = WHATSAPP_DEFAULT_MESSAGE): string {
  const text = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${text}`;
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  // Match against the same breakpoint where FloatingChatwootButton hides
  // (Tailwind md = 768px). Use matchMedia for accuracy + responsiveness to
  // orientation changes.
  return window.matchMedia('(max-width: 767px)').matches;
}

export function trackChatTrigger(source: string, mode: 'chatwoot' | 'whatsapp'): void {
  trackEvent('chat_trigger', {
    location: source,
    chat_mode: mode,
    interaction_type: 'chat',
  });
}

/**
 * Open the chat surface from any CTA on the site.
 *
 * @param source - Where the CTA was clicked (e.g. 'hero_primary',
 *                 'contact_cta', 'service_card_mechanical'). Used for
 *                 analytics breakdown.
 * @param message - Optional WhatsApp pre-fill. Defaults to a generic
 *                  service-inquiry line.
 */
export function triggerChat(source: string, message?: string): void {
  if (typeof window === 'undefined') return;

  // Mobile → WhatsApp deep link
  if (isMobileViewport()) {
    trackChatTrigger(source, 'whatsapp');
    window.location.href = buildWhatsAppUrl(message);
    return;
  }

  // Desktop → Chatwoot, with fall-through to WhatsApp if the widget hasn't
  // loaded (slow connection, ad-block, etc.).
  const cw = window.$chatwoot;
  if (cw?.toggle && cw.hasLoaded) {
    trackChatTrigger(source, 'chatwoot');
    cw.toggle('open');
    return;
  }

  // Fallback — open WhatsApp in a new tab so the user doesn't lose the page.
  trackChatTrigger(source, 'whatsapp');
  window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
}
