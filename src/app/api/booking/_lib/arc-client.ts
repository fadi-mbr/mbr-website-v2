/**
 * ARC public-endpoint client for the mbrme.com booking flow.
 *
 * Server-side only. All calls go to ARC's public surface, which is
 * `shopToken`-gated rather than worker-authenticated, so we never carry
 * customer-level credentials here.
 *
 * Reference contract: mbr-brain/planning/it-modernization/arc-appointment-write-test.md
 * Mirror implementation: mbr-brain/skills/mbr-arc-mcp/src/tools/booking.ts
 */

const BASE = process.env.MBR_ARC_BASE || "https://autorepaircloud.com/auto-rest";
export const SHOP_ID = Number(process.env.MBR_ARC_SHOP_ID || 104945);
export const SHOP_TOKEN =
  process.env.MBR_ARC_SHOP_TOKEN || "b/AMKISNzrs/FF1ZqOg3ag==";

const FETCH_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Types (kept minimal — only what we actually surface to callers)
// ---------------------------------------------------------------------------

export interface ArcService {
  id: number;
  title: string;
  type: string;
  duration: number; // hours
  price?: number;
  templateType?: string;
}

export interface ServiceSummary {
  id: number;
  title: string;
  type: string;
  duration_h: number;
  price: number | null;
  templateType: string | null;
}

export interface ArcShopTimetableDay {
  /** Day of week as 0=Sun ... 6=Sat (ARC convention varies — we normalise in caller). */
  dayOfWeek?: number;
  /** Minutes past midnight, shop tz. */
  openTime?: number | null;
  closeTime?: number | null;
  isOpen?: boolean;
  /** ARC also sometimes returns labels — keep as opaque. */
  [k: string]: unknown;
}

export interface ArcShopTimetable {
  days?: ArcShopTimetableDay[];
  /** Some shops use a flat `mon/tue/...` shape — we tolerate both. */
  [k: string]: unknown;
}

export interface BookingBody {
  ownerEmail: string;
  ownerNameFirst: string;
  ownerNameLast: string;
  ownerPhone: string;
  serviceType: string;
  description: string;
  timeStart: number;
  timeEnd: number;
  vehicleYear: number;
  vehicleModel: string;
  vehicleMake: string;
  vehicleTrim: string;
  mileage: number;
  vehicleId: number | null;
  concern: string;
}

/** Error thrown for any non-2xx ARC response. Carries the parsed payload if any. */
export class ArcError extends Error {
  status: number;
  code?: string;
  payload?: unknown;
  constructor(message: string, opts: { status: number; code?: string; payload?: unknown }) {
    super(message);
    this.name = "ArcError";
    this.status = opts.status;
    this.code = opts.code;
    this.payload = opts.payload;
  }
}

// ---------------------------------------------------------------------------
// Fetch wrapper (timeout + structured error)
// ---------------------------------------------------------------------------

