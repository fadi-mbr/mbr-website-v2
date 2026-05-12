/**
 * POST /api/booking/notify-chatwoot
 *
 * Posts a booking-confirmation back into a Chatwoot conversation thread and
 * tags it with custom attributes so the agent sees the appointment in the
 * conversation sidebar.
 *
 * Called either:
 *   - directly by the wizard after a successful booking (when running in
 *     embed mode with a `conversation_id`), or
 *   - internally by /api/booking after it successfully creates the
 *     appointment fan-out (preferred — keeps Chatwoot logic server-side).
 *
 * Failure mode: NEVER throw. If Chatwoot is unreachable, return 200 with
 * `{ ok:true, chatwoot_notified:false, reason }`. The booking has already
 * happened — we don't want to make the wizard look broken because the chat
 * platform hiccuped.
 *
 * Auth: server-side env vars (CHATWOOT_ADMIN_API_TOKEN, etc.) — see
 * src/lib/chatwoot-client.ts.
 */

import { NextResponse } from 'next/server';
import {
  loadChatwootConfig,
  renderConfirmationMessage,
  sendConversationMessage,
  setConversationCustomAttributes,
} from '@/lib/chatwoot-client';
import { logBooking } from '../_lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JSON_HEADERS: Record<string, string> = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json',
};

interface NotifyBody {
  conversation_id?: number;
  arc_appointment_id?: number;
  arc_repair_id?: number;
  arc_owner_id?: number;
  service_name?: string;
  slot_start_iso?: string;
  duration_h?: number;
  customer_first_name?: string;
}

function jsonResponse(body: unknown, status: number): NextResponse {
  return new NextResponse(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function isFinitePositive(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n) && n > 0;
}

/** Parse + minimally validate the body. Returns null on hard-broken input. */
function parseBody(raw: unknown): NotifyBody | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const b = raw as Record<string, unknown>;
  const out: NotifyBody = {};
  if (typeof b.conversation_id === 'number') out.conversation_id = b.conversation_id;
  if (typeof b.arc_appointment_id === 'number') out.arc_appointment_id = b.arc_appointment_id;
  if (typeof b.arc_repair_id === 'number') out.arc_repair_id = b.arc_repair_id;
  if (typeof b.arc_owner_id === 'number') out.arc_owner_id = b.arc_owner_id;
  if (typeof b.service_name === 'string') out.service_name = b.service_name;
  if (typeof b.slot_start_iso === 'string') out.slot_start_iso = b.slot_start_iso;
  if (typeof b.duration_h === 'number') out.duration_h = b.duration_h;
  if (typeof b.customer_first_name === 'string') out.customer_first_name = b.customer_first_name;
  return out;
}

export async function POST(req: Request): Promise<NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse(
      { ok: false, code: 'VALIDATION', message: 'body must be valid JSON' },
      400
    );
  }

  const body = parseBody(raw);
  if (!body) {
    return jsonResponse(
      { ok: false, code: 'VALIDATION', message: 'body must be a JSON object' },
      400
    );
  }

  if (!isFinitePositive(body.conversation_id)) {
    return jsonResponse(
      { ok: false, code: 'VALIDATION', field: 'conversation_id', message: 'conversation_id must be a positive integer' },
      400
    );
  }
  if (!body.service_name || !body.slot_start_iso || !isFinitePositive(body.duration_h)) {
    return jsonResponse(
      { ok: false, code: 'VALIDATION', message: 'service_name, slot_start_iso, duration_h are required' },
      400
    );
  }
  // The ISO must parse to a finite date.
  const ts = Date.parse(body.slot_start_iso);
  if (!Number.isFinite(ts)) {
    return jsonResponse(
      { ok: false, code: 'VALIDATION', field: 'slot_start_iso', message: 'slot_start_iso must be a valid ISO timestamp' },
      400
    );
  }

  const result = await notifyChatwoot({
    conversationId: body.conversation_id,
    arcAppointmentId: body.arc_appointment_id,
    arcRepairId: body.arc_repair_id,
    arcOwnerId: body.arc_owner_id,
    serviceName: body.service_name,
    slotStartIso: body.slot_start_iso,
    durationH: body.duration_h,
    customerFirstName: body.customer_first_name ?? '',
  });

  return jsonResponse(result, 200);
}

/* ---------------- internal helper, also called from /api/booking ---------------- */

export interface NotifyInput {
  conversationId: number;
  arcAppointmentId?: number;
  arcRepairId?: number;
  arcOwnerId?: number;
  serviceName: string;
  slotStartIso: string;
  durationH: number;
  customerFirstName: string;
}

export interface NotifyResult {
  ok: true;
  chatwoot_notified: boolean;
  message_id?: number;
  reason?: string;
}

/**
 * Run the notify dance. Always resolves — never throws. Designed to be safe
 * to invoke from /api/booking right after a successful submitBooking().
 */
export async function notifyChatwoot(input: NotifyInput): Promise<NotifyResult> {
  const cfg = loadChatwootConfig();
  if (!cfg) {
    logBooking({
      event: 'chatwoot.skip_no_token',
      status: 200,
      reason: 'CHATWOOT_ADMIN_API_TOKEN not set',
    });
    return { ok: true, chatwoot_notified: false, reason: 'chatwoot_not_configured' };
  }

  // 1. Send the confirmation message into the conversation.
  const content = renderConfirmationMessage({
    customerFirstName: input.customerFirstName,
    serviceName: input.serviceName,
    slotStartIso: input.slotStartIso,
    durationH: input.durationH,
  });
  const msg = await sendConversationMessage(cfg, {
    conversationId: input.conversationId,
    content,
    messageType: 'outgoing',
    isPrivate: false,
  });
  if (!msg.ok) {
    logBooking({
      event: 'chatwoot.send_message_fail',
      status: msg.status,
      reason: msg.reason,
    });
    return {
      ok: true,
      chatwoot_notified: false,
      reason: `send_message_failed: ${msg.reason}`,
    };
  }

  // 2. Set custom attributes — non-fatal if it fails. The agent at least
  //    sees the booking message even without the structured attrs.
  const attrs: Record<string, string | number> = {
    booking_status: 'confirmed',
    last_booking_at: new Date().toISOString(),
  };
  if (input.arcAppointmentId) attrs.arc_appointment_id = input.arcAppointmentId;
  if (input.arcRepairId) attrs.arc_repair_id = input.arcRepairId;
  if (input.arcOwnerId) attrs.arc_owner_id = input.arcOwnerId;

  const attrRes = await setConversationCustomAttributes(cfg, input.conversationId, attrs);
  if (!attrRes.ok) {
    logBooking({
      event: 'chatwoot.set_attrs_fail',
      status: attrRes.status,
      reason: attrRes.reason,
    });
    // Still consider the notify a success — the customer-visible message landed.
    return {
      ok: true,
      chatwoot_notified: true,
      message_id: msg.data?.id,
      reason: `attrs_failed: ${attrRes.reason}`,
    };
  }

  logBooking({
    event: 'chatwoot.notified',
    status: 200,
  });
  return { ok: true, chatwoot_notified: true, message_id: msg.data?.id };
}
