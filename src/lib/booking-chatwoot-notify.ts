/**
 * Post a "new booking — pending approval" notification into the MBR
 * Connect (Chatwoot) "Booking Notifications" inbox after a public booking
 * lands in ARC.
 *
 * This is a one-way feed from the website → sales team. Customers don't
 * see this conversation — it lives in a dedicated API inbox on
 * connect.mbrme.com whose only purpose is to surface incoming public
 * bookings so the team can click through to ARC and approve them.
 *
 * Why it exists:
 *   When a customer completes /book + the email-confirm link, ARC creates
 *   the appointment with status SG/confirmShop=S — "Pending team approval".
 *   The shop must approve it in ARC's UI for it to appear on the calendar.
 *   Today the team only sees an easy-to-miss in-ARC notification. This
 *   module fires a Chatwoot message with full booking details + a direct
 *   "Open in ARC to approve" link so they can act immediately.
 *
 * Failure posture:
 *   Best-effort. Never throws. A failed Chatwoot post must not affect the
 *   already-confirmed ARC booking — the booking IS the source of truth.
 *   Callers get back `{ ok, reason? }` so they can log appropriately.
 *
 * Required env vars (read at call time, not import time):
 *   CHATWOOT_BASE_URL                 e.g. https://connect.mbrme.com
 *   CHATWOOT_ACCOUNT_ID               e.g. 1
 *   CHATWOOT_ADMIN_API_TOKEN          admin user-access token
 *   CHATWOOT_BOOKINGS_INBOX_ID        6 (Channel::Api inbox)
 *   CHATWOOT_BOOKINGS_TEAM_ID         1 (optional but recommended; auto-assigns)
 *
 * Chatwoot API flow (Channel::Api inbox — no live agent panel client):
 *   1. POST /api/v1/accounts/:id/contacts            — create (or get existing)
 *      a contact keyed by `identifier = email`. The identifier is the
 *      idempotency key: a second submit with the same email returns the
 *      same contact via the 422 fallback path.
 *   2. POST /api/v1/accounts/:id/conversations        — open a fresh
 *      conversation in the bookings inbox, optionally assigned to a team.
 *   3. POST /api/v1/accounts/:id/conversations/:cid/messages — drop the
 *      Markdown body in (as an outgoing message so it shows up in the
 *      bookings UI as a regular team-visible note).
 *
 * The module exposes its deps via `_setChatwootDepsForTests` for the
 * unit tests so we can swap the fetch path for in-memory fakes.
 */

import type { BookingIntent } from './booking-types';
import { formatIntlPhone } from './booking-phone';

const DEFAULT_BASE = 'https://connect.mbrme.com';
const DEFAULT_ACCOUNT_ID = '1';
const FETCH_TIMEOUT_MS = 8_000;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BookingNotifyInput {
  intent: BookingIntent;
  /** ARC IDs if known. If absent, the message uses a customer-search link. */
  arcAppointmentId?: number;
  arcRepairId?: number;
  /** Service title in human form (e.g. "Detailed Vehicle Inspection"). */
  serviceName: string;
  /** Service duration in hours. */
  durationH: number;
}

export interface BookingNotifyResult {
  ok: boolean;
  reason?: string;
  conversationId?: number;
}

interface NotifyConfig {
  baseUrl: string;
  accountId: string;
  token: string;
  inboxId: string;
  teamId?: string;
}

// ---------------------------------------------------------------------------
// Config loader — runtime, env-driven. Returns null with reason when any
// required var is missing.
// ---------------------------------------------------------------------------

export function _loadNotifyConfig(
  env: NodeJS.ProcessEnv = process.env,
): { ok: true; cfg: NotifyConfig } | { ok: false; reason: string } {
  const token = env.CHATWOOT_ADMIN_API_TOKEN;
  if (!token) return { ok: false, reason: 'CHATWOOT_ADMIN_API_TOKEN not set' };
  const inboxId = env.CHATWOOT_BOOKINGS_INBOX_ID;
  if (!inboxId) return { ok: false, reason: 'CHATWOOT_BOOKINGS_INBOX_ID not set' };
  const cfg: NotifyConfig = {
    baseUrl: (env.CHATWOOT_BASE_URL || DEFAULT_BASE).replace(/\/+$/, ''),
    accountId: env.CHATWOOT_ACCOUNT_ID || DEFAULT_ACCOUNT_ID,
    token,
    inboxId,
  };
  if (env.CHATWOOT_BOOKINGS_TEAM_ID) cfg.teamId = env.CHATWOOT_BOOKINGS_TEAM_ID;
  return { ok: true, cfg };
}

// ---------------------------------------------------------------------------
// Fetch dep — swappable for tests
// ---------------------------------------------------------------------------

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

interface ChatwootDeps {
  fetch: FetchLike;
  loadConfig: typeof _loadNotifyConfig;
}

let deps: ChatwootDeps = {
  fetch: (url, init) => fetch(url, init),
  loadConfig: _loadNotifyConfig,
};

