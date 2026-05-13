/**
 * POST /api/booking/request
 *
 * Public booking submit. Anonymous — anyone can hit this endpoint with a
 * form payload. We don't write to ARC here; we sign a magic-link token
 * containing the full booking intent and email it to the customer. The
 * actual ARC write happens at `/book/confirm` when they click the link.
 *
 * Anti-spam stack (defence in depth):
 *   1. Honeypot — `_website` field. Bots fill it; the form's sr-only
 *      label keeps humans away. Trip → silent 200, no log to outside.
 *   2. IP rate-limit — 10 hits / hour / IP (rolling). Hard-cap on volume
 *      from a single source before they get to spend our email budget.
 *   3. Phone rate-limit — 1 hit / hour / phone. Stops the same number
 *      being booked twice in an hour. Same module as the agent route.
 *   4. Token expiry — 30 min, signed with HMAC-SHA256. A booking intent
 *      that doesn't get confirmed within 30 minutes simply dies.
 *
 * Latency posture (Next 15 `after()`):
 *   This route used to block on SMTP through ImprovMX (3-3.5s), so the
 *   browser waited ~4s for the "Check your email…" response. The SMTP
 *   send now runs via `after()` from `next/server` — the response ships
 *   as soon as the token is signed, then the email goes out on the
 *   still-warm function instance. Vercel keeps the lambda alive for
 *   `after()` callbacks.
 *
 *   What stays synchronous (must complete before the response):
 *     - honeypot, IP rate-limit, validation, phone rate-limit
 *     - services-catalogue lookup (in-memory cache; only the first call
 *       of the hour pays the ~600ms network round-trip)
 *     - token signing (the URL goes in the email AND the confirm route
 *       trusts the token's serviceName + durationH to skip its own ARC
 *       lookup; if we deferred sign we'd have to defer the catalogue
 *       too, which would race the email render)
 *     - phone rate-limit recordBooking (must persist before we return so
 *       a quick second submit is rejected even before the email lands)
 *     - SMTP env-var presence check
 *
 *   What runs deferred via `after()`:
 *     - the actual SMTP send (3-3.5s of synchronous wait, gone)
 *   A failure inside the deferred block is logged but cannot affect the
 *   response — it has already been sent.
 *
 * No KV. The intent is embedded inside the token (booking-token.ts v:2);
 * if abuse becomes real we'd graduate the IP bucket to Redis/KV.
 *
 * The response is deliberately generic — we never reveal whether the
 * email exists, whether the phone is throttled, whether validation
 * passed, or whether the email actually sent. The only positive signal
 * a caller sees is the email arriving in their inbox.
 */

import { NextResponse, after } from 'next/server';
import { normalisePhone } from '../_lib/arc-client';
// Namespace import so tests can swap `fetchServices` via the module object.
import * as arcClient from '../_lib/arc-client';
import { validateBookingRequest } from '../_lib/validate';
import {
  checkRateLimit,
  checkIpRateLimit,
  recordBooking,
} from '../_lib/rate-limit';
import { logBooking } from '../_lib/log';
import {
  signToken,
  fingerprint,
  generateTokenId,
  type TokenIntent,
  type TokenPayload,
} from '@/lib/booking-token';
import { sendConfirmationEmail } from '@/lib/booking-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE: Record<string, string> = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json',
};

// The single response we use for *every* success-shaped outcome — honeypot
// trip, real success, "we tried but email failed". Bots and abusers get
// the same payload the legitimate customer gets, and learn nothing.
const GENERIC_SUCCESS = {
  ok: true,
  pending: true,
  message: 'Check your email for the confirmation link.',
} as const;

const TOKEN_TTL_MS = 30 * 60 * 1000;

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { ...PRIVATE_NO_STORE, ...extraHeaders },
  });
}

/** Read the client IP from the standard proxy headers Vercel sets. */
function readClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    // First hop is the original client; subsequent hops are proxies.
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return '';
}

function deriveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://mbrme.com';
}

// ---------------------------------------------------------------------------
// Test seam — `after()` from next/server only runs inside a real request
// scope; in unit tests we need to capture and invoke the callback so we
// can assert on the email send. `_setAfterRunnerForTests` lets a test
// inject a runner that records callbacks instead of deferring them.
// ---------------------------------------------------------------------------

type AfterRunner = (cb: () => Promise<void> | void) => void;

let afterRunner: AfterRunner | null = null;

export function _setAfterRunnerForTests(fn: AfterRunner): void {
  afterRunner = fn;
}

export function _resetAfterRunnerForTests(): void {
  afterRunner = null;
}

function scheduleDeferred(cb: () => Promise<void> | void): void {
  if (afterRunner) {
    afterRunner(cb);
    return;
  }
  // In a real Next 15 request, `after()` defers until the response is sent.
  // It must be called *within* the request execution context — calling it
  // outside throws. We are inside the POST handler, so this is safe.
  after(cb);
}

// ---------------------------------------------------------------------------
// Deferred-work helper — extracted so the synchronous path stays readable
// and so a unit test can assert on it directly.
// ---------------------------------------------------------------------------

