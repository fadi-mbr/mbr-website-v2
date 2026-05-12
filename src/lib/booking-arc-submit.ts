/**
 * Shared "build BookingBody + submit to ARC + (optionally) notify Chatwoot"
 * helper.
 *
 * Used by:
 *   - `/api/booking/agent`  — direct agent-initiated submit (PR C)
 *   - `/api/booking/confirm` — magic-link landing (PR D)
 *
 * Failure modes return discriminated `{ ok: false, code, message }` so the
 * route can map straight to JSON without a try/catch ladder.
 *
 * Chatwoot post-confirmation is best-effort: failure logs but never
 * downgrades the success response — the booking is the source of truth.
 *
 * Tests inject fakes for the ARC and Chatwoot clients via the module-seam
 * helpers below.
 */

import type { BookingIntent } from "./booking-types";
import {
  ArcError,
  fetchServices as defaultFetchServices,
  submitBooking as defaultSubmitBooking,
  type BookingBody,
  type ServiceSummary,
} from "@/app/api/booking/_lib/arc-client";
import {
  loadChatwootConfig as defaultLoadChatwootConfig,
  renderConfirmationMessage as defaultRenderConfirmationMessage,
  sendConversationMessage as defaultSendConversationMessage,
  setConversationCustomAttributes as defaultSetConversationCustomAttributes,
  type ChatwootConfig,
} from "./chatwoot-client";

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

export interface SubmitOk {
  ok: true;
  arcAppointmentId?: number;
  confirmAt: string;
  serviceName: string;
  estimatedDuration: number;
}

export interface SubmitErr {
  ok: false;
  code:
    | "SERVICE_LOOKUP_FAILED"
    | "UNKNOWN_SERVICE"
    | "PHONE_PROBLEM"
    | "SLOT_TAKEN"
    | "EXISTING_CUSTOMER"
    | "ARC_DOWN";
  message: string;
}

export type SubmitResult = SubmitOk | SubmitErr;

export interface SubmitOptions {
  chatwoot?: {
    conversationId: number;
    contactId: number;
  };
}

// ---------------------------------------------------------------------------
// Test seams — swap real ARC + Chatwoot clients for in-memory fakes.
// Production callers never touch these.
// ---------------------------------------------------------------------------

export interface ArcDeps {
  fetchServices: typeof defaultFetchServices;
  submitBooking: typeof defaultSubmitBooking;
}

export interface ChatwootDeps {
  loadConfig: () => ChatwootConfig | null;
  renderMessage: typeof defaultRenderConfirmationMessage;
  sendMessage: typeof defaultSendConversationMessage;
  setAttrs: typeof defaultSetConversationCustomAttributes;
}

let arcDeps: ArcDeps = {
  fetchServices: defaultFetchServices,
  submitBooking: defaultSubmitBooking,
};

let chatwootDeps: ChatwootDeps = {
  loadConfig: defaultLoadChatwootConfig,
  renderMessage: defaultRenderConfirmationMessage,
  sendMessage: defaultSendConversationMessage,
  setAttrs: defaultSetConversationCustomAttributes,
};

export function _setArcDepsForTests(d: Partial<ArcDeps>): void {
  arcDeps = { ...arcDeps, ...d };
}

export function _setChatwootDepsForTests(d: Partial<ChatwootDeps>): void {
  chatwootDeps = { ...chatwootDeps, ...d };
}

export function _resetDepsForTests(): void {
  arcDeps = {
    fetchServices: defaultFetchServices,
    submitBooking: defaultSubmitBooking,
  };
  chatwootDeps = {
    loadConfig: defaultLoadChatwootConfig,
    renderMessage: defaultRenderConfirmationMessage,
    sendMessage: defaultSendConversationMessage,
    setAttrs: defaultSetConversationCustomAttributes,
  };
}

// ---------------------------------------------------------------------------
// Logger — swappable for tests so we don't pollute stdout.
// ---------------------------------------------------------------------------

export type LogFn = (entry: Record<string, unknown>) => void;

let logFn: LogFn = (entry) => {
  // Keep the shape compatible with the rest of the codebase's logBooking.
  try {
    console.log(JSON.stringify({ ...entry, ts: new Date().toISOString() }));
  } catch {
    /* swallow */
  }
};

export function _setLoggerForTests(fn: LogFn): void {
  logFn = fn;
}

