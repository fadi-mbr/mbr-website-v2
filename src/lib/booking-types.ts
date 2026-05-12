/**
 * Booking API contract — types only.
 *
 * Source of truth: /tmp/booking_api_contract.md (agent G's locked contract).
 * Keep field names byte-for-byte in sync with the server.
 */

export type Lang = 'en' | 'ar';

export interface BookingService {
  id: number;
  title: string;
  type: string;
  duration_h: number;
  price: number | null;
  templateType?: string;
}

export interface BookingSlot {
  startMs: number;
  endMs: number;
  workerName: string;
}

export interface BookingRequest {
  ownerEmail: string;
  ownerNameFirst: string;
  ownerNameLast: string;
  ownerPhone: string;          // E.164 digits, no '+'
  serviceId: number;
  description: string;
  timeStartMs: number;
  vehicleYear: number;
  vehicleModel: string;
  vehicleMake: string;
  vehicleTrim?: string;
  mileage?: number;
  concern?: string;
  preferredLanguage: Lang;
  /**
   * Optional Chatwoot conversation ID. Present when the booking originated
   * from the embedded Dashboard App, or when an after-hours auto-reply
   * link carried the conversation context through. Server uses it to post
   * a confirmation back into the conversation thread.
   */
  conversationId?: number;
}

export interface BookingSuccess {
  ok: true;
  confirmAt: number;
  serviceName: string;
  estimatedDuration: number;   // hours
  /** True iff the booking included a conversationId AND Chatwoot was notified. */
  chatwootNotified?: boolean;
}

export type BookingErrorCode =
  | 'VALIDATION'
  | 'PHONE_PROBLEM'
  | 'SLOT_TAKEN'
  | 'RATE_LIMIT'
  | 'ARC_DOWN';

export interface BookingError {
  code: BookingErrorCode;
  field?: string;
  message?: string;
}

/**
 * Server-side booking intent — the canonical shape passed into
 * `submitConfirmedBooking`. Originally lived in `booking-kv.ts` when we
 * planned to persist intents via Vercel KV; the KV layer was removed in
 * v2.0 (stateless HMAC tokens replace it), but the type stays here as the
 * shared contract between the agent route, the confirm helper, and the
 * ARC submission helper.
 */
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
