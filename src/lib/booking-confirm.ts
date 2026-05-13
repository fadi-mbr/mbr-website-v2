/**
 * Public-flow confirm logic — extracted from the `/book/confirm` page so the
 * verify + submit dance is exercisable without spinning up the Next.js
 * rendering layer.
 *
 * Flow:
 *   1. verifyToken(token, secret) — pure signature + expiry check.
 *   2. On success, project the token's embedded `TokenIntent` to a
 *      `BookingIntent` and hand it to `submitConfirmedBooking`. No Chatwoot
 *      options because the public path doesn't carry a conversation.
 *
 * The result discriminates `kind` so the page can dispatch to a render
 * branch without re-deriving the failure mode. `error.reason` mirrors
 * `verifyToken`'s reasons + adds `submit-failed` for the ARC stage.
 *
 * Storage: NONE — the booking intent is fully embedded in the HMAC-signed
 * token. A re-clicked link can re-trigger an ARC submit; advisors handle
 * the resulting duplicate manually (decision 2026-05-12).
 */

import { verifyToken, type TokenIntent } from "./booking-token";
import type { BookingIntent } from "./booking-types";
import { submitConfirmedBooking, type SubmitResult } from "./booking-arc-submit";

export type ConfirmResult =
  | {
      kind: "ok";
      intent: TokenIntent;
      tokenId: string;
      arcAppointmentId?: number;
      confirmAt: string;
      serviceName: string;
      estimatedDuration: number;
    }
  | {
      kind: "invalid-token";
      reason: "malformed" | "bad-signature" | "expired" | "bad-version";
    }
  | {
      kind: "submit-failed";
      intent: TokenIntent;
      tokenId: string;
      code: SubmitResult extends { ok: false; code: infer C } ? C : never;
      message: string;
    };

function intentToBookingIntent(t: TokenIntent): BookingIntent {
  return {
    serviceId: t.serviceId,
    serviceName: t.serviceName,
    timeStartMs: t.timeStartMs,
    durationH: t.durationH,
    firstName: t.firstName,
    lastName: t.lastName,
    phone: t.phone,
    email: t.email,
    vehicleYear: t.vehicleYear,
    vehicleMake: t.vehicleMake,
    vehicleModel: t.vehicleModel,
    plate: t.plate ?? "",
    notes: t.notes,
  };
}

export async function confirmFromToken(
  token: string,
  secretHex: string,
): Promise<ConfirmResult> {
  const verified = await verifyToken(token, secretHex);
  if (!verified.ok) {
    return { kind: "invalid-token", reason: verified.reason };
  }
  const intent = verified.payload.intent;
  // Skip the ARC services-catalogue fetch — the token already carries
  // serviceName + durationH, and every MBR service is INSPECTION today.
  // Saves ~500-1000ms per confirm submit. See SubmitOptions docstring.
  const result = await submitConfirmedBooking(intentToBookingIntent(intent), {
    skipServicesFetch: true,
  });
  if (!result.ok) {
    return {
      kind: "submit-failed",
      intent,
      tokenId: verified.payload.id,
      code: result.code as ConfirmResult & { kind: "submit-failed" } extends {
        code: infer C;
      }
        ? C
        : never,
      message: result.message,
    };
  }
  return {
    kind: "ok",
    intent,
    tokenId: verified.payload.id,
    arcAppointmentId: result.arcAppointmentId,
    confirmAt: result.confirmAt,
    serviceName: result.serviceName,
    estimatedDuration: result.estimatedDuration,
  };
}
