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
  /**
   * The Chatwoot contact ID this booking is associated with. Used to
   * fetch the contact server-side via `/api/booking/embed-context` and
   * prefill Details when the wizard runs inside the Chatwoot Dashboard
   * App iframe. Not surfaced to the customer.
   */
  contactId?: number;
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

/* ---------------- contact_id → server-side prefill ---------------- */

/**
 * Extract a positive integer `contact_id` query param. Returns null on
 * absent / malformed / out-of-range input. Bounded to MAX_SAFE_INTEGER so
 * the value can safely round-trip through JSON.
 *
 * The Chatwoot Dashboard App appends `contact_id` to the iframe URL when
 * the advisor opens the booking app from inside a conversation. We use it
 * to look up the contact server-side via `/api/booking/embed-context`.
 */
export function readContactIdFromUrl(
  search?: URLSearchParams | string
): number | null {
  const sp = resolveSearch(search);
  if (!sp) return null;
  const raw = sp.get('contact_id');
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

/**
 * Fetch the embed-mode contact prefill from our own server. Silently
 * returns `{}` on any failure — the wizard always remains usable, even
 * without prefill (the advisor can type the customer's details manually).
 *
 * The response shape from `/api/booking/embed-context`:
 *   { ok: true,  contact: { name?, email?, phone? } | null }
 *   { ok: false, reason?: string }
 *
 * Either of those — plus network errors, JSON parse failures, etc — all
 * resolve to `{}` here. By design.
 */
export async function fetchContactPrefill(
  contactId: number
): Promise<Partial<EmbedContext>> {
  if (typeof window === 'undefined') return {};
  if (!Number.isSafeInteger(contactId) || contactId <= 0) return {};
  try {
    const r = await fetch('/api/booking/embed-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: contactId }),
      // No credentials needed — same-origin and the route has its own
      // server-side auth to Chatwoot.
      cache: 'no-store',
    });
    if (!r.ok) return {};
    const body: unknown = await r.json();
    if (!body || typeof body !== 'object') return {};
    const obj = body as { ok?: unknown; contact?: unknown };
    if (obj.ok !== true) return {};
    if (!obj.contact || typeof obj.contact !== 'object') return {};
    const c = obj.contact as { name?: unknown; email?: unknown; phone?: unknown };
    const out: Partial<EmbedContext> = {};
    if (typeof c.name === 'string' && c.name.trim()) out.name = c.name.trim().slice(0, 80);
    if (typeof c.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) {
      out.email = c.email.trim();
    }
    if (typeof c.phone === 'string') {
      const cleaned = c.phone.trim().replace(/^\+/, '');
      if (/^\d{6,15}$/.test(cleaned)) out.phone = cleaned;
    }
    return out;
  } catch {
    return {};
  }
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