export function _resetLoggerForTests(): void {
  logFn = (entry) => {
    try {
      console.log(JSON.stringify({ ...entry, ts: new Date().toISOString() }));
    } catch {
      /* swallow */
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildBookingBody(
  intent: BookingIntent,
  service: ServiceSummary,
): BookingBody {
  const durationMs = Math.max(1, service.duration_h) * 3600 * 1000;
  return {
    ownerEmail: intent.email,
    ownerNameFirst: intent.firstName,
    ownerNameLast: intent.lastName,
    ownerPhone: intent.phone,
    serviceType: service.type,
    description: intent.notes ?? "",
    timeStart: intent.timeStartMs,
    timeEnd: intent.timeStartMs + durationMs,
    vehicleYear: intent.vehicleYear,
    vehicleModel: intent.vehicleModel,
    vehicleMake: intent.vehicleMake,
    // ARC's /public/appointment rejects empty vehicleTrim with
    // EMPTY_MODEL_TRIM. The wizard form has no trim input, so default it
    // to the model (matches ARC's UI which uses the model as the trim
    // when none is provided).
    vehicleTrim: intent.vehicleModel || "Base",
    mileage: 0,
    vehicleId: null,
    concern: intent.plate ? `Plate: ${intent.plate}` : "",
  };
}

async function postChatwoot(
  conversationId: number,
  intent: BookingIntent,
  service: ServiceSummary,
): Promise<void> {
  const cfg = chatwootDeps.loadConfig();
  if (!cfg) {
    logFn({
      event: "chatwoot.skip_no_token",
      status: 200,
      reason: "CHATWOOT_ADMIN_API_TOKEN not set",
    });
    return;
  }
  const confirmAt = new Date(intent.timeStartMs).toISOString();
  const content = chatwootDeps.renderMessage({
    customerFirstName: intent.firstName,
    serviceName: service.title,
    slotStartIso: confirmAt,
    durationH: service.duration_h,
  });
  const msgRes = await chatwootDeps.sendMessage(cfg, {
    conversationId,
    content,
    messageType: "outgoing",
    isPrivate: false,
  });
  if (!msgRes.ok) {
    logFn({
      event: "chatwoot.send_message_fail",
      status: msgRes.status,
      reason: msgRes.reason,
    });
    return;
  }
  const attrs: Record<string, string | number> = {
    booking_status: "confirmed",
    last_booking_at: new Date().toISOString(),
  };
  const attrRes = await chatwootDeps.setAttrs(cfg, conversationId, attrs);
  if (!attrRes.ok) {
    logFn({
      event: "chatwoot.set_attrs_fail",
      status: attrRes.status,
      reason: attrRes.reason,
    });
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function submitConfirmedBooking(
  intent: BookingIntent,
  options: SubmitOptions = {},
): Promise<SubmitResult> {
  // 1. Service lookup — bail with SERVICE_LOOKUP_FAILED on transport errors.
  let services: ServiceSummary[];
  try {
    services = await arcDeps.fetchServices();
  } catch (e) {
    logFn({
      event: "booking.services_fail",
      status: 502,
      reason: e instanceof Error ? e.message : String(e),
    });
    return {
      ok: false,
      code: "SERVICE_LOOKUP_FAILED",
      message: "Service catalogue unavailable, please retry shortly.",
    };
  }

  const service = services.find((s) => s.id === intent.serviceId);
  if (!service) {
    return {
      ok: false,
      code: "UNKNOWN_SERVICE",
      message:
        "Unknown serviceId — fetch /api/booking/services for the current list.",
    };
  }

  // 2. ARC submit.
  const body = buildBookingBody(intent, service);
  try {
    await arcDeps.submitBooking(body, intent.serviceId);
  } catch (e) {
    if (e instanceof ArcError) {
      if (
        e.code === "PHONE_PROBLEM" ||
        (e.status === 400 && /phone/i.test(JSON.stringify(e.payload || "")))
      ) {
        return {
          ok: false,
          code: "PHONE_PROBLEM",
          message:
            "We can't reach this phone number — please double-check or try another.",
        };
      }
      if (e.status === 409) {
        return {
          ok: false,
          code: "SLOT_TAKEN",
          message: "That slot was just booked — please pick another.",
        };
      }
      // ARC's /public/appointment refuses to create a duplicate owner
      // record when the email is already on file. The endpoint has no
      // "attach to existing owner" mode — that's a worker-token endpoint
      // we haven't reverse-engineered yet. Until then, fall back to a
      // WhatsApp handoff for repeat customers.
      if (e.code === "ALREADY_EXISTS_EMAIL") {
        return {
          ok: false,
          code: "EXISTING_CUSTOMER",
          message:
            "Looks like you've booked with us before. Please message us on WhatsApp at +971 56 501 5800 to confirm your slot — we'll attach it to your existing record.",
        };
      }
      // Similar guard for phone duplicates (ARC sometimes reports both).
      if (
        e.status === 400 &&
        typeof e.code === "string" &&
        /ALREADY_EXISTS/.test(e.code)
      ) {
        return {
          ok: false,
          code: "EXISTING_CUSTOMER",
          message:
            "Looks like you've booked with us before. Please message us on WhatsApp at +971 56 501 5800 to confirm your slot — we'll attach it to your existing record.",
        };
      }
    }
    logFn({
      event: "booking.arc_down",
      status: 502,
      reason: e instanceof Error ? e.message : String(e),
    });
    return {
      ok: false,
      code: "ARC_DOWN",
      message: "Booking system unavailable, please retry shortly.",
    };
  }

  // 3. Chatwoot — best-effort, never fails the response.
  if (options.chatwoot) {
    try {
      await postChatwoot(options.chatwoot.conversationId, intent, service);
    } catch (e) {
      logFn({
        event: "chatwoot.notify_threw",
        status: 200,
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    ok: true,
    confirmAt: new Date(intent.timeStartMs).toISOString(),
    serviceName: service.title,
    estimatedDuration: service.duration_h,
  };
}