export function _setChatwootDepsForTests(d: Partial<ChatwootDeps>): void {
  deps = { ...deps, ...d };
}

export function _resetChatwootDepsForTests(): void {
  deps = {
    fetch: (url, init) => fetch(url, init),
    loadConfig: _loadNotifyConfig,
  };
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function postJson<T = unknown>(
  cfg: NotifyConfig,
  path: string,
  body: unknown,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number; reason: string; data?: unknown }> {
  const url = `${cfg.baseUrl}/api/v1/accounts/${cfg.accountId}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await deps.fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        api_access_token: cfg.token,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = text;
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        reason: `${res.status}: ${typeof text === 'string' ? text.slice(0, 200) : 'non-ok'}`,
        data: parsed,
      };
    }
    return { ok: true, status: res.status, data: parsed as T };
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

// ---------------------------------------------------------------------------
// ARC URL builder — see step 2 of the spec
// ---------------------------------------------------------------------------

const ARC_BASE = 'https://autorepaircloud.com';

export function _buildArcUrl(input: {
  arcAppointmentId?: number;
  arcRepairId?: number;
  email: string;
}): string {
  if (typeof input.arcRepairId === 'number' && Number.isFinite(input.arcRepairId)) {
    return `${ARC_BASE}/main/repair?id=${input.arcRepairId}`;
  }
  if (
    typeof input.arcAppointmentId === 'number' &&
    Number.isFinite(input.arcAppointmentId)
  ) {
    return `${ARC_BASE}/main/appointment-list?id=${input.arcAppointmentId}`;
  }
  return `${ARC_BASE}/main/customer-list?search=${encodeURIComponent(input.email)}`;
}

// ---------------------------------------------------------------------------
// Markdown rendering — escape user-supplied fields
// ---------------------------------------------------------------------------

/**
 * Strip / escape characters that would either inject Markdown formatting
 * or break out of a single-line context. We intentionally keep this
 * narrow — Chatwoot's Markdown renderer is forgiving, but a customer
 * with `**` in their name shouldn't be able to bold the rest of the
 * message.
 *
 * - Backslash-escape Markdown special chars
 * - Strip control chars and newlines (newlines are reserved for our
 *   own template)
 */
export function _escapeMd(input: string | undefined | null): string {
  if (!input) return '';
  const stripped = input
    .replace(/[ -]/g, ' ')
    .trim();
  return stripped.replace(/([\\*_\[])/g, '\\$1');
}

interface RenderInput {
  intent: BookingIntent;
  serviceName: string;
  durationH: number;
  arcAppointmentId?: number;
  arcRepairId?: number;
}

export function _renderBookingMessage(input: RenderInput): string {
  const i = input.intent;
  const fullName = `${i.firstName} ${i.lastName}`.trim() || '(name missing)';
  const phoneLabel = (() => {
    try {
      return formatIntlPhone(i.phone);
    } catch {
      return i.phone;
    }
  })();
  const when = formatWhenInDubai(i.timeStartMs);
  const vehicleBase = [i.vehicleYear, i.vehicleMake, i.vehicleModel]
    .filter((x) => x !== undefined && x !== null && x !== '')
    .join(' ');
  const vehicleStr = i.plate
    ? `${vehicleBase} · Plate: ${_escapeMd(i.plate)}`
    : vehicleBase;
  const arcUrl = _buildArcUrl({
    arcAppointmentId: input.arcAppointmentId,
    arcRepairId: input.arcRepairId,
    email: i.email,
  });
  const apptIdLabel =
    typeof input.arcAppointmentId === 'number' ? String(input.arcAppointmentId) : '?';
  const repairIdLabel =
    typeof input.arcRepairId === 'number' ? String(input.arcRepairId) : '?';

  return [
    `🆕 *New booking — pending approval*`,
    ``,
    `**Customer**: ${_escapeMd(fullName)}`,
    `**Phone**: ${phoneLabel}`,
    `**Email**: ${i.email}`,
    ``,
    `**Service**: ${input.serviceName} (${input.durationH}h)`,
    `**When**: ${when}`,
    `**Vehicle**: ${_escapeMd(vehicleStr.replace(/ · Plate: .*/, ''))}${i.plate ? ` · Plate: ${_escapeMd(i.plate)}` : ''}`,
    `**Notes**: ${i.notes ? _escapeMd(i.notes) : '—'}`,
    ``,
    `ARC IDs: appointment \`${apptIdLabel}\`, RO \`${repairIdLabel}\``,
    ``,
    `👉 [Open in ARC to approve](${arcUrl})`,
    ``,
    `_Once approved in ARC, the slot moves from "Pending" to the active calendar._`,
  ].join('\n');
}

function formatWhenInDubai(ms: number): string {
  // Render as: "Tue, 19 May 2026, 10:00 AM (GMT+4)" — explicit GMT+4 label
  // so agents reading on a phone in any tz aren't confused.
  const d = new Date(ms);
  const datePart = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dubai',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai',
  }).format(d);
  return `${datePart}, ${timePart} (GMT+4)`;
}

