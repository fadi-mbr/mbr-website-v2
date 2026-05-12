/**
 * In-memory rate limiter for the booking endpoints.
 *
 * Two buckets, both module-scoped (survive across requests within the same
 * serverless instance, reset on cold-start):
 *
 *   1. per-phone, 1/hour     — used by the agent endpoint and the public
 *      /api/booking/request endpoint to stop the same customer phone
 *      from being booked twice in an hour.
 *
 *   2. per-IP, 10/hour       — only used by the public /api/booking/request
 *      endpoint as a low-friction abuse cap. Hits the same IP across
 *      distinct phones (or distinct attempts before the email click).
 *
 * Good enough for v1; the KV-backed limiter (`booking-rate-limit-kv.ts`)
 * is NOT wired here. If booking abuse becomes a real problem we'd switch
 * the IP bucket to Redis so the cap survives cold-starts.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const phoneToLastTs = new Map<string, number>();

// IP bucket — keyed by IP string. Stores a sliding array of recent epoch-ms
// hits within the window. We deliberately keep the implementation simple
// (linear scan + array splice) because the per-IP volume is capped by
// the limiter itself.
const ipToHits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

/** Per-phone, 1/hour. Preserved from earlier PRs — agent endpoint depends on this signature. */
export function checkRateLimit(phone: string, now: number = Date.now()): RateLimitResult {
  const last = phoneToLastTs.get(phone);
  if (last !== undefined && now - last < WINDOW_MS) {
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - last) };
  }
  return { allowed: true, retryAfterMs: 0 };
}

export function recordBooking(phone: string, now: number = Date.now()): void {
  phoneToLastTs.set(phone, now);
}

/**
 * Per-IP rolling cap. Default 10 hits / hour. Returns allowed=false once
 * the cap is reached for the current rolling window; the caller doesn't
 * need to call a separate `record*` helper — this one is read-write by
 * design (records on the allowed call). That's deliberate: the public
 * endpoint should consume an IP credit on every accepted submission,
 * regardless of whether the downstream send succeeded, so a flapping
 * upstream can't be used to bypass the cap.
 */
export function checkIpRateLimit(
  ip: string,
  maxPerHour: number = 10,
  now: number = Date.now(),
): RateLimitResult {
  if (!ip) {
    // Without an IP we can't enforce — allow (the phone bucket still applies).
    return { allowed: true, retryAfterMs: 0 };
  }
  const cutoff = now - WINDOW_MS;
  const arr = ipToHits.get(ip) ?? [];
  // Drop expired entries first.
  let firstFresh = 0;
  while (firstFresh < arr.length && arr[firstFresh] < cutoff) firstFresh++;
  const fresh = firstFresh === 0 ? arr : arr.slice(firstFresh);
  if (fresh.length >= maxPerHour) {
    // Oldest fresh hit determines how long until a slot opens up.
    const oldest = fresh[0];
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) };
  }
  fresh.push(now);
  ipToHits.set(ip, fresh);
  return { allowed: true, retryAfterMs: 0 };
}

/** Test-only: clear state. Not exported via public route surface. */
export function _resetForTests(): void {
  phoneToLastTs.clear();
  ipToHits.clear();
}
