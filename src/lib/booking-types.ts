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
}

export interface BookingSuccess {
  ok: true;
  confirmAt: number;
  serviceName: string;
  estimatedDuration: number;   // hours
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
