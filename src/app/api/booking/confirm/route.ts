/**
 * POST /api/booking/confirm — magic-link confirm endpoint.
 *
 * Called from the client-side <ConfirmInProgress> component on the
 * `/book/confirm` page so the customer sees a spinner immediately and
 * the slow ARC submit (~3-5s) happens asynchronously. Returns JSON that
 * mirrors `ConfirmResult` from `src/lib/booking-confirm.ts` 1:1, so the
 * client only has to dispatch on `kind`.
 *
 * Why POST + token-in-body (not GET + token-in-URL):
 *   - Keeps the long HMAC token out of server access logs and out of
 *     `Referer` headers that browsers leak to third-party scripts.
 *   - Allows safe retries without a URL change.
 *
 * No auth, no rate limit: the HMAC signature is the auth and the 30-minute
 * expiry caps the replay window. The advisor manually reconciles any
 * duplicates that result from a double-click (decision 2026-05-12).
 */

import { NextResponse } from 'next/server';
import { confirmFromToken } from '@/lib/booking-confirm';
import { logBooking } from '../_lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE: Record<string, string> = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json',
};

function jsonResponse(body: unknown, status: number): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: PRIVATE_NO_STORE,
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  const t0 = Date.now();

  const secret = process.env.BOOKING_TOKEN_SECRET;
  if (!secret) {
    logBooking({
      event: 'booking.confirm.no_secret_configured',
      status: 503,
      reason: 'BOOKING_TOKEN_SECRET not set',
    });
    return jsonResponse(
      {
        kind: 'submit-failed',
        code: 'ARC_DOWN',
        message:
          'Booking is temporarily unavailable. Please try again in a few minutes.',
      },
      503,
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse(
      { kind: 'invalid-token', reason: 'malformed' },
      400,
    );
  }
  if (typeof raw !== 'object' || raw === null) {
    return jsonResponse(
      { kind: 'invalid-token', reason: 'malformed' },
      400,
    );
  }
  const token = (raw as Record<string, unknown>).token;
  if (typeof token !== 'string' || token.length === 0) {
    return jsonResponse(
      { kind: 'invalid-token', reason: 'malformed' },
      400,
    );
  }

  const result = await confirmFromToken(token, secret);

  if (result.kind === 'invalid-token') {
    logBooking({
      event: 'booking.confirm.invalid_token',
      latencyMs: Date.now() - t0,
      status: 400,
      reason: result.reason,
    });
    return jsonResponse({ kind: 'invalid-token', reason: result.reason }, 400);
  }

  if (result.kind === 'submit-failed') {
    const status =
      result.code === 'SLOT_TAKEN'
        ? 409
        : result.code === 'UNKNOWN_SERVICE' ||
            result.code === 'PHONE_PROBLEM' ||
            result.code === 'EXISTING_CUSTOMER' ||
            result.code === 'SLOT_UNAVAILABLE'
          ? 400
          : 503;
    logBooking({
      event: 'booking.confirm.submit_fail',
      latencyMs: Date.now() - t0,
      status,
      code: result.code,
      reason: result.message,
    });
    return jsonResponse(
      {
        kind: 'submit-failed',
        code: result.code,
        message: result.message,
        intent: result.intent,
        tokenId: result.tokenId,
      },
      status,
    );
  }

  logBooking({
    event: 'booking.confirm.ok',
    latencyMs: Date.now() - t0,
    status: 200,
    serviceId: result.intent.serviceId,
  });
  return jsonResponse(
    {
      kind: 'ok',
      intent: result.intent,
      tokenId: result.tokenId,
      arcAppointmentId: result.arcAppointmentId,
      confirmAt: result.confirmAt,
      serviceName: result.serviceName,
      estimatedDuration: result.estimatedDuration,
    },
    200,
  );
}
