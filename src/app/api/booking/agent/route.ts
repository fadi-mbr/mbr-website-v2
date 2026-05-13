/**
 * POST /api/booking/agent
 *
 * Agent-initiated booking submit. Called from the `/book/agent` Server
 * Component (Chatwoot Dashboard App entry) via a Server Action so the
 * shared agent secret stays server-side.
 *
 * Auth: `x-mbr-agent-secret` header must match `BOOKING_AGENT_SECRET`.
 * Comparison is constant-time on equal-length buffers via
 * `crypto.timingSafeEqual` to avoid leaking the secret through timing.
 *
 * Flow:
 *   1) Auth check                       → 401
 *   2) Phone rate limit (1/hour, in-memory). `?force=true` bypasses for
 *      advisor retries on the same advisor session.
 *   3) Validate body (reuses the public route's hand-rolled validator with
 *      `description`/`preferredLanguage` filled in from agent defaults).
 *   4) Call `submitConfirmedBooking(intent, { chatwoot: ... })` — that
 *      helper owns the ARC submit AND the Chatwoot post-back, so we don't
 *      re-implement either here.
 *   5) Map result to HTTP status:
 *        ok                                  → 200
 *        UNKNOWN_SERVICE / PHONE_PROBLEM     → 400
 *        SLOT_TAKEN                          → 409
 *        SERVICE_LOOKUP_FAILED / ARC_DOWN    → 503
 *
 * The endpoint exclusively serves the agent path; the public `/api/booking`
 * route is untouched.
 */

import crypto from 'node:crypto';
import { NextResponse, after } from 'next/server';
import { normalisePhone } from '../_lib/arc-client';
import { validateBookingRequest } from '../_lib/validate';
import {
  checkRateLimit,
  recordBooking,
} from '../_lib/rate-limit';
import { logBooking } from '../_lib/log';
import { submitConfirmedBooking } from '@/lib/booking-arc-submit';
import type { BookingIntent } from '@/lib/booking-types';
import {
  loadChatwootConfig,
  updateContactCustomAttributes,
} from '@/lib/chatwoot-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE: Record<string, string> = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json',
};

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {}
): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { ...PRIVATE_NO_STORE, ...extraHeaders },
  });
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
 * Constant-time compare of two UTF-8 strings. Returns false when either
 * side is empty or when lengths differ (timingSafeEqual itself requires
 * equal-length buffers).
 *
 * Exported for unit tests.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function readBaseUrl(reqUrl: string): URL {
  try {
    return new URL(reqUrl);
  } catch {
    return new URL('http://localhost');
  }
}

/* -------------------- Chatwoot contact write-back deps -------------------- */
/**
 * Indirection so unit tests can capture / no-op the contact-attribute
 * write-back without mocking `next/server.after()` or the global fetch.
 *
 * Production wiring uses the real `loadChatwootConfig` +
 * `updateContactCustomAttributes`. `_setContactAttrsDepsForTests` lets
 * tests substitute fakes; `_resetContactAttrsDepsForTests` restores
 * production.
 */
interface ContactAttrsDeps {
  loadConfig: typeof loadChatwootConfig;
  updateAttrs: typeof updateContactCustomAttributes;
}

const PROD_CONTACT_ATTRS_DEPS: ContactAttrsDeps = {
  loadConfig: loadChatwootConfig,
  updateAttrs: updateContactCustomAttributes,
};

let contactAttrsDeps: ContactAttrsDeps = PROD_CONTACT_ATTRS_DEPS;

export function _setContactAttrsDepsForTests(deps: ContactAttrsDeps): void {
  contactAttrsDeps = deps;
}

export function _resetContactAttrsDepsForTests(): void {
  contactAttrsDeps = PROD_CONTACT_ATTRS_DEPS;
}

/**
 * Schedule a best-effort write-back of the vehicle fields onto the Chatwoot
 * contact's `custom_attributes`, so the next /book/agent submission for the
 * same customer pre-fills the vehicle. Non-blocking; failures are logged but
 * never affect the user-facing response.
 *
 * Extracted so tests can call it directly (the `after()` wrapper itself is
 * a thin scheduler that's hard to assert against).
 */
