/**
 * Hand-rolled validator for the booking POST body.
 *
 * No new dependency (Zod is not in the repo). We surface the first failure
 * as `{ code:"VALIDATION", field, message }` to match the contract.
 */

export interface BookingRequest {
  ownerEmail: string;
  ownerNameFirst: string;
  ownerNameLast: string;
  ownerPhone: string;
  serviceId: number;
  description: string;
  timeStartMs: number;
  vehicleYear: number;
  vehicleModel: string;
  vehicleMake: string;
  vehicleTrim?: string;
  mileage?: number;
  concern?: string;
  preferredLanguage: "en" | "ar";
  /** Optional Chatwoot conversation ID (positive integer). */
  conversationId?: number;
}

export interface ValidationError {
  code: "VALIDATION";
  field: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function err(field: string, message: string): ValidationError {
  return { code: "VALIDATION", field, message };
}

function reqStr(
  obj: Record<string, unknown>,
  field: string,
  min: number,
  max: number
): string | ValidationError {
  const v = obj[field];
  if (typeof v !== "string") return err(field, `${field} must be a string`);
  const trimmed = v.trim();
  if (trimmed.length < min)
    return err(field, `${field} must be at least ${min} character(s)`);
  if (trimmed.length > max)
    return err(field, `${field} must be at most ${max} character(s)`);
  return trimmed;
}

function reqInt(
  obj: Record<string, unknown>,
  field: string,
  min: number,
  max: number
): number | ValidationError {
  const v = obj[field];
  if (typeof v !== "number" || !Number.isFinite(v) || !Number.isInteger(v)) {
    return err(field, `${field} must be an integer`);
  }
  if (v < min) return err(field, `${field} must be >= ${min}`);
  if (v > max) return err(field, `${field} must be <= ${max}`);
  return v;
}

function optStr(
  obj: Record<string, unknown>,
  field: string,
  max: number
): string | undefined | ValidationError {
  const v = obj[field];
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string") return err(field, `${field} must be a string`);
  if (v.length > max) return err(field, `${field} must be at most ${max} characters`);
  return v;
}

function optInt(
  obj: Record<string, unknown>,
  field: string,
  min: number,
  max: number
): number | undefined | ValidationError {
  const v = obj[field];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "number" || !Number.isFinite(v) || !Number.isInteger(v)) {
    return err(field, `${field} must be an integer`);
  }
  if (v < min) return err(field, `${field} must be >= ${min}`);
  if (v > max) return err(field, `${field} must be <= ${max}`);
  return v;
}

/**
 * Validate the parsed JSON body. Returns a `BookingRequest` on success,
 * or a `ValidationError` on the first failure.
 *
 * The caller is responsible for phone normalisation BEFORE calling this
 * (so the `ownerPhone` we see is already digits-only).
 */
export function validateBookingRequest(
  raw: unknown
): BookingRequest | ValidationError {
  if (!isPlainObject(raw)) return err("body", "request body must be a JSON object");

  const ownerEmail = reqStr(raw, "ownerEmail", 3, 254);
  if (typeof ownerEmail !== "string") return ownerEmail;
  if (!EMAIL_RE.test(ownerEmail))
    return err("ownerEmail", "ownerEmail must be a valid email address");

  const ownerNameFirst = reqStr(raw, "ownerNameFirst", 1, 50);
  if (typeof ownerNameFirst !== "string") return ownerNameFirst;
  const ownerNameLast = reqStr(raw, "ownerNameLast", 1, 80);
  if (typeof ownerNameLast !== "string") return ownerNameLast;

  const ownerPhoneRaw = raw["ownerPhone"];
  if (typeof ownerPhoneRaw !== "string" || !/^971\d{9}$/.test(ownerPhoneRaw)) {
    return err(
      "ownerPhone",
      "ownerPhone must be a UAE E.164 digits-only string matching ^971\\d{9}$ (caller normalises first)"
    );
  }

  const serviceId = reqInt(raw, "serviceId", 1, Number.MAX_SAFE_INTEGER);
  if (typeof serviceId !== "number") return serviceId;

  const description = reqStr(raw, "description", 1, 500);
  if (typeof description !== "string") return description;

  const timeStartMs = reqInt(raw, "timeStartMs", 0, Number.MAX_SAFE_INTEGER);
  if (typeof timeStartMs !== "number") return timeStartMs;
  // 30-min future floor enforced here (contract requirement)
  if (timeStartMs <= Date.now() + 30 * 60 * 1000) {
    return err("timeStartMs", "timeStartMs must be at least 30 minutes in the future");
  }

  const currentYear = new Date().getFullYear();
  const vehicleYear = reqInt(raw, "vehicleYear", 1980, currentYear + 1);
  if (typeof vehicleYear !== "number") return vehicleYear;

  const vehicleModel = reqStr(raw, "vehicleModel", 1, 50);
  if (typeof vehicleModel !== "string") return vehicleModel;
  const vehicleMake = reqStr(raw, "vehicleMake", 1, 50);
  if (typeof vehicleMake !== "string") return vehicleMake;

  const vehicleTrim = optStr(raw, "vehicleTrim", 50);
  if (vehicleTrim !== undefined && typeof vehicleTrim !== "string") return vehicleTrim;

  const mileage = optInt(raw, "mileage", 0, 2_000_000);
  if (mileage !== undefined && typeof mileage !== "number") return mileage;

  const concern = optStr(raw, "concern", 500);
  if (concern !== undefined && typeof concern !== "string") return concern;

  const lang = raw["preferredLanguage"];
  if (lang !== "en" && lang !== "ar") {
    return err("preferredLanguage", "preferredLanguage must be 'en' or 'ar'");
  }

  // Optional conversationId — Chatwoot conversation this booking is linked to.
  // Accept positive integer; silently ignore anything else (we'd rather not
  // hard-fail a booking because a wonky embed pushed garbage in here).
  let conversationId: number | undefined;
  const cid = raw["conversationId"];
  if (typeof cid === "number" && Number.isFinite(cid) && Number.isInteger(cid) && cid > 0) {
    conversationId = cid;
  }

  return {
    ownerEmail,
    ownerNameFirst,
    ownerNameLast,
    ownerPhone: ownerPhoneRaw,
    serviceId,
    description,
    timeStartMs,
    vehicleYear,
    vehicleModel,
    vehicleMake,
    vehicleTrim: vehicleTrim as string | undefined,
    mileage: mileage as number | undefined,
    concern: concern as string | undefined,
    preferredLanguage: lang,
    conversationId,
  };
}
