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
import { verifyToken } from '@/lib/booking-token';
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

/**
 * In-memory idempotency cache keyed by tokenId.
 *
 * React Strict Mode (and any browser retry) can fire the confirm POST
 * twice in rapid succession. Without this cache, call 1 creates the
 * appointment in ARC and call 2 then sees the slot taken and returns
 * SLOT_UNAVAILABLE — a confusing UX where the user thinks the booking
 * failed but a real record exists.
 *
 * We remember the OUTCOME of the first call per tokenId and return it
 * verbatim for any subsequent call within TTL. Token expiry is 30 min,
 * so we cache for 35 min to cover stale browser tabs that re-mount.
 *
 * Caveat: this cache is per serverless instance. Different cold-start
 * instances would see independent caches. For React StrictMode protection
 * (same request, same instance) this is sufficient. The ROOT fix for
 * cross-instance races is to make `submitConfirmedBooking` itself
 * idempotent — out of scope for this hotfix.
 */
interface CachedOutcome {
  body: unknown;
  status: number;
  cachedAt: number;
}
const CACHE_TTL_MS = 35 * 60 * 1000;
const idempotencyCache = new Map<string, CachedOutcome>();

function getCached(tokenId: string): CachedOutcome | null {
  const hit = idempotencyCache.get(tokenId);
  if (!hit) return null;
  if (Date.now() - hit.cachedAt > CACHE_TTL_MS) {
    idempotencyCache.delete(tokenId);
    return null;
  }
  return hit;
}

function setCached(tokenId: string, body: unknown, status: number): void {
  idempotencyCache.set(tokenId, { body, status, cachedAt: Date.now() });
  // Periodic GC — best effort.
  if (idempotencyCache.size > 200) {
    const cutoff = Date.now() - CACHE_TTL_MS;
    for (const [k, v] of idempotencyCache) {
      if (v.cachedAt < cutoff) idempotencyCache.delete(k);
    }
  }
}

/** Exposed for tests so a clean slate is achievable per spec. */
export function _resetIdempotencyCacheForTests(): void {
  idempotencyCache.clear();
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

  // Idempotency: if we've already processed this token, return the cached
  // outcome instead of re-submitting to ARC. Verify the signature first to
  // get the tokenId — we don't want callers to abuse the cache by sending
  // a random string and getting whatever happened to be stored there.
  const verified = await verifyToken(token, secret);
  if (verified.ok) {
    const tokenId = verified.payload.id;
    const cached = getCached(tokenId);
    if (cached) {
      logBooking({
        event: 'booking.confirm.idempotent_replay',
        latencyMs: Date.now() - t0,
        status: cached.status,
        reason: `tokenId=${tokenId}`,
      });
      return jsonResponse(cached.body, cached.status);
    }
  }

  const result = await confirmFromToken(token, secret);

  if (result.kind === 'invalid-token') {
    logBooking({
      event: 'booking.confirm.invalid_token',
      latencyMs: Date.now() - t0,
      status: 400,
      reason: result.reason,
    });
    // Don't cache invalid tokens — they have no tokenId we can trust.
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
    const body = {
      kind: 'submit-failed',
      code: result.code,
      message: result.message,
      intent: result.intent,
      tokenId: result.tokenId,
    };
    // Cache the failure outcome so a retry returns the same answer
    // (avoids double-creating an ARC record on the retry path).
    setCached(result.tokenId, body, status);
    return jsonResponse(body, status);
  }

  logBooking({
    event: 'booking.confirm.ok',
    latencyMs: Date.now() - t0,
    status: 200,
    serviceId: result.intent.serviceId,
  });
  const body = {
    kind: 'ok',
    intent: result.intent,
    tokenId: result.tokenId,
    arcAppointmentId: result.arcAppointmentId,
    confirmAt: result.confirmAt,
    serviceName: result.serviceName,
    estimatedDuration: result.estimatedDuration,
  };
  setCached(result.tokenId, body, 200);
  return jsonResponse(body, 200);
}
