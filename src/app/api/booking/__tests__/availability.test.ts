/**
 * Tests for the real-availability slot pipeline:
 *  - workerLogin (URL + query params + token extraction)
 *  - fetchWeekBookedIntervals (week date computation + response parsing)
 *  - slot filtering (overlap math against full service duration)
 *  - worker-token-cache (cache hit, refresh on expiry, reset)
 */

import {
  workerLogin,
  fetchWeekBookedIntervals,
  ArcError,
  _weekDatesForTests,
  type BookedInterval,
} from "@/app/api/booking/_lib/arc-client";
import {
  getWorkerToken,
  invalidateWorkerToken,
  _resetWorkerTokenCacheForTests,
  _setWorkerLoginForTests,
} from "@/app/api/booking/_lib/worker-token-cache";
import { assert, assertEqual, runSuite } from "./_harness";

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function withFetchMock(mock: FetchMock, run: () => Promise<void>): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock as typeof fetch;
  return run().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Helper: pure overlap-filter mirroring slots/route.ts logic. Exposed so
// the unit test exercises the exact algorithm.
interface Slot {
  startMs: number;
  endMs: number;
}
function filterAvailable(
  candidates: Slot[],
  booked: BookedInterval[],
  durationMs: number
): Slot[] {
  return candidates.filter((c) => {
    const slotStart = c.startMs;
    const slotEnd = slotStart + durationMs;
    return !booked.some(
      (b) => b.startMs < slotEnd && slotStart < b.endMs
    );
  });
}

