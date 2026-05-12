/**
 * Chat CTA helpers.
 *
 * Two surfaces, two intents:
 *
 *   - `triggerChat(source)`  — generic "chat with us" CTA used by the
 *     hero, service cards, footer. Picks the right channel for the
 *     device: desktop opens Chatwoot, mobile deep-links WhatsApp.
 *
 *   - `openLiveChat(source)` — used ONLY by the "Live Chat" card in the
 *     contact section. The visitor explicitly asked for the web chat
 *     widget, so we wait for Chatwoot to finish loading rather than
 *     silently routing to WhatsApp. If the widget genuinely never
 *     comes up (ad-block, SDK error), a tiny status callback fires so
 *     the caller can show feedback.
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
 * Generic chat trigger. Picks the right channel for the device.
 *
 * `hasLoaded` was previously required; that meant a fresh page load
 * routed users to WhatsApp because Chatwoot hadn't finished setting
 * up. The SDK queues calls internally — `toggle` is safe to invoke
 * before `hasLoaded` is true, so we only check that `toggle` exists.
 */
export function triggerChat(source: string, message?: string): void {
  if (typeof window === 'undefined') return;

  if (isMobileViewport()) {
    trackChatTrigger(source, 'whatsapp');
    window.location.href = buildWhatsAppUrl(message);
    return;
  }

  const cw = window.$chatwoot;
  if (cw?.toggle) {
    trackChatTrigger(source, 'chatwoot');
    cw.toggle('open');
    return;
  }

  // SDK genuinely not present (likely ad-block). New-tab WhatsApp so
  // the user keeps the current page open.
  trackChatTrigger(source, 'whatsapp');
  window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
}

/**
 * Open the Chatwoot widget specifically, regardless of device or load
 * state. Used by the dedicated "Live Chat" card in the contact section
 * where the visitor explicitly asked for the web chat widget.
 *
 * Polls for the SDK for up to ~3 seconds (12 × 250ms). If it never
 * appears, invokes `onUnavailable` so the caller can show feedback.
 */
export function openLiveChat(
  source: string,
  onUnavailable?: () => void,
): void {
  if (typeof window === 'undefined') return;

  const tryOpen = () => {
    const cw = window.$chatwoot;
    if (cw?.toggle) {
      trackChatTrigger(source, 'chatwoot');
      cw.toggle('open');
      return true;
    }
    return false;
  };

  if (tryOpen()) return;

  // Widget not ready yet — poll briefly. Chatwoot script is loaded with
  // `defer async` so on a cold cache it can take a beat.
  let attempts = 0;
  const interval = window.setInterval(() => {
    attempts += 1;
    if (tryOpen()) {
      window.clearInterval(interval);
      return;
    }
    if (attempts >= 12) {
      window.clearInterval(interval);
      onUnavailable?.();
    }
  }, 250);
}
