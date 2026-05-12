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
// Phone normalisation
// ---------------------------------------------------------------------------

const UAE_PHONE_RE = /^971\d{9}$/;

/**
 * Normalise a user-typed phone to UAE E.164 digits-only form (`971XXXXXXXXX`).
 *
 * Rules:
 *  - Strip all non-digit characters (drops `+`, spaces, dashes, parens).
 *  - If the result starts with `00971`, drop the `00`.
 *  - If it starts with `0` (local UAE prefix), drop the `0` and prepend `971`.
 *  - If it's exactly 9 digits starting with `5`, prepend `971`.
 *  - If it's exactly 12 digits starting with `971`, accept as-is.
 *  - Anything else → return `null` (caller surfaces a VALIDATION 400).
 */
export function normalisePhone(input: string): string | null {
  if (typeof input !== "string") return null;
  let digits = input.replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.startsWith("00971")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "971" + digits.slice(1);
  } else if (/^5\d{8}$/.test(digits)) {
    digits = "971" + digits;
  }
  return UAE_PHONE_RE.test(digits) ? digits : null;
}
