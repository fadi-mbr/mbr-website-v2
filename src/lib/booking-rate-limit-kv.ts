/**
 * NOT WIRED in v2.0 (2026-05-12 decision: skip Upstash).
 * The booking flow uses stateless HMAC tokens (booking-token.ts v:2) instead.
 * This module is preserved for future analytics or if we re-introduce KV later.
 *
 * KV-backed rate-limit for the booking endpoints.
 *
 * Replaces the in-memory `src/app/api/booking/_lib/rate-limit.ts` for the
 * v2 routes. Function names match the existing surface so the swap to the
 * new routes is a single import-path change in PR C / PR D.
 *
 * Two buckets:
 *   - phone: 1 booking / hour per UAE phone (default)
 *   - ip:    10 booking-request POSTs / hour per IP (public flow only)
 *
 * NOTE: the existing in-memory rate-limit returns `retryAfterMs`; the
 * KV-backed limit returns `retryAfterSec` because that's what HTTP `Retry-After`
 * actually wants. Callers using the new module convert accordingly.
 */

import { incrementRateLimit, getRateLimitCount } from "./booking-kv";

const PHONE_BUCKET_PROD = "rl:phone:";
const IP_BUCKET_PROD = "rl:ip:";

/**
 * Tests can override the prefix to keep wipe semantics scoped to a single
 * test run — `_resetForTests()` wipes only keys under the test-only prefix.
 */
let phoneBucket = PHONE_BUCKET_PROD;
let ipBucket = IP_BUCKET_PROD;

const DEFAULT_PHONE_WINDOW_SEC = 60 * 60;
const DEFAULT_PHONE_MAX = 1;

const DEFAULT_IP_WINDOW_SEC = 60 * 60;
const DEFAULT_IP_MAX = 10;

export interface RateLimitOptions {
  /** Override the per-window allowance. Defaults: phone=1, ip=10. */
  max?: number;
  /** Override the window in seconds. Default 3600 (1 hour). */
  windowSec?: number;
  /** Agent retry: count but always allow. */
  force?: boolean;
}

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSec?: number;
}

// ---------------------------------------------------------------------------
// Phone bucket — same signature shape as the legacy in-memory module so the
// integration step in PR C / D is a one-line import swap.
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  phone: string,
  options: RateLimitOptions = {},
): Promise<RateLimitDecision> {
  const max = options.max ?? DEFAULT_PHONE_MAX;
  const windowSec = options.windowSec ?? DEFAULT_PHONE_WINDOW_SEC;
  const count = await incrementRateLimit(phoneBucket, phone, windowSec);
  if (options.force) return { allowed: true };
  if (count > max) {
    return { allowed: false, retryAfterSec: windowSec };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// IP bucket — public /api/booking/request only.
// ---------------------------------------------------------------------------

export async function checkIpRateLimit(
  ip: string,
  maxPerHour: number = DEFAULT_IP_MAX,
): Promise<RateLimitDecision> {
  const windowSec = DEFAULT_IP_WINDOW_SEC;
  const count = await incrementRateLimit(ipBucket, ip, windowSec);
  if (count > maxPerHour) {
    return { allowed: false, retryAfterSec: windowSec };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Inspection helper — current count without bumping it.
// ---------------------------------------------------------------------------

export async function getPhoneCount(phone: string): Promise<number> {
  return getRateLimitCount(phoneBucket, phone);
}

export async function getIpCount(ip: string): Promise<number> {
  return getRateLimitCount(ipBucket, ip);
}

// ---------------------------------------------------------------------------
// Test-only — see the booking-kv test seam for wiring in-memory storage.
// We don't truly "delete" keys from the underlying KV here; the test seam
// already wipes the in-memory KV. This function exists so tests using this
// module's API match the legacy `_resetForTests` shape.
// ---------------------------------------------------------------------------

const TEST_PHONE_BUCKET = "test:rl:phone:";
const TEST_IP_BUCKET = "test:rl:ip:";

export async function _resetForTests(): Promise<void> {
  // Caller (test) should also reset the booking-kv in-memory fake. We just
  // switch prefixes back to the production values so a subsequent prod
  // run isn't poisoned.
  phoneBucket = PHONE_BUCKET_PROD;
  ipBucket = IP_BUCKET_PROD;
}

/** Tests can opt-in to test-only prefixes via this seam. */
export function _useTestPrefixesForTests(): void {
  phoneBucket = TEST_PHONE_BUCKET;
  ipBucket = TEST_IP_BUCKET;
}
