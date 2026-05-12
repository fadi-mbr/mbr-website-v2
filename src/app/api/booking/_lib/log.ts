/**
 * Structured logging for booking routes.
 *
 * Emits JSON lines to stderr (Vercel captures these as logs). NEVER log
 * the full body or raw PII. Phone numbers are hashed (first 16 hex chars
 * of sha256) so we can correlate without storing them.
 */

import { createHash } from "node:crypto";

export interface BookingLogFields {
  event: string;
  phone?: string;
  serviceId?: number | null;
  latencyMs?: number;
  status?: number;
  code?: string;
  reason?: string;
}

export function hashPhone(phone: string): string {
  return createHash("sha256").update(phone).digest("hex").slice(0, 16);
}

export function logBooking(fields: BookingLogFields): void {
  const { phone, ...rest } = fields;
  const entry = {
    ts: new Date().toISOString(),
    scope: "booking-api",
    ...rest,
    ...(phone ? { phone_hash: hashPhone(phone) } : {}),
  };
  console.error(JSON.stringify(entry));
}