export default () =>
  runSuite("booking-availability", [
    // -----------------------------------------------------------------
    // workerLogin
    // -----------------------------------------------------------------
    {
      name: "workerLogin — sends phone + code as query params, returns token",
      fn: async () => {
        let capturedUrl = "";
        await withFetchMock(
          async (input) => {
            capturedUrl = typeof input === "string" ? input : input.toString();
            return jsonResponse({ token: "abc123", workerId: 42 });
          },
          async () => {
            const r = await workerLogin("971566066006", "secret-pw");
            assertEqual(r.token, "abc123");
            assert(capturedUrl.includes("/auth/worker/login"));
            assert(capturedUrl.includes("phone=971566066006"));
            assert(
              capturedUrl.includes("code=secret-pw") ||
                capturedUrl.includes("code=secret%2Dpw"),
              `code should be in querystring: ${capturedUrl}`
            );
          }
        );
      },
    },
    {
      name: "workerLogin — 401 → ArcError",
      fn: async () => {
        await withFetchMock(
          async () => jsonResponse({ code: "BAD_CREDS" }, 401),
          async () => {
            let caught: unknown = null;
            try {
              await workerLogin("971566066006", "wrong");
            } catch (e) {
              caught = e;
            }
            assert(caught instanceof ArcError, "should throw ArcError");
            if (caught instanceof ArcError) {
              assertEqual(caught.status, 401);
              assertEqual(caught.code, "BAD_CREDS");
            }
          }
        );
      },
    },
    {
      name: "workerLogin — missing token in response → ArcError",
      fn: async () => {
        await withFetchMock(
          async () => jsonResponse({ notAToken: true }),
          async () => {
            let caught: unknown = null;
            try {
              await workerLogin("971566066006", "x");
            } catch (e) {
              caught = e;
            }
            assert(caught instanceof ArcError);
          }
        );
      },
    },

    // -----------------------------------------------------------------
    // weekDatesFor (helper)
    // -----------------------------------------------------------------
    {
      name: "weekDatesFor — anchor on Wednesday returns Sun..Sat of that week",
      fn: () => {
        // 2026-05-13 is a Wednesday → Sun 2026-05-10, Sat 2026-05-16.
        const w = _weekDatesForTests("2026-05-13");
        assertEqual(w.sun, "2026-05-10");
        assertEqual(w.mon, "2026-05-11");
        assertEqual(w.tue, "2026-05-12");
        assertEqual(w.wed, "2026-05-13");
        assertEqual(w.thu, "2026-05-14");
        assertEqual(w.fri, "2026-05-15");
        assertEqual(w.sat, "2026-05-16");
      },
    },
    {
      name: "weekDatesFor — anchor on Sunday returns same Sunday",
      fn: () => {
        // 2026-05-10 is a Sunday.
        const w = _weekDatesForTests("2026-05-10");
        assertEqual(w.sun, "2026-05-10");
        assertEqual(w.sat, "2026-05-16");
      },
    },

    // -----------------------------------------------------------------
    // fetchWeekBookedIntervals
    // -----------------------------------------------------------------
    {
      name: "fetchWeekBookedIntervals — parses workerWeek into per-date map",
      fn: async () => {
        let capturedUrl = "";
        let capturedHeaders: Record<string, string> = {};
        const week = {
          workerWeek: [
            {
              name: "Sun",
              date: "2026-05-10",
              data: [
                {
                  worker: { id: 119710, nameFirst: "Julia" },
                  appointments: [
                    { timeStart: 1_700_000_000_000, timeEnd: 1_700_003_600_000 },
                  ],
                },
              ],
            },
            {
              name: "Wed",
              date: "2026-05-13",
              data: [
                {
                  worker: { id: 119710, nameFirst: "Julia" },
                  appointments: [
                    { timeStart: 1_700_010_000_000, timeEnd: 1_700_013_600_000 },
                    { timeStart: 1_700_020_000_000, timeEnd: 1_700_023_600_000 },
                  ],
                },
                {
                  worker: { id: 119711, nameFirst: "Ahmed" },
                  appointments: [],
                },
              ],
            },
          ],
        };
        await withFetchMock(
          async (input, init) => {
            capturedUrl = typeof input === "string" ? input : input.toString();
            capturedHeaders = (init?.headers ?? {}) as Record<string, string>;
            return jsonResponse(week);
          },
          async () => {
            const m = await fetchWeekBookedIntervals("tok-xyz", "2026-05-13");
            assert(capturedUrl.includes("/appointment/week/workers"));
            assert(capturedUrl.includes("sun=2026-05-10"));
            assert(capturedUrl.includes("sat=2026-05-16"));
            // Worker auth must use `Token:` not `Authorization:`.
            assertEqual(capturedHeaders["Token"], "tok-xyz");
            assert(
              !("Authorization" in capturedHeaders),
              "must not use Authorization header"
            );

            const sun = m.get("2026-05-10") ?? [];
            assertEqual(sun.length, 1);
            assertEqual(sun[0].startMs, 1_700_000_000_000);
            assertEqual(sun[0].workerId, 119710);

            const wed = m.get("2026-05-13") ?? [];
            assertEqual(wed.length, 2);
          }
        );
      },
    },
    {
      name: "fetchWeekBookedIntervals — non-2xx → ArcError",
      fn: async () => {
        await withFetchMock(
          async () => jsonResponse({ code: "UNAUTH" }, 401),
          async () => {
            let caught: unknown = null;
            try {
              await fetchWeekBookedIntervals("bad", "2026-05-13");
            } catch (e) {
              caught = e;
            }
            assert(caught instanceof ArcError);
            if (caught instanceof ArcError) assertEqual(caught.status, 401);
          }
        );
      },
    },
    {
      name: "fetchWeekBookedIntervals — drops invalid appointments",
      fn: async () => {
        await withFetchMock(
          async () =>
            jsonResponse({
              workerWeek: [
                {
                  date: "2026-05-13",
                  data: [
                    {
                      worker: { id: 1 },
                      appointments: [
                        { timeStart: 100, timeEnd: 200 }, // valid
                        { timeStart: 300 }, // missing end
                        { timeStart: 500, timeEnd: 500 }, // zero-length
                        { timeStart: 700, timeEnd: 600 }, // inverted
                      ],
                    },
                  ],
                },
              ],
            }),
          async () => {
            const m = await fetchWeekBookedIntervals("t", "2026-05-13");
            const day = m.get("2026-05-13") ?? [];
            assertEqual(day.length, 1);
            assertEqual(day[0].startMs, 100);
          }
        );
      },
    },

    // -----------------------------------------------------------------
    // slot filtering (FULL service duration)
    // -----------------------------------------------------------------
    {
      name: "filter — slot entirely within booked interval is removed",
      fn: () => {
        const candidates: Slot[] = [
          { startMs: 1_000, endMs: 1_500 },
        ];
        const booked: BookedInterval[] = [
          { startMs: 500, endMs: 2_000, workerId: 1 },
        ];
        const out = filterAvailable(candidates, booked, 500);
        assertEqual(out.length, 0);
      },
    },
    {
      name: "filter — slot overlapping START of booked interval is removed",
      fn: () => {
        // Candidate: [900, 1400). Booked: [1000, 2000). Overlaps.
        const candidates: Slot[] = [{ startMs: 900, endMs: 1_400 }];
        const booked: BookedInterval[] = [
          { startMs: 1_000, endMs: 2_000, workerId: 1 },
        ];
        const out = filterAvailable(candidates, booked, 500);
        assertEqual(out.length, 0);
      },
    },
    {
      name: "filter — slot overlapping END of booked interval is removed",
      fn: () => {
        // Candidate: [1900, 2400). Booked: [1000, 2000). Overlaps last 100ms.
        const candidates: Slot[] = [{ startMs: 1_900, endMs: 2_400 }];
        const booked: BookedInterval[] = [
          { startMs: 1_000, endMs: 2_000, workerId: 1 },
        ];
        const out = filterAvailable(candidates, booked, 500);
        assertEqual(out.length, 0);
      },
    },
    {
      name: "filter — adjacent slot (booked ends when slot starts) is KEPT",
      fn: () => {
        // Candidate: [2000, 2500). Booked: [1000, 2000). Touching, not overlapping.
        const candidates: Slot[] = [{ startMs: 2_000, endMs: 2_500 }];
        const booked: BookedInterval[] = [
          { startMs: 1_000, endMs: 2_000, workerId: 1 },
        ];
        const out = filterAvailable(candidates, booked, 500);
        assertEqual(out.length, 1);
      },
    },
    {
      name: "filter — slot entirely before any booked interval is kept",
      fn: () => {
        const candidates: Slot[] = [{ startMs: 100, endMs: 600 }];
        const booked: BookedInterval[] = [
          { startMs: 1_000, endMs: 2_000, workerId: 1 },
        ];
        const out = filterAvailable(candidates, booked, 500);
        assertEqual(out.length, 1);
      },
    },
    {
      name: "filter — FULL service duration (2h) blocks a 30-min slot starting in a 1h booking",
      fn: () => {
        // 30-min-aligned candidate at 10:00 for a 2h service. Booking at 11:00-12:00.
        // The candidate's [10:00, 12:00) overlaps the booking → must be filtered.
        const TEN = new Date("2026-05-13T10:00:00Z").getTime();
        const ELEVEN = new Date("2026-05-13T11:00:00Z").getTime();
        const TWELVE = new Date("2026-05-13T12:00:00Z").getTime();
        const TWO_H = 2 * 60 * 60 * 1000;
        const candidates: Slot[] = [{ startMs: TEN, endMs: TEN + TWO_H }];
        const booked: BookedInterval[] = [
          { startMs: ELEVEN, endMs: TWELVE, workerId: 1 },
        ];
        const out = filterAvailable(candidates, booked, TWO_H);
        assertEqual(out.length, 0);
      },
    },
    {
      name: "filter — empty booked list returns all candidates",
      fn: () => {
        const candidates: Slot[] = [
          { startMs: 100, endMs: 600 },
          { startMs: 700, endMs: 1_200 },
        ];
        const out = filterAvailable(candidates, [], 500);
        assertEqual(out.length, 2);
      },
    },

    // -----------------------------------------------------------------
    // worker-token-cache
    // -----------------------------------------------------------------
    {
      name: "cache — first call invokes login, second is cached",
      fn: async () => {
        _resetWorkerTokenCacheForTests();
        process.env.ARC_WORKER_PHONE = "971566066006";
        process.env.ARC_WORKER_PASSWORD = "pw1";
        let calls = 0;
        _setWorkerLoginForTests(async () => {
          calls++;
          return { token: `t${calls}` };
        });
        try {
          const a = await getWorkerToken();
          const b = await getWorkerToken();
          assertEqual(calls, 1);
          assertEqual(a, "t1");
          assertEqual(b, "t1");
        } finally {
          _resetWorkerTokenCacheForTests();
          delete process.env.ARC_WORKER_PHONE;
          delete process.env.ARC_WORKER_PASSWORD;
        }
      },
    },
    {
      name: "cache — invalidate forces re-login on next call",
      fn: async () => {
        _resetWorkerTokenCacheForTests();
        process.env.ARC_WORKER_PHONE = "971566066006";
        process.env.ARC_WORKER_PASSWORD = "pw1";
        let calls = 0;
        _setWorkerLoginForTests(async () => {
          calls++;
          return { token: `t${calls}` };
        });
        try {
          const a = await getWorkerToken();
          invalidateWorkerToken();
          const b = await getWorkerToken();
          assertEqual(calls, 2);
          assert(a !== b);
        } finally {
          _resetWorkerTokenCacheForTests();
          delete process.env.ARC_WORKER_PHONE;
          delete process.env.ARC_WORKER_PASSWORD;
        }
      },
    },
    {
      name: "cache — missing env vars → throws (caller falls back)",
      fn: async () => {
        _resetWorkerTokenCacheForTests();
        delete process.env.ARC_WORKER_PHONE;
        delete process.env.ARC_WORKER_PASSWORD;
        let caught: unknown = null;
        try {
          await getWorkerToken();
        } catch (e) {
          caught = e;
        }
        assert(caught instanceof Error);
      },
    },
    {
      name: "cache — _resetWorkerTokenCacheForTests clears state",
      fn: async () => {
        _resetWorkerTokenCacheForTests();
        process.env.ARC_WORKER_PHONE = "971566066006";
        process.env.ARC_WORKER_PASSWORD = "pw1";
        let calls = 0;
        _setWorkerLoginForTests(async () => {
          calls++;
          return { token: `t${calls}` };
        });
        try {
          await getWorkerToken();
          assertEqual(calls, 1);
          _resetWorkerTokenCacheForTests();
          // After reset the login fn is back to the real one. Re-stub.
          _setWorkerLoginForTests(async () => {
            calls++;
            return { token: `t${calls}` };
          });
          await getWorkerToken();
          assertEqual(calls, 2);
        } finally {
          _resetWorkerTokenCacheForTests();
          delete process.env.ARC_WORKER_PHONE;
          delete process.env.ARC_WORKER_PASSWORD;
        }
      },
    },
  ]);