export async function writeBackVehicleAttrs(args: {
  contactId: number;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate?: string;
}): Promise<void> {
  try {
    const cfg = contactAttrsDeps.loadConfig();
    if (!cfg) return;
    const attrs: Record<string, string | number | boolean | null> = {
      vehicle_year: args.vehicleYear,
      vehicle_make: args.vehicleMake,
      vehicle_model: args.vehicleModel,
    };
    if (args.vehiclePlate) attrs.vehicle_plate = args.vehiclePlate;
    const res = await contactAttrsDeps.updateAttrs(cfg, args.contactId, attrs);
    if (!res.ok) {
      logBooking({
        event: 'booking.agent.contact_attrs_failed',
        reason: `contact=${args.contactId} ${res.reason}`,
        status: res.status,
      });
    }
  } catch (e) {
    logBooking({
      event: 'booking.agent.contact_attrs_error',
      reason: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const t0 = Date.now();

  // ----- 1. Auth -------------------------------------------------------------
  const expected = process.env.BOOKING_AGENT_SECRET;
  if (!expected) {
    logBooking({
      event: 'booking.agent.no_secret_configured',
      status: 401,
      reason: 'BOOKING_AGENT_SECRET not set',
    });
    return jsonResponse(
      { ok: false, code: 'AUTH', message: 'Agent endpoint not configured.' },
      401
    );
  }
  const provided = req.headers.get('x-mbr-agent-secret') ?? '';
  if (!timingSafeStringEqual(provided, expected)) {
    logBooking({
      event: 'booking.agent.bad_secret',
      status: 401,
    });
    return jsonResponse(
      { ok: false, code: 'AUTH', message: 'Unauthorized.' },
      401
    );
  }

  // ----- 2. Parse JSON -------------------------------------------------------
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    logBooking({ event: 'booking.agent.bad_json', status: 400 });
    return jsonResponse(
      {
        ok: false,
        code: 'VALIDATION',
        field: 'body',
        message: 'request body must be valid JSON',
      },
      400
    );
  }

  if (typeof raw !== 'object' || raw === null) {
    return jsonResponse(
      {
        ok: false,
        code: 'VALIDATION',
        field: 'body',
        message: 'request body must be a JSON object',
      },
      400
    );
  }
  const body = raw as Record<string, unknown>;

  // ----- 3. Conversation + Contact context (required for agent flow) --------
  const conversationId = body['conversationId'];
  const contactId = body['contactId'];
  if (!isPositiveInt(conversationId)) {
    return jsonResponse(
      {
        ok: false,
        code: 'VALIDATION',
        field: 'conversationId',
        message: 'conversationId must be a positive integer',
      },
      400
    );
  }
  if (!isPositiveInt(contactId)) {
    return jsonResponse(
      {
        ok: false,
        code: 'VALIDATION',
        field: 'contactId',
        message: 'contactId must be a positive integer',
      },
      400
    );
  }

  // ----- 4. Normalise phone --------------------------------------------------
  if (typeof body.ownerPhone === 'string') {
    const norm = normalisePhone(body.ownerPhone);
    if (norm) body.ownerPhone = norm;
  }

  // Validator requires `description` + `preferredLanguage`. The advisor form
  // doesn't carry those — fill agent defaults before validation.
  if (typeof body.description !== 'string' || !body.description.trim()) {
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    body.description = notes || 'Agent-initiated booking';
  }
  if (typeof body.preferredLanguage !== 'string') {
    body.preferredLanguage = 'en';
  }
  // Pass the validated conversationId through so the validator records it too.
  body.conversationId = conversationId;

  // ----- 5. Validate ---------------------------------------------------------
  const parsed = validateBookingRequest(body);
  if ('code' in parsed) {
    logBooking({
      event: 'booking.agent.invalid',
      status: 400,
      code: 'VALIDATION',
      reason: `${parsed.field}: ${parsed.message}`,
    });
    return jsonResponse(
      {
        ok: false,
        code: 'VALIDATION',
        field: parsed.field,
        message: parsed.message,
      },
      400
    );
  }

  // ----- 6. Rate limit (1/hour per phone). `?force=true` bypasses for ------
  //         advisor retries (same advisor, same customer, fixing input).
  const url = readBaseUrl(req.url);
  const force = url.searchParams.get('force') === 'true';
  if (!force) {
    const rl = checkRateLimit(parsed.ownerPhone);
    if (!rl.allowed) {
      logBooking({
        event: 'booking.agent.rate_limit',
        phone: parsed.ownerPhone,
        status: 429,
      });
      return jsonResponse(
        {
          ok: false,
          code: 'RATE_LIMIT',
          message:
            'Only one booking per phone per hour. Append ?force=true to override for advisor retries.',
          retryAfterSec: Math.ceil(rl.retryAfterMs / 1000),
        },
        429,
        { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) }
      );
    }
  }

  // ----- 7. Build BookingIntent and submit ---------------------------------
  const intent: BookingIntent = {
    serviceId: parsed.serviceId,
    // serviceName is filled by submitConfirmedBooking after service lookup;
    // give a placeholder so the shape stays satisfied for typing.
    serviceName: '',
    timeStartMs: parsed.timeStartMs,
    // durationH is recomputed inside submitConfirmedBooking from the looked-up
    // service. We supply a sentinel; the helper trusts its own lookup.
    durationH: 0,
    firstName: parsed.ownerNameFirst,
    lastName: parsed.ownerNameLast,
    phone: parsed.ownerPhone,
    email: parsed.ownerEmail,
    vehicleYear: parsed.vehicleYear,
    vehicleMake: parsed.vehicleMake,
    vehicleModel: parsed.vehicleModel,
    plate: typeof body.vehiclePlate === 'string' ? body.vehiclePlate : '',
    notes:
      typeof body.notes === 'string' && body.notes.trim()
        ? body.notes
        : undefined,
  };

  const result = await submitConfirmedBooking(intent, {
    chatwoot: { conversationId, contactId },
  });

  if (!result.ok) {
    const status =
      result.code === 'SLOT_TAKEN'
        ? 409
        : result.code === 'UNKNOWN_SERVICE' ||
            result.code === 'PHONE_PROBLEM' ||
            result.code === 'EXISTING_CUSTOMER' ||
            result.code === 'SLOT_UNAVAILABLE'
          ? 400
          : 503; // SERVICE_LOOKUP_FAILED / ARC_DOWN
    logBooking({
      event: 'booking.agent.submit_fail',
      phone: parsed.ownerPhone,
      serviceId: parsed.serviceId,
      latencyMs: Date.now() - t0,
      status,
      code: result.code,
      reason: `conv=${conversationId} contact=${contactId} ${result.message}`,
    });
    return jsonResponse(
      { ok: false, code: result.code, message: result.message },
      status
    );
  }

  // 8. Record the booking against the per-phone limiter (only on success).
  recordBooking(parsed.ownerPhone);

  logBooking({
    event: 'booking.agent.ok',
    phone: parsed.ownerPhone,
    serviceId: parsed.serviceId,
    latencyMs: Date.now() - t0,
    status: 200,
    reason: `conv=${conversationId} contact=${contactId}`,
  });

  // 9. Schedule a non-blocking write-back of the vehicle fields to the
  //    Chatwoot contact's custom_attributes. This makes future /book/agent
  //    submissions for the same customer pre-fill vehicle year/make/model
  //    and plate. Best-effort: a failure here is logged but doesn't affect
  //    the booking response.
  //
  //    `after()` throws when invoked outside a Next request scope (e.g.
  //    inside our hand-rolled unit-test harness). Catch + fall back to a
  //    fire-and-forget Promise — production gets the deferred behaviour,
  //    tests get observable side effects.
  const writeBackArgs = {
    contactId,
    vehicleYear: parsed.vehicleYear,
    vehicleMake: parsed.vehicleMake,
    vehicleModel: parsed.vehicleModel,
    vehiclePlate:
      typeof body.vehiclePlate === 'string' && body.vehiclePlate.trim()
        ? body.vehiclePlate.trim()
        : undefined,
  };
  try {
    after(async () => {
      await writeBackVehicleAttrs(writeBackArgs);
    });
  } catch {
    // Not in a request scope (unit tests). Run directly — the helper
    // already swallows its own errors.
    void writeBackVehicleAttrs(writeBackArgs);
  }

  return jsonResponse(
    {
      ok: true,
      confirmAt: result.confirmAt,
      serviceName: result.serviceName,
      estimatedDuration: result.estimatedDuration,
      arcAppointmentId: result.arcAppointmentId,
    },
    200
  );
}