interface DeferredEmailArgs {
  intent: TokenIntent;
  /** Already-signed token, baked into the confirm URL. */
  confirmUrl: string;
  /** SMTP config — already validated as present at request time. */
  smtp: { host: string; port: number; user: string; password: string };
  fromEmail: string;
  /** Request start time, for end-to-end deferred-latency logging. */
  t0: number;
}

export async function _runDeferredEmail(args: DeferredEmailArgs): Promise<void> {
  try {
    const sendResult = await sendConfirmationEmail({
      smtp: args.smtp,
      fromEmail: args.fromEmail,
      to: args.intent.email,
      firstName: args.intent.firstName,
      serviceName: args.intent.serviceName,
      requestedAt: args.intent.timeStartMs,
      confirmUrl: args.confirmUrl,
    });

    if (!sendResult.ok) {
      logBooking({
        event: 'booking.request.deferred_email_fail',
        phone: args.intent.phone,
        serviceId: args.intent.serviceId,
        latencyMs: Date.now() - args.t0,
        status: 200,
        reason: sendResult.error,
      });
      return;
    }

    logBooking({
      event: 'booking.request.deferred_email_ok',
      phone: args.intent.phone,
      serviceId: args.intent.serviceId,
      latencyMs: Date.now() - args.t0,
      status: 200,
    });
  } catch (e) {
    // sendConfirmationEmail already catches its own errors, but defensive:
    // never let a throw propagate out of the deferred callback.
    logBooking({
      event: 'booking.request.deferred_email_fail',
      phone: args.intent.phone,
      serviceId: args.intent.serviceId,
      latencyMs: Date.now() - args.t0,
      status: 200,
      reason: e instanceof Error ? e.message : String(e),
    });
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<NextResponse> {
  const t0 = Date.now();

  // ----- 1. Parse JSON ------------------------------------------------------
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    logBooking({ event: 'booking.request.bad_json', status: 400 });
    return jsonResponse(
      {
        ok: false,
        code: 'VALIDATION',
        field: 'body',
        message: 'request body must be valid JSON',
      },
      400,
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
      400,
    );
  }
  const body = raw as Record<string, unknown>;

  // ----- 2. Honeypot --------------------------------------------------------
  // If `_website` was filled, silently return success. Never tip off the bot.
  const honey = body['_website'];
  if (typeof honey === 'string' && honey.trim().length > 0) {
    logBooking({
      event: 'booking.request.honeypot',
      status: 200,
      reason: 'honeypot tripped',
    });
    return jsonResponse(GENERIC_SUCCESS, 200);
  }

  // ----- 3. IP rate-limit ---------------------------------------------------
  const ip = readClientIp(req);
  const ipRl = checkIpRateLimit(ip, 10);
  if (!ipRl.allowed) {
    logBooking({
      event: 'booking.request.ip_rate_limit',
      status: 200,
      reason: `ip=${ip} retryAfterMs=${ipRl.retryAfterMs}`,
    });
    // Generic response — don't reveal the cap.
    return jsonResponse(GENERIC_SUCCESS, 200);
  }

  // ----- 4. Normalise phone (so the validator can verify the digits-only form)
  if (typeof body.ownerPhone === 'string') {
    const norm = normalisePhone(body.ownerPhone);
    if (norm) body.ownerPhone = norm;
  }

  // Validator requires `description` + `preferredLanguage`. The public form
  // doesn't send either — fill defaults like the agent route does.
  if (typeof body.description !== 'string' || !body.description.trim()) {
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    body.description = notes || 'Customer-initiated booking request';
  }
  if (typeof body.preferredLanguage !== 'string') {
    body.preferredLanguage = 'en';
  }

  // ----- 5. Validate --------------------------------------------------------
  const parsed = validateBookingRequest(body);
  if ('code' in parsed) {
    logBooking({
      event: 'booking.request.invalid',
      status: 200,
      code: 'VALIDATION',
      reason: `${parsed.field}: ${parsed.message}`,
    });
    // Generic response — don't help a probe learn which fields are required.
    return jsonResponse(GENERIC_SUCCESS, 200);
  }

  // ----- 6. Phone rate-limit ------------------------------------------------
  const phoneRl = checkRateLimit(parsed.ownerPhone);
  if (!phoneRl.allowed) {
    logBooking({
      event: 'booking.request.phone_rate_limit',
      phone: parsed.ownerPhone,
      status: 200,
      reason: `retryAfterMs=${phoneRl.retryAfterMs}`,
    });
    return jsonResponse(GENERIC_SUCCESS, 200);
  }

  // ----- 7. Look up the service (for the email body + token intent) -------
  // The catalogue is cached for 1h in arc-client, so this is fast for all
  // calls after the first of the hour. Kept synchronous because:
  //   (a) the confirm route trusts the token's serviceName + durationH and
  //       passes `skipServicesFetch: true` to ARC — if we leave them blank
  //       at sign time the confirm submit can't name the service correctly.
  //   (b) unknown service id is a hard bail; better to fail before signing
  //       a token we'll never use.
  let serviceName: string | null = null;
  let durationH = 1;
  try {
    const services = await arcClient.fetchServices();
    const svc = services.find((s) => s.id === parsed.serviceId);
    if (svc) {
      serviceName = svc.title;
      durationH = Math.max(1, svc.duration_h);
    }
  } catch (e) {
    logBooking({
      event: 'booking.request.services_fail',
      status: 200,
      reason: e instanceof Error ? e.message : String(e),
    });
    // Don't fail — we can still send a useful email without the title; the
    // confirm step will re-fetch services and detect UNKNOWN_SERVICE if the
    // ID is bad.
  }
  if (!serviceName) {
    // If the lookup failed or the service id is bogus, exit success-shaped.
    // The confirm step would have caught it too; better to bail before we
    // burn an email send and a token sign.
    logBooking({
      event: 'booking.request.unknown_service',
      phone: parsed.ownerPhone,
      serviceId: parsed.serviceId,
      status: 200,
    });
    return jsonResponse(GENERIC_SUCCESS, 200);
  }

  // ----- 8. Build the TokenIntent + sign ------------------------------------
  const plate =
    typeof body.vehiclePlate === 'string' ? body.vehiclePlate.trim() : '';
  const notes =
    typeof body.notes === 'string' && body.notes.trim()
      ? body.notes.trim()
      : undefined;

  const intent: TokenIntent = {
    serviceId: parsed.serviceId,
    serviceName,
    timeStartMs: parsed.timeStartMs,
    durationH,
    firstName: parsed.ownerNameFirst,
    lastName: parsed.ownerNameLast,
    phone: parsed.ownerPhone,
    email: parsed.ownerEmail,
    vehicleYear: parsed.vehicleYear,
    vehicleMake: parsed.vehicleMake,
    vehicleModel: parsed.vehicleModel,
    plate: plate || undefined,
    notes,
  };

  const secret = process.env.BOOKING_TOKEN_SECRET;
  if (!secret) {
    logBooking({
      event: 'booking.request.no_token_secret',
      status: 500,
      reason: 'BOOKING_TOKEN_SECRET not set',
    });
    // Hard 500 — this is our own misconfiguration, not the caller's. The
    // generic success would otherwise silently swallow the misconfig.
    return jsonResponse(
      { ok: false, code: 'CONFIG', message: 'Booking is temporarily unavailable.' },
      500,
    );
  }

  const now = Date.now();
  const fp = await fingerprint(intent.phone, intent.email);
  const payload: TokenPayload = {
    v: 2,
    id: generateTokenId(),
    iat: now,
    exp: now + TOKEN_TTL_MS,
    fp,
    intent,
  };
  let token: string;
  try {
    token = await signToken(payload, secret);
  } catch (e) {
    logBooking({
      event: 'booking.request.sign_fail',
      status: 500,
      reason: e instanceof Error ? e.message : String(e),
    });
    return jsonResponse(
      { ok: false, code: 'CONFIG', message: 'Booking is temporarily unavailable.' },
      500,
    );
  }

  // ----- 9. SMTP env presence (synchronous — fail fast on misconfig) ------
  const smtpHost = process.env.BOOKING_SMTP_HOST;
  const smtpPortRaw = process.env.BOOKING_SMTP_PORT;
  const smtpUser = process.env.BOOKING_SMTP_USER;
  const smtpPass = process.env.BOOKING_SMTP_PASSWORD;
  const fromEmail = process.env.BOOKING_FROM_EMAIL;
  if (!smtpHost || !smtpPortRaw || !smtpUser || !smtpPass || !fromEmail) {
    logBooking({
      event: 'booking.request.no_smtp_configured',
      status: 200,
      reason: 'one or more BOOKING_SMTP_* env vars missing',
    });
    // Return generic 200 so an outside observer can't probe for misconfig.
    return jsonResponse(GENERIC_SUCCESS, 200);
  }
  const smtpPort = Number(smtpPortRaw);
  const confirmUrl = `${deriveSiteUrl()}/book/confirm?token=${encodeURIComponent(token)}`;

  // ----- 10. Consume phone rate-limit credit (synchronous) -----------------
  // Must happen before we return so a quick second submit is rejected even
  // if the deferred email is still in flight. Whether the email transport
  // succeeds or not, this request consumed a credit — otherwise a flapping
  // SMTP makes the limiter trivially bypassable.
  recordBooking(parsed.ownerPhone);

  // ----- 11. Defer the SMTP send -------------------------------------------
  scheduleDeferred(() =>
    _runDeferredEmail({
      intent,
      confirmUrl,
      smtp: {
        host: smtpHost,
        port: Number.isFinite(smtpPort) ? smtpPort : 587,
        user: smtpUser,
        password: smtpPass,
      },
      fromEmail,
      t0,
    }),
  );

  logBooking({
    event: 'booking.request.ok',
    phone: parsed.ownerPhone,
    serviceId: parsed.serviceId,
    latencyMs: Date.now() - t0,
    status: 200,
  });
  return jsonResponse(GENERIC_SUCCESS, 200);
}
