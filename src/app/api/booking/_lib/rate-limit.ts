/**
 * In-memory per-phone rate limiter for the booking endpoint.
 *
 * Module-scoped Map → survives across requests within the same serverless
 * instance, resets on cold-start. Good enough for v1; a Redis-backed limit
 * is a Phase-2 chore if booking abuse becomes a thing.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const phoneToLastTs = new Map<string, number>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

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

/** Test-only: clear state. Not exported via public route surface. */
export function _resetForTests(): void {
  phoneToLastTs.clear();
}