async function arcFetch(
  path: string,
  init: RequestInit & { qs?: Record<string, string | number> } = {}
): Promise<Response> {
  const { qs, ...rest } = init;
  // ARC's shopToken (e.g. `b/AMKISNzrs/FF1ZqOg3ag==`) contains `/` and `=`
  // characters. The standard URL class percent-encodes those, and ARC's
  // server doesn't accept the encoded form for the appointment write path
  // (the encoded token passes auth but fails downstream slot validation
  // with NO_TIME). Build the query string manually so the shopToken stays
  // literal. Other qs values are still encoded normally.
  const otherQs: string[] = [];
  if (qs) {
    for (const [k, v] of Object.entries(qs)) {
      otherQs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  const query =
    `shopToken=${SHOP_TOKEN}` +
    (otherQs.length > 0 ? `&${otherQs.join("&")}` : "");
  const finalUrl = `${BASE}${path}?${query}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(finalUrl, {
      ...rest,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(rest.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractArcCode(payload: unknown): string | undefined {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (typeof p.code === "string") return p.code;
    if (typeof p.type === "string") return p.type;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Service catalogue — 1h in-memory cache
// ---------------------------------------------------------------------------

const SERVICES_TTL_MS = 60 * 60 * 1000;
let cachedServices: { fetchedAt: number; data: ServiceSummary[] } | null = null;

function mapService(raw: ArcService): ServiceSummary {
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ""),
    type: String(raw.type ?? ""),
    duration_h: Number(raw.duration ?? 0),
    price: typeof raw.price === "number" ? raw.price : null,
    templateType:
      typeof raw.templateType === "string" ? raw.templateType : null,
  };
}

export async function fetchServices(opts: { fresh?: boolean } = {}): Promise<
  ServiceSummary[]
> {
  const now = Date.now();
  if (
    !opts.fresh &&
    cachedServices &&
    now - cachedServices.fetchedAt < SERVICES_TTL_MS
  ) {
    return cachedServices.data;
  }
  const res = await arcFetch("/public/appointment/services");
  const payload = await parseJsonSafe(res);
  if (!res.ok) {
    throw new ArcError("ARC services fetch failed", {
      status: res.status,
      code: extractArcCode(payload),
      payload,
    });
  }
  if (!Array.isArray(payload)) {
    throw new ArcError("ARC services returned non-array payload", {
      status: 500,
      payload,
    });
  }
  const mapped = (payload as ArcService[])
    .map(mapService)
    .sort((a, b) => a.duration_h - b.duration_h);
  cachedServices = { fetchedAt: now, data: mapped };
  return mapped;
}

// ---------------------------------------------------------------------------
// Shop timetable — 1h in-memory cache
// ---------------------------------------------------------------------------

const TIMETABLE_TTL_MS = 60 * 60 * 1000;
let cachedTimetable: { fetchedAt: number; data: ArcShopTimetable } | null = null;

export async function fetchTimetable(opts: {
  fresh?: boolean;
} = {}): Promise<ArcShopTimetable> {
  const now = Date.now();
  if (
    !opts.fresh &&
    cachedTimetable &&
    now - cachedTimetable.fetchedAt < TIMETABLE_TTL_MS
  ) {
    return cachedTimetable.data;
  }
  const res = await arcFetch("/public/shop/timetable");
  const payload = await parseJsonSafe(res);
  if (!res.ok) {
    throw new ArcError("ARC timetable fetch failed", {
      status: res.status,
      code: extractArcCode(payload),
      payload,
    });
  }
  const data = (payload as ArcShopTimetable) ?? {};
  cachedTimetable = { fetchedAt: now, data };
  return data;
}

// ---------------------------------------------------------------------------
// Booking submission
// ---------------------------------------------------------------------------

/**
 * POST /public/appointment?shopToken=&templateId=
 *
 * Returns HTTP 200 with an empty body on success.
 *
 * On failure, throws {@link ArcError} with the parsed error payload. The
 * caller should map known codes:
 *  - PHONE_PROBLEM      → 400 PHONE_PROBLEM to the client
 *  - SLOT_TAKEN / 409   → 409 SLOT_TAKEN
 *  - anything else 4xx  → 502 ARC_DOWN
 */
export async function submitBooking(
  body: BookingBody,
  templateId: number
): Promise<void> {
  const res = await arcFetch("/public/appointment", {
    method: "POST",
    body: JSON.stringify(body),
    qs: { templateId },
  });
  if (res.ok) return;
  const payload = await parseJsonSafe(res);
  throw new ArcError(`ARC POST /public/appointment failed: ${res.status}`, {
    status: res.status,
    code: extractArcCode(payload),
    payload,
  });
}

// ---------------------------------------------------------------------------
// Worker-authenticated endpoints (real availability)
// ---------------------------------------------------------------------------
//
// These bypass the public `shopToken` surface and authenticate as an ARC
// worker user. They are used server-side only — never expose worker creds
// or the worker bearer token to the browser.

/**
 * Minimal fetch wrapper for ARC worker-auth endpoints. Unlike `arcFetch`,
 * this does NOT inject `shopToken` and uses the raw `Token: <token>` header
 * (ARC's worker-auth convention — NOT `Authorization: Bearer`).
 */
async function arcWorkerFetch(
  path: string,
  init: RequestInit & {
    qs?: Record<string, string | number>;
    token?: string;
  } = {}
): Promise<Response> {
  const { qs, token, ...rest } = init;
  const qsParts: string[] = [];
  if (qs) {
    for (const [k, v] of Object.entries(qs)) {
      qsParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  const finalUrl =
    `${BASE}${path}` + (qsParts.length > 0 ? `?${qsParts.join("&")}` : "");

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(finalUrl, {
      ...rest,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(token ? { Token: token } : {}),
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(rest.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

/**
 * GET /auth/worker/login?phone=...&code=...
 *
 * Returns `{ token }` on success. Throws `ArcError` on failure.
 *
 * NOTE: ARC expects phone + code as QUERY parameters, not request body.
 */
export async function workerLogin(
  phone: string,
  password: string
): Promise<{ token: string }> {
  const res = await arcWorkerFetch("/auth/worker/login", {
    qs: { phone, code: password },
  });
  const payload = await parseJsonSafe(res);
  if (!res.ok) {
    throw new ArcError(`ARC worker login failed: ${res.status}`, {
      status: res.status,
      code: extractArcCode(payload),
      payload,
    });
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as { token?: unknown }).token !== "string"
  ) {
    throw new ArcError("ARC worker login: missing token in response", {
      status: 500,
      payload,
    });
  }
  return { token: (payload as { token: string }).token };
}

export interface BookedInterval {
  startMs: number;
  endMs: number;
  workerId: number;
}

interface ArcWeekAppointment {
  timeStart?: number;
  timeEnd?: number;
  [k: string]: unknown;
}

interface ArcWeekWorkerEntry {
  worker?: { id?: number; nameFirst?: string; [k: string]: unknown };
  appointments?: ArcWeekAppointment[];
  [k: string]: unknown;
}

interface ArcWeekDay {
  name?: string;
  date?: string;
  data?: ArcWeekWorkerEntry[];
  [k: string]: unknown;
}

interface ArcWeekResponse {
  workerWeek?: ArcWeekDay[];
  [k: string]: unknown;
}

/**
 * Build the YYYY-MM-DD anchor list (Sun..Sat) for the week containing
 * `dateStr`. ARC's API treats Sunday as the start of the week.
 */
function weekDatesFor(dateStr: string): {
  sun: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
} {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`weekDatesFor: invalid date ${dateStr}`);
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  // Anchor at UTC noon to avoid DST/TZ edge cases — only DOW matters.
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dow = anchor.getUTCDay(); // 0=Sun..6=Sat
  const sunday = new Date(anchor.getTime() - dow * 24 * 60 * 60 * 1000);
  const out: Record<string, string> = {};
  const labels = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday.getTime() + i * 24 * 60 * 60 * 1000);
    const yy = day.getUTCFullYear();
    const mm = String(day.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(day.getUTCDate()).padStart(2, "0");
    out[labels[i]] = `${yy}-${mm}-${dd}`;
  }
  return out as {
    sun: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
  };
}

/**
 * GET /appointment/week/workers?sun=...&mon=...&...&sat=...
 *
 * Returns a Map of `YYYY-MM-DD` → list of `BookedInterval`s, flattened
 * across all workers. (Any worker free at a given slot = the slot is
 * available for the shop.)
 *
 * Throws `ArcError` on non-2xx (caller should fall back to candidates-only).
 */
export async function fetchWeekBookedIntervals(
  workerToken: string,
  dateAnchor: string
): Promise<Map<string, BookedInterval[]>> {
  const week = weekDatesFor(dateAnchor);
  const res = await arcWorkerFetch("/appointment/week/workers", {
    token: workerToken,
    qs: week,
  });
  const payload = await parseJsonSafe(res);
  if (!res.ok) {
    throw new ArcError(`ARC week-workers fetch failed: ${res.status}`, {
      status: res.status,
      code: extractArcCode(payload),
      payload,
    });
  }
  const out = new Map<string, BookedInterval[]>();
  const p = (payload ?? {}) as ArcWeekResponse;
  const days = Array.isArray(p.workerWeek) ? p.workerWeek : [];
  for (const day of days) {
    if (!day || typeof day.date !== "string") continue;
    const intervals: BookedInterval[] = [];
    const data = Array.isArray(day.data) ? day.data : [];
    for (const entry of data) {
      const workerId = Number(entry?.worker?.id ?? 0);
      const appts = Array.isArray(entry?.appointments) ? entry.appointments : [];
      for (const a of appts) {
        const s = typeof a?.timeStart === "number" ? a.timeStart : null;
        const e = typeof a?.timeEnd === "number" ? a.timeEnd : null;
        if (s === null || e === null || !(e > s)) continue;
        intervals.push({ startMs: s, endMs: e, workerId });
      }
    }
    out.set(day.date, intervals);
  }
  return out;
}

// Exported for unit tests only — does not affect production behaviour.
export const _weekDatesForTests = weekDatesFor;

// ---------------------------------------------------------------------------
// Phone normalisation
// ---------------------------------------------------------------------------

import { normalizeIntlPhone } from "@/lib/booking-phone";

/**
 * Normalise a user-typed phone to E.164 digits-only form (no leading `+`).
 *
 * Defaults to UAE (+971) when the input doesn't carry a country code.
 * Accepts other-country numbers when the input starts with `+<cc>` or
 * `00<cc>`. ARC's `/public/appointment` endpoint accepts digits-only
 * phones; we don't need to prepend a `+`.
 *
 * Delegates to {@link normalizeIntlPhone} so the client and server agree
 * on what counts as a valid phone.
 */
export function normalisePhone(input: string): string | null {
  return normalizeIntlPhone(input);
}
