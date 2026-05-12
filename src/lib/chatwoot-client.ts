/**
 * Thin server-side Chatwoot v1 API client.
 *
 * Only the verbs the booking flow needs:
 *   - send a public message into a conversation
 *   - set conversation-level custom attributes
 *
 * Auth: a Chatwoot user access token, stored on Vercel as the env var
 * `CHATWOOT_ADMIN_API_TOKEN` (mirror of MBR Infisical /mbr/chatwoot/CHATWOOT_ADMIN_API_TOKEN).
 *
 * Defaults:
 *   CHATWOOT_BASE_URL   → https://connect.mbrme.com
 *   CHATWOOT_ACCOUNT_ID → 1 (typical for single-account self-hosted Chatwoot)
 *
 * Everything here NEVER throws on Chatwoot errors. Callers get back a
 * discriminated-union result so the booking itself can succeed even if the
 * notification fails — the message we couldn't post is annoying but not
 * catastrophic. (Chatwoot agents will still see the booking on the next refresh
 * because the custom-attribute PATCH usually succeeds even when message send
 * fails, and we log the failure.)
 */

const DEFAULT_BASE = 'https://connect.mbrme.com';
const DEFAULT_ACCOUNT_ID = '1';
const FETCH_TIMEOUT_MS = 8_000;

export interface ChatwootConfig {
  baseUrl: string;
  accountId: string;
  token: string;
}

/**
 * Read config from env. Returns null when the token isn't configured —
 * callers can treat this as "Chatwoot integration disabled".
 */
export function loadChatwootConfig(env: NodeJS.ProcessEnv = process.env): ChatwootConfig | null {
  const token = env.CHATWOOT_ADMIN_API_TOKEN;
  if (!token) return null;
  return {
    baseUrl: (env.CHATWOOT_BASE_URL || DEFAULT_BASE).replace(/\/+$/, ''),
    accountId: env.CHATWOOT_ACCOUNT_ID || DEFAULT_ACCOUNT_ID,
    token,
  };
}

/** Build a URL for a conversation-scoped endpoint. Exposed for unit tests. */
export function buildConversationUrl(
  cfg: Pick<ChatwootConfig, 'baseUrl' | 'accountId'>,
  conversationId: number,
  suffix = ''
): string {
  const base = cfg.baseUrl.replace(/\/+$/, '');
  const tail = suffix ? `/${suffix.replace(/^\/+/, '')}` : '';
  return `${base}/api/v1/accounts/${cfg.accountId}/conversations/${conversationId}${tail}`;
}

/** Build a URL for a contact-scoped endpoint. Exposed for unit tests. */
export function buildContactUrl(
  cfg: Pick<ChatwootConfig, 'baseUrl' | 'accountId'>,
  contactId: number
): string {
  const base = cfg.baseUrl.replace(/\/+$/, '');
  return `${base}/api/v1/accounts/${cfg.accountId}/contacts/${contactId}`;
}

export type ChatwootResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; reason: string };

async function chatwootFetch<T>(
  cfg: ChatwootConfig,
  url: string,
  init: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<ChatwootResult<T>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        ...init.headers,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        api_access_token: cfg.token,
      },
    });
    const bodyText = await r.text();
    if (!r.ok) {
      return {
        ok: false,
        status: r.status,
        reason: `chatwoot ${r.status}: ${bodyText.slice(0, 200)}`,
      };
    }
    let parsed: T | undefined;
    try {
      parsed = bodyText ? (JSON.parse(bodyText) as T) : (undefined as T);
    } catch {
      // Chatwoot sometimes returns empty 200 bodies — that's fine for our PATCHes.
      parsed = undefined as T;
    }
    return { ok: true, data: parsed as T };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      reason: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------- API surface ---------------- */

export interface SendMessageInput {
  conversationId: number;
  content: string;
  /** outgoing = visible to customer. Use "private" notes for agent-only. */
  messageType?: 'outgoing' | 'incoming' | 'template';
  isPrivate?: boolean;
}

