/**
 * Vercel KV wrapper for the public booking flow.
 *
 * Three responsibilities:
 *   1) Persist a `BookingIntent` against a UUID token-id with TTL.
 *   2) Atomic one-shot "claim" on the magic-link click — prevents a
 *      double-click or re-shared link from creating two ARC records.
 *   3) Rate-limit counter ops (used by `booking-rate-limit-kv.ts`).
 *
 * Tests mock `@vercel/kv` by replacing this module's import via Node's
 * module cache; see `src/app/api/booking/__tests__/kv.test.ts`.
 *
 * Key prefix convention:
 *   booking:<id>            → JSON BookingIntent, 30-min TTL (1800s)
 *   booking:<id>:claim      → "1" sentinel, 1-hour TTL (3600s)
 *   rl:phone:<phone>        → integer counter, 1-hour TTL
 *   rl:ip:<ip>              → integer counter, 1-hour TTL
 */

import { kv as defaultKv } from "@vercel/kv";

export interface BookingIntent {
  serviceId: number;
  serviceName: string;
  timeStartMs: number;
  durationH: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  plate: string;
  notes?: string;
}

/**
 * Narrow shape we actually use from `@vercel/kv`. Both the real client and
 * the in-memory test fake implement this surface.
 */
export interface KvLike {
  get<T = unknown>(key: string): Promise<T | null>;
  set(
    key: string,
    value: unknown,
    options?: { ex?: number; nx?: boolean },
  ): Promise<"OK" | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

// `kv` from @vercel/kv is exported as a typed singleton — cast to the narrow
// interface so we don't depend on the wider type surface that the upstream
// package exposes.
let activeKv: KvLike = defaultKv as unknown as KvLike;

/**
 * Test seam — swap the underlying client for an in-memory fake.
 * Production code paths never call this.
 */
export function _setKvForTests(impl: KvLike): void {
  activeKv = impl;
}

/** Reset to the real `@vercel/kv` singleton. */
export function _resetKvForTests(): void {
  activeKv = defaultKv as unknown as KvLike;
}

// ---------------------------------------------------------------------------
// Booking intent
// ---------------------------------------------------------------------------

const INTENT_PREFIX = "booking:";

function intentKey(id: string): string {
  return `${INTENT_PREFIX}${id}`;
}

function claimKey(id: string): string {
  return `${INTENT_PREFIX}${id}:claim`;
}

/** Fetch a stored booking intent. Returns null when missing or expired. */
export async function getBookingIntent(id: string): Promise<BookingIntent | null> {
  const raw = await activeKv.get<BookingIntent>(intentKey(id));
  return raw ?? null;
}

/** Persist a booking intent with TTL (seconds). */
export async function setBookingIntent(
  id: string,
  intent: BookingIntent,
  ttlSec: number,
): Promise<void> {
  await activeKv.set(intentKey(id), intent, { ex: ttlSec });
}

/**
 * Atomic one-shot claim. Returns `true` only for the first caller to set
 * the claim key; subsequent callers see `false`. Implemented via `SET ... NX EX`.
 */
export async function claimBookingIntent(
  id: string,
  ttlSec: number,
): Promise<boolean> {
  const res = await activeKv.set(claimKey(id), "1", { nx: true, ex: ttlSec });
  return res === "OK";
}

// ---------------------------------------------------------------------------
// Rate-limit counters
// ---------------------------------------------------------------------------

function rateKey(bucket: string, key: string): string {
  return `${bucket}${key}`;
}

/**
 * Increment a counter; if this is the first hit in the window, set the TTL.
 * Returns the post-increment count.
 */
export async function incrementRateLimit(
  bucket: string,
  key: string,
  windowSec: number,
): Promise<number> {
  const fullKey = rateKey(bucket, key);
  const count = await activeKv.incr(fullKey);
  if (count === 1) {
    await activeKv.expire(fullKey, windowSec);
  }
  return count;
}

/** Read the current counter for a bucket+key. Returns 0 if missing. */
export async function getRateLimitCount(
  bucket: string,
  key: string,
): Promise<number> {
  const v = await activeKv.get<number | string>(rateKey(bucket, key));
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
