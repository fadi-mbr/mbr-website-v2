/**
 * POST /api/booking
 *
 * Submits a customer-facing booking to ARC's public appointment endpoint.
 *
 * Flow:
 *  1) Parse JSON body.
 *  2) Normalise phone to UAE E.164 digits-only form.
 *  3) Validate the rest (Zod-free hand-rolled validator).
 *  4) Per-phone rate limit (1 booking / 60 min, in-memory).
 *  5) Look up the requested service to derive `serviceType` + `duration_h`.
 *  6) POST to ARC. Map known error codes:
 *       PHONE_PROBLEM → 400 PHONE_PROBLEM
 *       409           → 409 SLOT_TAKEN
 *       any other 4xx → 502 ARC_DOWN
 *  7) On success, return `{ ok, confirmAt, serviceName, estimatedDuration, message }`.
 *
 * Contract: mbr-brain/planning/it-modernization/arc-appointment-write-test.md
 */

import { NextResponse } from "next/server";
import {
  fetchServices,
  submitBooking,
  normalisePhone,
  ArcError,
  type BookingBody,
} from "./_lib/arc-client";
import { validateBookingRequest } from "./_lib/validate";
import { checkRateLimit, recordBooking } from "./_lib/rate-limit";
import { logBooking } from "./_lib/log";
import { notifyChatwoot } from "./notify-chatwoot/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_NO_STORE: Record<string, string> = {
  "Cache-Control": "private, no-store",
  "Content-Type": "application/json",
};

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {}
): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { ...PRIVATE_NO_STORE, ...extraHeaders },
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  const t0 = Date.now();

  // ----- 1. Parse JSON
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    logBooking({ event: "booking.bad_json", status: 400 });
    return jsonResponse(
      { code: "VALIDATION", field: "body", message: "request body must be valid JSON" },
      400
    );
  }

  // ----- 2. Normalise phone BEFORE validation
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.ownerPhone === "string") {
      const normalised = normalisePhone(obj.ownerPhone);
      if (normalised) obj.ownerPhone = normalised;
    }
  }

  // ----- 3. Validate
  const parsed = validateBookingRequest(raw);
  if ("code" in parsed) {
    logBooking({
      event: "booking.invalid",
      status: 400,
      code: "VALIDATION",
      reason: `${parsed.field}: ${parsed.message}`,
    });
    return jsonResponse(parsed, 400);
  }

  // ----- 4. Rate limit
  const rl = checkRateLimit(parsed.ownerPhone);
  if (!rl.allowed) {
    logBooking({
      event: "booking.rate_limit",
      phone: parsed.ownerPhone,
      status: 429,
    });
    return jsonResponse(
      {
        code: "RATE_LIMIT",
        message: "Only one booking per phone per hour. Please call us if this is urgent.",
        retryAfterSec: Math.ceil(rl.retryAfterMs / 1000),
      },
      429,
      { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) }
    );
  }

  // ----- 5. Service lookup
  let services;
  try {
    services = await fetchServices();
  } catch (e) {
    logBooking({
      event: "booking.services_fail",
      phone: parsed.ownerPhone,
      status: 502,
      code: e instanceof ArcError ? e.code : "UNKNOWN",
      reason: e instanceof Error ? e.message : String(e),
    });
    return jsonResponse(
      { code: "ARC_DOWN", message: "Service catalogue unavailable, please retry shortly." },
      502
    );
  }

  const service = services.find((s) => s.id === parsed.serviceId);
  if (!service) {
    logBooking({
      event: "booking.bad_service",
      phone: parsed.ownerPhone,
      serviceId: parsed.serviceId,
      status: 400,
    });
    return jsonResponse(
      {
        code: "VALIDATION",
        field: "serviceId",
        message: "Unknown serviceId — fetch /api/booking/services for the current list.",
      },
      400
    );
  }

  // ----- 6. Build ARC body and submit
  const durationMs = Math.max(1, service.duration_h) * 3600 * 1000;
  const arcBody: BookingBody = {
    ownerEmail: parsed.ownerEmail,
    ownerNameFirst: parsed.ownerNameFirst,
    ownerNameLast: parsed.ownerNameLast,
    ownerPhone: parsed.ownerPhone,
    serviceType: service.type,
    description: parsed.description,
    timeStart: parsed.timeStartMs,
    timeEnd: parsed.timeStartMs + durationMs,
    vehicleYear: parsed.vehicleYear,
    vehicleModel: parsed.vehicleModel,
    vehicleMake: parsed.vehicleMake,
    vehicleTrim: parsed.vehicleTrim ?? "",
    mileage: parsed.mileage ?? 0,
    vehicleId: null,
    concern: parsed.concern ?? "",
  };

  try {
    await submitBooking(arcBody, parsed.serviceId);
  } catch (e) {
    if (e instanceof ArcError) {
      // PHONE_PROBLEM → bubble through as 400
      if (e.code === "PHONE_PROBLEM" || (e.status === 400 && /phone/i.test(JSON.stringify(e.payload || "")))) {
        logBooking({
          event: "booking.phone_problem",
          phone: parsed.ownerPhone,
          serviceId: parsed.serviceId,
          latencyMs: Date.now() - t0,
          status: 400,
          code: "PHONE_PROBLEM",
        });
        return jsonResponse(
          {
            code: "PHONE_PROBLEM",
            message: "We can't reach this phone number — please double-check or try another.",
          },
          400
        );
      }
      // Slot conflict
      if (e.status === 409) {
        logBooking({
          event: "booking.slot_taken",
          phone: parsed.ownerPhone,
          serviceId: parsed.serviceId,
          latencyMs: Date.now() - t0,
          status: 409,
          code: "SLOT_TAKEN",
        });
        return jsonResponse(
          {
            code: "SLOT_TAKEN",
            message: "That slot was just booked — please pick another.",
          },
          409
        );
      }
    }
    logBooking({
      event: "booking.arc_down",
      phone: parsed.ownerPhone,
      serviceId: parsed.serviceId,
      latencyMs: Date.now() - t0,
      status: 502,
      code: e instanceof ArcError ? e.code : "UNKNOWN",
      reason: e instanceof Error ? e.message : String(e),
    });
    return jsonResponse(
      { code: "ARC_DOWN", message: "Booking system unavailable, please retry shortly." },
      502
    );
  }

  // ----- 7. Success
  recordBooking(parsed.ownerPhone);
  const confirmAt = new Date(parsed.timeStartMs).toISOString();
  const estimatedDuration = `${service.duration_h}h`;

  logBooking({
    event: "booking.ok",
    phone: parsed.ownerPhone,
    serviceId: parsed.serviceId,
    latencyMs: Date.now() - t0,
    status: 200,
  });

  // ----- 7a. Best-effort Chatwoot notification
  // When the request carried a conversationId (booking originated from the
  // embedded Dashboard App, or from a magic-link auto-reply that passed it
  // through), post a confirmation message back into the conversation. NEVER
  // let this affect the response — booking already succeeded.
  let chatwootNotified = false;
  if (parsed.conversationId) {
    try {
      const res = await notifyChatwoot({
        conversationId: parsed.conversationId,
        serviceName: service.title,
        slotStartIso: confirmAt,
        durationH: service.duration_h,
        customerFirstName: parsed.ownerNameFirst,
      });
      chatwootNotified = res.chatwoot_notified;
    } catch (e) {
      logBooking({
        event: "chatwoot.notify_threw",
        status: 200,
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return jsonResponse(
    {
      ok: true,
      confirmAt,
      serviceName: service.title,
      estimatedDuration,
      message:
        parsed.preferredLanguage === "ar"
          ? "تم استلام طلب الحجز. سنتواصل معك لتأكيد الموعد."
          : "Booking received. We'll contact you to confirm the appointment.",
      chatwootNotified,
    },
    200
  );
}