export async function sendConversationMessage(
  cfg: ChatwootConfig,
  input: SendMessageInput
): Promise<ChatwootResult<{ id?: number }>> {
  const url = buildConversationUrl(cfg, input.conversationId, 'messages');
  return chatwootFetch<{ id?: number }>(cfg, url, {
    method: 'POST',
    body: JSON.stringify({
      content: input.content,
      message_type: input.messageType ?? 'outgoing',
      private: input.isPrivate ?? false,
    }),
  });
}

/**
 * Minimal shape of a Chatwoot contact we care about for booking prefill.
 *
 * Chatwoot's `GET /api/v1/accounts/:id/contacts/:id` returns a much larger
 * envelope (`{ payload: { ... } }` on some versions, the contact directly on
 * others). We tolerate both shapes in `fetchContact` and surface only the
 * three fields the Details step needs.
 */
export interface ChatwootContact {
  id: number;
  name?: string;
  email?: string;
  phone_number?: string;
}

/**
 * Fetch a contact by ID. Server-side only — the `api_access_token` admin
 * token must never reach the browser. Used by the embed-context route to
 * prefill the booking wizard when an advisor opens it from a Chatwoot
 * conversation.
 *
 * Tolerates the two response envelopes Chatwoot ships across versions:
 *   v3: `{ id, name, email, phone_number, ... }`
 *   v4: `{ payload: { id, name, email, phone_number, ... } }`
 */
export async function fetchContact(
  cfg: ChatwootConfig,
  contactId: number,
  timeoutMs?: number
): Promise<ChatwootResult<ChatwootContact>> {
  const url = buildContactUrl(cfg, contactId);
  const res = await chatwootFetch<unknown>(cfg, url, { method: 'GET' }, timeoutMs);
  if (!res.ok) return res;
  const raw = res.data as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== 'object') {
    return { ok: false, status: 0, reason: 'empty_response' };
  }
  // Unwrap `{ payload: { ... } }` if present.
  const obj =
    'payload' in raw && raw.payload && typeof raw.payload === 'object'
      ? (raw.payload as Record<string, unknown>)
      : raw;
  const id = typeof obj.id === 'number' ? obj.id : Number(obj.id);
  if (!Number.isFinite(id)) {
    return { ok: false, status: 0, reason: 'no_contact_id_in_response' };
  }
  const contact: ChatwootContact = { id };
  if (typeof obj.name === 'string' && obj.name.trim()) contact.name = obj.name;
  if (typeof obj.email === 'string' && obj.email.trim()) contact.email = obj.email;
  if (typeof obj.phone_number === 'string' && obj.phone_number.trim()) {
    contact.phone_number = obj.phone_number;
  }
  return { ok: true, data: contact };
}

export async function setConversationCustomAttributes(
  cfg: ChatwootConfig,
  conversationId: number,
  attributes: Record<string, string | number | boolean | null>
): Promise<ChatwootResult<unknown>> {
  // Chatwoot 4.x merges the supplied map server-side, doesn't replace.
  const url = buildConversationUrl(cfg, conversationId, 'custom_attributes');
  return chatwootFetch<unknown>(cfg, url, {
    method: 'POST',
    body: JSON.stringify({ custom_attributes: attributes }),
  });
}

/* ---------------- message templating ---------------- */

export interface ConfirmationTemplateInput {
  customerFirstName: string;
  serviceName: string;
  slotStartIso: string; // ISO with offset, e.g. 2026-05-18T10:00:00+04:00
  durationH: number;
}

/**
 * Render the confirmation message we send back into the conversation thread.
 *
 * Plain text (Chatwoot renders \n as newlines in the agent UI). Asia/Dubai
 * timezone is implicit in the offset baked into `slotStartIso`.
 *
 * Exposed for unit tests.
 */
export function renderConfirmationMessage(input: ConfirmationTemplateInput): string {
  const date = new Date(input.slotStartIso);
  // Format in Asia/Dubai regardless of server tz.
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Dubai',
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai',
  }).format(date);
  const name = input.customerFirstName.trim() || 'there';
  const duration = `${input.durationH}h`;
  return [
    `Booking confirmed for ${name}.`,
    '',
    `${input.serviceName} on ${dateLabel} at ${timeLabel} (${duration}).`,
    '',
    `We've added this to your record. Reply to this thread anytime to reschedule.`,
  ].join('\n');
}
