/**
 * GET /api/booking/slots?date=YYYY-MM-DD&duration_h=N
 *
 * Returns proposed 30-min-aligned booking slots for the given local date
 * and requested service duration.
 *
 * V1 LIMITATION — read this before touching:
 *
 *   The full slot engine in the contract is supposed to read
 *   `/appointment/week/workers`, subtract existing appointments + open
 *   ROs, and emit only truly free per-worker slots. That endpoint is
 *   worker-authenticated (it requires a `Token:` header from a real ARC
 *   login session). We deliberately do NOT carry ARC worker credentials
 *   on the public Vercel deployment.
 *
 *   So for v1 we generate naïve candidate slots from the public shop
 *   timetable only. Server-side collision detection at booking time
 *   (`POST /public/appointment` rejects overlapping slots) is the
 *   authority — if a slot is already taken, the booking call returns
 *   the right error and the UI re-fetches.
 *
 *   TODO(booking-v2): once we move worker creds onto the server (via
 *   Infisical fetch at boot), call `/appointment/week/workers` and do
 *   proper per-worker availability subtraction.
 *
 * The shop timezone is hardcoded to Asia/Dubai (UTC+4, no DST) for v1.
 *
 * Cache: 60 seconds.
 */

import { NextResponse } from "next/server";
import { fetchTimetable, ArcError, type ArcShopTimetableDay } from "../_lib/arc-client";
import { logBooking } from "../_lib/log";

export const runtime = "nodejs";

const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;
const SLOT_STEP_MIN = 30;

// Default open hours if the timetable returns nothing parseable. Mirrors
// MBR's actual hours: Mon-Sat 09:00-19:00, Sun closed.
const DEFAULT_OPEN_MIN = 9 * 60;
const DEFAULT_CLOSE_MIN = 19 * 60;
const DEFAULT_CLOSED_DAYS = new Set([0]); // Sunday closed

interface Slot {
  startMs: number;
  endMs: number;
}

function parseDate(s: string | null): { y: number; m: number; d: number } | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    return null;
  }
  return { y, m, d };
}

/** Build an epoch-ms timestamp for the given Dubai-local Y-M-D h-min. */
function dubaiLocalToEpochMs(
  y: number,
  m: number,
  d: number,
  hour: number,
  minute: number
): number {
  // Date.UTC treats inputs as UTC; we subtract the Dubai offset so the
  // resulting epoch corresponds to the requested local wall clock.
  return Date.UTC(y, m - 1, d, hour, minute, 0) - DUBAI_OFFSET_MS;
}

/** Return Dubai-local day of week (0=Sun..6=Sat) for a given local YMD. */
function dubaiDayOfWeek(y: number, m: number, d: number): number {
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

/**
 * Best-effort timetable reader. ARC's shape varies across shops — we look
 * for a `days[]` array with per-day `dayOfWeek/openTime/closeTime/isOpen`
 * fields first, and fall back to the MBR defaults if we can't make sense
 * of the response.
 */
function resolveHoursForDay(
  timetable: unknown,
  dow: number
): { openMin: number; closeMin: number } | null {
  if (timetable && typeof timetable === "object") {
    const t = timetable as Record<string, unknown>;
    const days = Array.isArray(t.days) ? (t.days as ArcShopTimetableDay[]) : null;
    if (days) {
      const day = days.find((d) => Number(d.dayOfWeek) === dow);
      if (day) {
        if (day.isOpen === false) return null;
        const openMin =
          typeof day.openTime === "number" ? day.openTime : DEFAULT_OPEN_MIN;
        const closeMin =
          typeof day.closeTime === "number"
            ? day.closeTime
            : DEFAULT_CLOSE_MIN;
        if (openMin >= closeMin) return null;
        return { openMin, closeMin };
      }
    }
  }
  if (DEFAULT_CLOSED_DAYS.has(dow)) return null;
  return { openMin: DEFAULT_OPEN_MIN, closeMin: DEFAULT_CLOSE_MIN };
}

export async function GET(req: Request): Promise<NextResponse> {
  const t0 = Date.now();
  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date");
  const durationStr = url.searchParams.get("duration_h");

  const date = parseDate(dateStr);
  if (!date) {
    logBooking({ event: "slots.bad_date", status: 400 });
    return NextResponse.json(
      { code: "VALIDATION", field: "date", message: "date must be YYYY-MM-DD" },
      { status: 400 }
    );
  }
  const durationH = Number(durationStr);
  if (!Number.isFinite(durationH) || durationH <= 0 || durationH > 24) {
    logBooking({ event: "slots.bad_duration", status: 400 });
    return NextResponse.json(
      {
        code: "VALIDATION",
        field: "duration_h",
        message: "duration_h must be a positive number <= 24",
      },
      { status: 400 }
    );
  }

  let timetable: unknown = null;
  try {
    timetable = await fetchTimetable();
  } catch (e) {
    // Soft-fail: fall back to defaults so the UI still renders something.
    logBooking({
      event: "slots.timetable_fail",
      status: 200,
      code: e instanceof ArcError ? e.code : "UNKNOWN",
      reason: e instanceof Error ? e.message : String(e),
    });
  }

  const dow = dubaiDayOfWeek(date.y, date.m, date.d);
  const hours = resolveHoursForDay(timetable, dow);

  if (!hours) {
    logBooking({
      event: "slots.closed",
      latencyMs: Date.now() - t0,
      status: 200,
    });
    return new NextResponse(JSON.stringify([] as Slot[]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  }

  const slots: Slot[] = [];
  const durationMs = durationH * 60 * 60 * 1000;
  const minStartMs = Date.now() + 30 * 60 * 1000; // 30-min future floor

  // We snap to 30-min boundaries starting at the open time, and emit any
  // slot whose END falls on or before close time.
  const closeEpochMs = dubaiLocalToEpochMs(
    date.y,
    date.m,
    date.d,
    Math.floor(hours.closeMin / 60),
    hours.closeMin % 60
  );

  for (
    let mins = hours.openMin;
    mins + durationH * 60 <= hours.closeMin;
    mins += SLOT_STEP_MIN
  ) {
    const startMs = dubaiLocalToEpochMs(
      date.y,
      date.m,
      date.d,
      Math.floor(mins / 60),
      mins % 60
    );
    const endMs = startMs + durationMs;
    if (startMs < minStartMs) continue;
    if (endMs > closeEpochMs) break;
    slots.push({ startMs, endMs });
  }

  logBooking({
    event: "slots.ok",
    latencyMs: Date.now() - t0,
    status: 200,
  });

  return new NextResponse(JSON.stringify(slots), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
