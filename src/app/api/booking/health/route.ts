/**
 * GET /api/booking/health
 *
 * Trivial liveness probe — does NOT touch ARC. Reports whether the
 * required env wiring is in place. Used for synthetic monitoring.
 */

import { NextResponse } from "next/server";
import { SHOP_ID, SHOP_TOKEN } from "../_lib/arc-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      shopId: SHOP_ID,
      hasShopToken: Boolean(SHOP_TOKEN),
    },
    {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    }
  );
}
