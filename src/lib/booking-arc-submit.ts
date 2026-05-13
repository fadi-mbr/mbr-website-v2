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
  fetchWeekAppointmentsRaw as defaultFetchWeekAppointmentsRaw,
  submitBooking as defaultSubmitBooking,
  type ArcWeekAppointmentRecord,
  type BookingBody,
  type ServiceSummary,
} from "@/app/api/booking/_lib/arc-client";
import { getWorkerToken as defaultGetWorkerToken } from "@/app/api/booking/_lib/worker-token-cache";
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
  /** Populated when the post-submit week lookup matched the new appointment. */
  arcAppointmentId?: number;
  /** Populated when the post-submit week lookup matched the new appointment. */
  arcRepairId?: number;
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
    | "SLOT_UNAVAILABLE"
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
  /**
   * If true, skip the ARC services-catalogue fetch and trust the intent's
   * own `serviceName` + `durationH`. ARC's `serviceType` field is hardcoded
   * to `INSPECTION` — currently every MBR-facing service in the catalogue
   * is INSPECTION, so the fetch is dead weight on the confirm path
   * (~500-1000ms per submit). If MBR adds non-INSPECTION services, flip
   * this off on the confirm path (or thread the type through the token).
   */
  skipServicesFetch?: boolean;
}

/** Hardcoded ARC serviceType used when `skipServicesFetch` is on. */
const DEFAULT_ARC_SERVICE_TYPE = "INSPECTION";

// ---------------------------------------------------------------------------
// Test seams — swap real ARC + Chatwoot clients for in-memory fakes.
// Production callers never touch these.
// ---------------------------------------------------------------------------

export interface ArcDeps {
  fetchServices: typeof defaultFetchServices;
  submitBooking: typeof defaultSubmitBooking;
  /** Worker-auth lookup for newly-created appointment IDs. Best-effort. */
  fetchWeekAppointmentsRaw?: typeof defaultFetchWeekAppointmentsRaw;
  /** Worker-token acquisition for the lookup. Best-effort. */
  getWorkerToken?: typeof defaultGetWorkerToken;
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
  fetchWeekAppointmentsRaw: defaultFetchWeekAppointmentsRaw,
  getWorkerToken: defaultGetWorkerToken,
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
    fetchWeekAppointmentsRaw: defaultFetchWeekAppointmentsRaw,
    getWorkerToken: defaultGetWorkerToken,
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

/**
 * Best-effort: after a successful ARC submit, hit the worker-auth
 * /appointment/week/workers endpoint and try to find the just-created
 * appointment by matching ownerEmail + timeStartMs. Returns
 * {appointmentId, repairId} when matched, or null on any failure.
 *
 * Never throws — the caller wraps this in a try and treats failure as
 * "lookup returned nothing". A failure here must not affect the OK status
 * of the booking itself; the appointment exists in ARC regardless.
 *
 * Cost: ~300-500ms (one worker-token-cached call + one week-workers fetch).
 * Worth it because the alternative is a fuzzy customer-search URL in the
 * sales-team notification, which is much less actionable than a direct
 * appointment link.
 */
async function lookupArcIds(
  intent: BookingIntent,
): Promise<{ arcAppointmentId?: number; arcRepairId?: number } | null> {
  const fetchWeek = arcDeps.fetchWeekAppointmentsRaw;
  const getToken = arcDeps.getWorkerToken;
  if (!fetchWeek || !getToken) return null;
  try {
    const token = await getToken();
    const dateAnchor = new Date(intent.timeStartMs).toISOString().slice(0, 10);
    const records = await fetchWeek(token, dateAnchor);
    const targetEmail = intent.email.trim().toLowerCase();
    const match = records.find((r: ArcWeekAppointmentRecord) => {
      if (r.startMs !== intent.timeStartMs) return false;
      if (!r.ownerEmail) return false;
      return r.ownerEmail.trim().toLowerCase() === targetEmail;
    });
    if (!match) return null;
    return {
      arcAppointmentId: match.appointmentId,
      arcRepairId: match.repairId,
    };
  } catch {
    return null;
  }
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
  //    Skipped on the confirm path: the v:2 token already carries
  //    serviceName + durationH, and every MBR service is INSPECTION today.
  let service: ServiceSummary;
  if (options.skipServicesFetch) {
    service = {
      id: intent.serviceId,
      title: intent.serviceName,
      type: DEFAULT_ARC_SERVICE_TYPE,
      duration_h: intent.durationH,
      price: null,
      templateType: null,
    };
  } else {
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
    const found = services.find((s) => s.id === intent.serviceId);
    if (!found) {
      return {
        ok: false,
        code: "UNKNOWN_SERVICE",
        message:
          "Unknown serviceId — fetch /api/booking/services for the current list.",
      };
    }
    service = found;
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
      // ARC returns 400 NO_TIME when the requested slot isn't actually
      // available — the day is fully booked, the technician is off, or
      // ARC has the day marked unavailable for the service. The /slots
      // endpoint can show false positives because it derives from open
      // hours, not real availability. Surface a useful message instead
      // of the generic "system unavailable".
      if (
        e.code === "NO_TIME" ||
        (typeof e.code === "string" && /NO_TIME|TIME_NOT_AVAILABLE/.test(e.code))
      ) {
        return {
          ok: false,
          code: "SLOT_UNAVAILABLE",
          message:
            "That time slot isn't actually available — the shop is fully booked or closed at that hour. Please pick a different day or time, or message us on WhatsApp at +971 56 501 5800 and we'll find a slot for you.",
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

  // 2b. Best-effort: try to capture ARC IDs from the worker-auth week
  // endpoint so the booking-notify path can render a precise approve
  // link instead of a fuzzy customer-search fallback. Failure here is
  // non-fatal — we just leave the IDs undefined and let the notifier
  // fall back.
  let arcAppointmentId: number | undefined;
  let arcRepairId: number | undefined;
  const lookupT0 = Date.now();
  const ids = await lookupArcIds(intent);
  if (ids) {
    arcAppointmentId = ids.arcAppointmentId;
    arcRepairId = ids.arcRepairId;
    logFn({
      event: "booking.arc_id_lookup_ok",
      status: 200,
      latencyMs: Date.now() - lookupT0,
      reason: `appt=${arcAppointmentId ?? '?'} ro=${arcRepairId ?? '?'}`,
    });
  } else {
    logFn({
      event: "booking.arc_id_lookup_miss",
      status: 200,
      latencyMs: Date.now() - lookupT0,
    });
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
    arcAppointmentId,
    arcRepairId,
    confirmAt: new Date(intent.timeStartMs).toISOString(),
    serviceName: service.title,
    estimatedDuration: service.duration_h,
  };
}
