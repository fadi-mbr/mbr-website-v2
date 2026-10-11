import { trackEvent } from './analytics';
export function triggerChat(source: string, message = 'Hello MBR, I need automotive service'): void {
  if (typeof window === 'undefined') return;
  trackEvent('chat_trigger', { location: source, chat_mode: 'whatsapp' });
  window.open(`https://wa.me/971565015800?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}