// ---------------------------------------------------------------------------
// Public entry — never throws
// ---------------------------------------------------------------------------

/**
 * Post a "new booking pending approval" message into the Chatwoot
 * Booking Notifications inbox. Best-effort — never throws.
 */
export async function notifyTeamOfNewBooking(
  input: BookingNotifyInput,
): Promise<BookingNotifyResult> {
  try {
    const cfgRes = deps.loadConfig();
    if (!cfgRes.ok) {
      return { ok: false, reason: `config_missing: ${cfgRes.reason}` };
    }
    const cfg = cfgRes.cfg;

    // ---- 1. Upsert contact (idempotent on identifier = email) ----
    // Chatwoot returns 422 with a "Email has already been taken" / similar
    // error if the contact exists. The `identifier` field — if set —
    // gives us a stable contact lookup; the email alone is not enough
    // because it's only unique per-account in some Chatwoot versions.
    const contactRes = await postJson<{
      payload?: {
        contact?: { id?: number };
      };
      id?: number;
    }>(cfg, '/contacts', {
      identifier: input.intent.email,
      email: input.intent.email,
      name: `${input.intent.firstName} ${input.intent.lastName}`.trim() || input.intent.email,
      phone_number: input.intent.phone.startsWith('+')
        ? input.intent.phone
        : `+${input.intent.phone}`,
      inbox_id: Number(cfg.inboxId),
    });

    let contactId: number | undefined;
    let sourceId: string | undefined;
    if (contactRes.ok) {
      const payload = contactRes.data?.payload;
      const contact = payload?.contact;
      contactId = typeof contact?.id === 'number' ? contact.id : undefined;
      // Some Chatwoot versions also return contact_inboxes[].source_id at
      // the top level of payload — we cope with both shapes.
      const ci = (contactRes.data?.payload as unknown as {
        contact_inboxes?: Array<{ source_id?: string; inbox?: { id?: number } }>;
      })?.contact_inboxes;
      if (Array.isArray(ci) && ci.length > 0) {
        sourceId = ci.find((c) => c.inbox?.id === Number(cfg.inboxId))?.source_id;
      }
    }

    // If contact-create failed (e.g. 422 "already exists") OR we didn't get
    // a source_id, do a contact-search to recover the contact ID.
    if (contactId === undefined) {
      const searchRes = await postJson<{
        payload?: Array<{ id?: number }>;
      }>(cfg, `/contacts/search?q=${encodeURIComponent(input.intent.email)}&include=contact_inboxes`, {});
      if (searchRes.ok && Array.isArray(searchRes.data?.payload) && searchRes.data!.payload.length > 0) {
        const first = searchRes.data!.payload[0];
        contactId = typeof first?.id === 'number' ? first.id : undefined;
      }
    }

    if (contactId === undefined) {
      return {
        ok: false,
        reason: `contact_create_failed: ${contactRes.ok ? 'no_id_in_response' : contactRes.reason}`,
      };
    }

    // If we don't have a source_id, mint one against the inbox. The
    // /contacts/:id/contact_inboxes endpoint creates a contact_inbox row
    // and returns its source_id, which conversations require.
    if (!sourceId) {
      const mintRes = await postJson<{ source_id?: string }>(
        cfg,
        `/contacts/${contactId}/contact_inboxes`,
        { inbox_id: Number(cfg.inboxId) },
      );
      if (mintRes.ok && typeof mintRes.data?.source_id === 'string') {
        sourceId = mintRes.data.source_id;
      }
    }

    if (!sourceId) {
      return { ok: false, reason: 'no_source_id_for_inbox' };
    }

    // ---- 2. Open a conversation in the bookings inbox ----
    const convBody: Record<string, unknown> = {
      source_id: sourceId,
      inbox_id: Number(cfg.inboxId),
      contact_id: contactId,
      status: 'open',
    };
    if (cfg.teamId) convBody.team_id = Number(cfg.teamId);

    const convRes = await postJson<{ id?: number }>(cfg, '/conversations', convBody);
    if (!convRes.ok) {
      return { ok: false, reason: `conversation_create_failed: ${convRes.reason}` };
    }
    const conversationId =
      typeof convRes.data?.id === 'number' ? convRes.data.id : undefined;
    if (conversationId === undefined) {
      return { ok: false, reason: 'no_conversation_id_in_response' };
    }

    // ---- 3. Post the message ----
    const content = _renderBookingMessage({
      intent: input.intent,
      serviceName: input.serviceName,
      durationH: input.durationH,
      arcAppointmentId: input.arcAppointmentId,
      arcRepairId: input.arcRepairId,
    });
    const msgRes = await postJson(cfg, `/conversations/${conversationId}/messages`, {
      content,
      message_type: 'outgoing',
      private: false,
    });
    if (!msgRes.ok) {
      return {
        ok: false,
        reason: `message_post_failed: ${msgRes.reason}`,
        conversationId,
      };
    }

    return { ok: true, conversationId };
  } catch (e) {
    return {
      ok: false,
      reason: `threw: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
