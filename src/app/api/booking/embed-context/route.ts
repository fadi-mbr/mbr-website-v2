/**
 * POST /api/booking/embed-context
 *
 * Server-side prefill lookup for the booking wizard's embed mode. When the
 * advisor opens the booking iframe from a Chatwoot conversation, Chatwoot
 * forwards the `contact_id` in the query string. The wizard cannot read the
 * Chatwoot admin API directly (the admin token would have to ship to the
 * browser — never), so it POSTs the contact_id here and we look up the
 * contact's name / email / phone server-side.
 *
 * Body:    { contact_id: number }
 * Returns: { ok: true,  contact: { phone?, name?, email? } | null }
 *          { ok: false }   on any Chatwoot or config error (200 status,
 *                          never 5xx — the wizard MUST keep working without
 *                          prefill if Chatwoot hiccups)
 *
 * 503 is reserved for "Chatwoot not configured at all" (no token env var),
 * because that's a deploy-config problem distinct from a transient lookup
 * failure and the advisor's UI can decide whether to surface it.
 *
 * Auth: server-side `CHATWOOT_ADMIN_API_TOKEN` env var only. Token never
 * leaves the function.
 *
 * Rate-limiting: deliberately loose. This is internal advisor traffic only,
 * gated by the Chatwoot Dashboard App registration. The route does no
 * customer-facing work.
 */

import { NextResponse } from 'next/server';
import {
  fetchContact,
  loadChatwootConfig,
  type ChatwootContact,
} from '@/lib/chatwoot-client';
import { logBooking } from '../_lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JSON_HEADERS: Record<string, string> = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json',
};

const CHATWOOT_FETCH_TIMEOUT_MS = 5_000;

interface EmbedContextRequestBody {
  contact_id?: unknown;
}

export interface EmbedContextSuccess {
  ok: true;
  contact: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
}

export interface EmbedContextFailure {
  ok: false;
  reason?: string;
}

function jsonResponse(body: unknown, status: number): NextResponse {
  return new NextResponse(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function isPositiveInt(n: unknown): n is number {
  return (
    typeof n === 'number' &&
    Number.isFinite(n) &&
    Number.isInteger(n) &&
    n > 0 &&
    n <= Number.MAX_SAFE_INTEGER
  );
}

/**
 * Project a ChatwootContact down to the {name,email,phone} the wizard
 * Details step actually consumes. Returns null when no usable fields were
 * present (so the client can fall back to other prefill sources).
 *
 * Exposed for unit tests.
 */
export function projectContact(
  contact: ChatwootContact
): EmbedContextSuccess['contact'] {
  const out: { name?: string; email?: string; phone?: string } = {};
  if (typeof contact.name === 'string') {
    const t = contact.name.trim();
    if (t) out.name = t.slice(0, 80);
  }
  if (typeof contact.email === 'string') {
    const t = contact.email.trim();
    if (t && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) out.email = t;
  }
  if (typeof contact.phone_number === 'string') {
    // Chatwoot stores E.164 with a leading '+' — strip it to match the
    // wizard's existing UAE-format input (mask adds the prefix back).
    const cleaned = contact.phone_number.trim().replace(/^\+/, '');
    if (/^\d{6,15}$/.test(cleaned)) out.phone = cleaned;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export async function POST(req: Request): Promise<NextResponse> {
  let raw: EmbedContextRequestBody;
  try {
    raw = (await req.json()) as EmbedContextRequestBody;
  } catch {
    return jsonResponse(
      { ok: false, reason: 'invalid_json' } satisfies EmbedContextFailure,
      400
    );
  }

  const contactId = raw?.contact_id;
  if (!isPositiveInt(contactId)) {
    return jsonResponse(
      { ok: false, reason: 'invalid_contact_id' } satisfies EmbedContextFailure,
      400
    );
  }

  const cfg = loadChatwootConfig();
  if (!cfg) {
    logBooking({
      event: 'embed_context.skip_no_token',
      status: 503,
      reason: 'CHATWOOT_ADMIN_API_TOKEN not set',
    });
    return jsonResponse(
      { ok: false, reason: 'chatwoot_not_configured' } satisfies EmbedContextFailure,
      503
    );
  }

  const started = Date.now();
  const result = await fetchContact(cfg, contactId, CHATWOOT_FETCH_TIMEOUT_MS);
  const latencyMs = Date.now() - started;

  if (!result.ok) {
    logBooking({
      event: 'embed_context.fetch_fail',
      status: result.status,
      reason: result.reason,
      latencyMs,
    });
    // 200 with ok:false — see file header. The wizard treats this the
    // same as "no prefill available" and lets the advisor type manually.
    return jsonResponse(
      { ok: false, reason: 'chatwoot_lookup_failed' } satisfies EmbedContextFailure,
      200
    );
  }

  const projected = projectContact(result.data);
  logBooking({
    event: 'embed_context.ok',
    status: 200,
    latencyMs,
  });
  return jsonResponse(
    { ok: true, contact: projected } satisfies EmbedContextSuccess,
    200
  );
}
