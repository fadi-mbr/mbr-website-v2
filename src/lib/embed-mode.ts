/**
 * Booking wizard "embed mode" helpers.
 *
 * Embed mode is what the wizard switches into when it is rendered inside a
 * Chatwoot Dashboard App iframe (registered at connect.mbrme.com). In that
 * mode we:
 *
 *  1. Hide the page chrome (eyebrow / headline / WA fallback / footnote)
 *     so the parent iframe controls visual framing.
 *  2. Accept context from two sources, in priority order:
 *       (a) URL query params:   ?phone=971501234567&name=Faisal&channel=whatsapp
 *       (b) postMessage from parent: { type:'chatwoot:context', contact:{phone,name,email}, conversation_id }
 *  3. Notify the parent once the booking is completed via:
 *       window.parent.postMessage({ type:'mbr:booking-completed', ... })
 *
 * Why URL params instead of a signed magic-link token?
 * --------------------------------------------------
 * v1 keeps things simple. A customer-controlled phone in the URL is not
 * sensitive — server-side validation still enforces UAE-format phone, the
 * one-booking-per-phone rate limit still applies, and the worst a tamperer
 * could do is fill out a booking on someone else's behalf (which costs them
 * nothing and the customer gets a confirmation). If we later need
 * tamper-evidence we can move to an HMAC-signed token without changing the
 * URL shape — `phone` and `name` can stay; we just additionally require a
 * matching `sig` param when the secret is configured.
 */

/* ---------------- types ---------------- */

export interface EmbedContext {
  /** Pre-fill the Details step's phone field, UAE digits OK. */
  phone?: string;
  /** Pre-fill the Details step's first name. */
  name?: string;
  /** Pre-fill the Details step's email if Chatwoot has one on file. */
  email?: string;
  /**
   * The Chatwoot conversation ID this booking is associated with. When set,
   * a successful booking will trigger /api/booking/notify-chatwoot so the
   * confirmation lands back in the thread.
   */
  conversationId?: number;
  /** Where the customer originally reached out — purely informational. */
  channel?: string;
}

export interface BookingCompletedPayload {
  appointmentId?: number;
  serviceName: string;
  confirmAt: string;
  durationH: number;
  customerFirstName: string;
  conversationId?: number;
}

/* ---------------- detection ---------------- */

/**
 * Returns true if the current page should render in embed mode.
 *
 * Cheap, synchronous, safe to call during render. Returns false during SSR.
 */
export function isEmbedMode(search?: URLSearchParams | string): boolean {
  const sp = resolveSearch(search);
  if (!sp) return false;
  const v = sp.get('embed');
  return v === '1' || v === 'true';
}

/* ---------------- URL param prefill ---------------- */

/**
 * Read pre-fill context from the URL. Used by the magic-link entry point —
 * an after-hours Chatwoot auto-reply can include a link of the form:
 *
 *   https://mbrme.com/book?phone={{contact.phone_number}}&name={{contact.name}}&conversation_id={{conversation.id}}
 *
 * Bad / missing values are silently ignored — the wizard still renders.
 */
export function readContextFromUrl(search?: URLSearchParams | string): EmbedContext {
  const sp = resolveSearch(search);
  if (!sp) return {};
  const out: EmbedContext = {};
  const phone = sp.get('phone');
  if (phone) {
    // Don't normalise here — the wizard's existing phone-mask logic does
    // that on the input field. Just trim obvious whitespace and a leading +.
    const cleaned = phone.trim().replace(/^\+/, '');
    if (/^\d{6,15}$/.test(cleaned)) out.phone = cleaned;
  }
  const name = sp.get('name');
  if (name) {
    const trimmed = name.trim().slice(0, 80);
    if (trimmed.length > 0) out.name = trimmed;
  }
  const email = sp.get('email');
  if (email) {
    const trimmed = email.trim();
    if (trimmed.length > 0 && trimmed.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      out.email = trimmed;
    }
  }
  const convId = sp.get('conversation_id');
  if (convId && /^\d+$/.test(convId)) {
    const n = Number(convId);
    if (Number.isSafeInteger(n) && n > 0) out.conversationId = n;
  }
  const channel = sp.get('channel');
  if (channel) {
    const trimmed = channel.trim().slice(0, 40);
    if (trimmed.length > 0) out.channel = trimmed;
  }
  return out;
}

/* ---------------- postMessage bridge ---------------- */

interface ChatwootContextMessage {
  type: 'chatwoot:context';
  contact?: { phone?: string; name?: string; email?: string };
  conversation_id?: number;
  channel?: string;
}

/**
 * Subscribe to `chatwoot:context` postMessage events from the parent frame.
 * Chatwoot's Dashboard App documentation describes posting this shape via
 * `chatwootSDK.run` / dashboard-app SDK on mount. We accept whichever
 * fields are present and ignore the rest.
 *
 * Returns an unsubscribe function. Pass to `useEffect` cleanup.
 */
export function setupChatwootListener(
  onContext: (ctx: EmbedContext) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (ev: MessageEvent) => {
    const data = ev.data;
    if (!data || typeof data !== 'object') return;
    const msg = data as Partial<ChatwootContextMessage>;
    if (msg.type !== 'chatwoot:context') return;
    const ctx: EmbedContext = {};
    if (msg.contact && typeof msg.contact === 'object') {
      const c = msg.contact;
      if (typeof c.phone === 'string') {
        const cleaned = c.phone.trim().replace(/^\+/, '');
        if (/^\d{6,15}$/.test(cleaned)) ctx.phone = cleaned;
      }
      if (typeof c.name === 'string') {
        const trimmed = c.name.trim().slice(0, 80);
        if (trimmed.length > 0) ctx.name = trimmed;
      }
      if (typeof c.email === 'string') {
        const trimmed = c.email.trim();
        if (trimmed.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          ctx.email = trimmed;
        }
      }
    }
    if (typeof msg.conversation_id === 'number' && Number.isSafeInteger(msg.conversation_id) && msg.conversation_id > 0) {
      ctx.conversationId = msg.conversation_id;
    }
    if (typeof msg.channel === 'string') {
      const trimmed = msg.channel.trim().slice(0, 40);
      if (trimmed.length > 0) ctx.channel = trimmed;
    }
    onContext(ctx);
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

/**
 * Notify the parent (Chatwoot Dashboard App) that a booking completed,
 * so it can refresh the conversation view, close the iframe, etc.
 * No-op when not inside an iframe.
 */
export function notifyParentBooked(payload: BookingCompletedPayload): void {
  if (typeof window === 'undefined') return;
  if (window.parent === window) return; // not in an iframe
  try {
    window.parent.postMessage({ type: 'mbr:booking-completed', ...payload }, '*');
  } catch {
    // Cross-origin postMessage can throw in exotic browsers — ignore.
  }
}

/* ---------------- internals ---------------- */

function resolveSearch(input?: URLSearchParams | string): URLSearchParams | null {
  if (input instanceof URLSearchParams) return input;
  if (typeof input === 'string') return new URLSearchParams(input);
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search);
}
