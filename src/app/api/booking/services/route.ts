/**
 * GET /api/booking/services
 *
 * Returns the bookable service catalogue from ARC, mapped to the contract
 * shape. 1-hour edge cache.
 *
 * Source: ARC `GET /public/appointment/services?shopToken=...`
 */

import { NextResponse } from "next/server";
import { fetchServices, ArcError } from "../_lib/arc-client";
import { logBooking } from "../_lib/log";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(): Promise<NextResponse> {
  const t0 = Date.now();
  try {
    const services = await fetchServices();
    logBooking({
      event: "services.ok",
      latencyMs: Date.now() - t0,
      status: 200,
    });
    return new NextResponse(JSON.stringify(services), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (e) {
    const isArc = e instanceof ArcError;
    logBooking({
      event: "services.fail",
      latencyMs: Date.now() - t0,
      status: 502,
      code: isArc ? e.code : "UNKNOWN",
      reason: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { code: "ARC_DOWN", message: "Failed to fetch service catalogue" },
      { status: 502 }
    );
  }
}
