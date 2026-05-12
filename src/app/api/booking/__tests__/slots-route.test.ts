/**
 * Tests for `src/app/api/booking/slots/route.ts` — the slot-availability
 * endpoint after the real-availability rewrite.
 *
 * Strategy: stub `globalThis.fetch` so all upstream ARC calls (timetable,
 * worker login, week endpoint) are controlled. The route uses the worker
 * token cache, so we reset it between tests to avoid bleed-through.
 */

import { GET } from "../slots/route";
import {
  _resetWorkerTokenCacheForTests,
  _setWorkerLoginForTests,
} from "@/app/api/booking/_lib/worker-token-cache";
import { assert, assertEqual, runSuite } from "./_harness";

const realFetch = globalThis.fetch;

interface UrlMatcher {
  match: (url: string) => boolean;
  respond: (url: string) => Response;
}

function makeFetchStub(matchers: UrlMatcher[]): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const m of matchers) {
      if (m.match(url)) return m.respond(url);
    }
    throw new Error(`unstubbed fetch: ${url}`);
  }) as typeof fetch;
}

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Use a date well in the future so the 30-min-future-floor doesn't drop
// every candidate. 2030-06-10 is a Monday.
const FUTURE_DATE = "2030-06-10";

// Build a future epoch for a Dubai-local hour on FUTURE_DATE.
function dubaiHourMs(hour: number): number {
  // 2030-06-10 04:00 UTC == 2030-06-10 08:00 Dubai (UTC+4).
  return Date.UTC(2030, 5, 10, hour - 4, 0, 0);
}

const TIMETABLE_PAYLOAD = {
  days: [
    { dayOfWeek: 0, isOpen: false }, // Sun closed
    { dayOfWeek: 1, openTime: 9 * 60, closeTime: 19 * 60, isOpen: true }, // Mon
    { dayOfWeek: 2, openTime: 9 * 60, closeTime: 19 * 60, isOpen: true },
    { dayOfWeek: 3, openTime: 9 * 60, closeTime: 19 * 60, isOpen: true },
    { dayOfWeek: 4, openTime: 9 * 60, closeTime: 19 * 60, isOpen: true },
    { dayOfWeek: 5, openTime: 9 * 60, closeTime: 19 * 60, isOpen: true },
    { dayOfWeek: 6, openTime: 9 * 60, closeTime: 19 * 60, isOpen: true },
  ],
};

function setEnvForWorker(): void {
  process.env.ARC_WORKER_PHONE = "971566066006";
  process.env.ARC_WORKER_PASSWORD = "pw-test";
}
function clearEnvForWorker(): void {
  delete process.env.ARC_WORKER_PHONE;
  delete process.env.ARC_WORKER_PASSWORD;
}

export default () =>
  runSuite("booking-slots-route", [
    {
      name: "happy path — empty booked intervals → all candidates returned",
      fn: async () => {
        _resetWorkerTokenCacheForTests();
        setEnvForWorker();
        _setWorkerLoginForTests(async () => ({ token: "tok" }));

        globalThis.fetch = makeFetchStub([
          {
            match: (u) => u.includes("/public/shop/timetable"),
            respond: () => jsonResp(TIMETABLE_PAYLOAD),
          },
          {
            match: (u) => u.includes("/appointment/week/workers"),
            respond: () => jsonResp({ workerWeek: [] }),
          },
        ]);

        try {
          const res = await GET(
            new Request(
              `https://example.com/api/booking/slots?date=${FUTURE_DATE}&duration_h=1`
            )
          );
          assertEqual(res.status, 200);
          const slots = (await res.json()) as Array<{ startMs: number }>;
          assert(Array.isArray(slots));
          // Open 09:00-19:00, 1h service, 30-min step → 19 slots
          // (09:00, 09:30, ..., 18:00). End at 19:00 inclusive.
          assert(slots.length >= 18, `expected many slots, got ${slots.length}`);
        } finally {
          globalThis.fetch = realFetch;
          clearEnvForWorker();
          _resetWorkerTokenCacheForTests();
        }
      },
    },
    {
      name: "booked intervals filter candidates correctly",
      fn: async () => {
        _resetWorkerTokenCacheForTests();
        setEnvForWorker();
        _setWorkerLoginForTests(async () => ({ token: "tok" }));

        // Block 10:00-12:00 Dubai-local on FUTURE_DATE.
        const blockStart = dubaiHourMs(10);
        const blockEnd = dubaiHourMs(12);
        globalThis.fetch = makeFetchStub([
          {
            match: (u) => u.includes("/public/shop/timetable"),
            respond: () => jsonResp(TIMETABLE_PAYLOAD),
          },
          {
            match: (u) => u.includes("/appointment/week/workers"),
            respond: () =>
              jsonResp({
                workerWeek: [
                  {
                    date: FUTURE_DATE,
                    data: [
                      {
                        worker: { id: 1, nameFirst: "Test" },
                        appointments: [
                          { timeStart: blockStart, timeEnd: blockEnd },
                        ],
                      },
                    ],
                  },
                ],
              }),
          },
        ]);

        try {
          const res = await GET(
            new Request(
              `https://example.com/api/booking/slots?date=${FUTURE_DATE}&duration_h=1`
            )
          );
          const slots = (await res.json()) as Array<{ startMs: number; endMs: number }>;
          // No slot may overlap [10:00, 12:00). A 1h slot at 09:30 (ends 10:30)
          // overlaps → filtered. 09:00 (ends 10:00) is adjacent → kept.
          for (const s of slots) {
            const overlaps = s.startMs < blockEnd && blockStart < s.endMs;
            assert(!overlaps, `slot ${new Date(s.startMs).toISOString()} overlaps block`);
          }
          // Some slots from earlier/later in the day must remain.
          assert(slots.length > 0, "should still have available slots");
        } finally {
          globalThis.fetch = realFetch;
          clearEnvForWorker();
          _resetWorkerTokenCacheForTests();
        }
      },
    },
    {
      name: "worker login failure → falls back to candidates-only (no 500)",
      fn: async () => {
        _resetWorkerTokenCacheForTests();
        setEnvForWorker();
        _setWorkerLoginForTests(async () => {
          throw new Error("ARC down for login");
        });

        globalThis.fetch = makeFetchStub([
          {
            match: (u) => u.includes("/public/shop/timetable"),
            respond: () => jsonResp(TIMETABLE_PAYLOAD),
          },
        ]);

        try {
          const res = await GET(
            new Request(
              `https://example.com/api/booking/slots?date=${FUTURE_DATE}&duration_h=1`
            )
          );
          assertEqual(res.status, 200);
          const slots = (await res.json()) as Array<{ startMs: number }>;
          assert(Array.isArray(slots));
          assert(slots.length > 0, "fallback should still emit candidates");
        } finally {
          globalThis.fetch = realFetch;
          clearEnvForWorker();
          _resetWorkerTokenCacheForTests();
        }
      },
    },
    {
      name: "missing worker env vars → falls back to candidates-only",
      fn: async () => {
        _resetWorkerTokenCacheForTests();
        clearEnvForWorker(); // no env vars at all
        globalThis.fetch = makeFetchStub([
          {
            match: (u) => u.includes("/public/shop/timetable"),
            respond: () => jsonResp(TIMETABLE_PAYLOAD),
          },
        ]);
        try {
          const res = await GET(
            new Request(
              `https://example.com/api/booking/slots?date=${FUTURE_DATE}&duration_h=1`
            )
          );
          assertEqual(res.status, 200);
          const slots = (await res.json()) as Array<{ startMs: number }>;
          assert(slots.length > 0);
        } finally {
          globalThis.fetch = realFetch;
          _resetWorkerTokenCacheForTests();
        }
      },
    },
    {
      name: "2h service blocked by 1h booking mid-window (full-duration overlap)",
      fn: async () => {
        _resetWorkerTokenCacheForTests();
        setEnvForWorker();
        _setWorkerLoginForTests(async () => ({ token: "tok" }));

        // Block 11:00-12:00 only. A 2h service starting at 10:00 ends 12:00 → overlaps.
        // A 2h service starting at 10:30 ends 12:30 → overlaps. Both must be filtered.
        const blockStart = dubaiHourMs(11);
        const blockEnd = dubaiHourMs(12);
        globalThis.fetch = makeFetchStub([
          {
            match: (u) => u.includes("/public/shop/timetable"),
            respond: () => jsonResp(TIMETABLE_PAYLOAD),
          },
          {
            match: (u) => u.includes("/appointment/week/workers"),
            respond: () =>
              jsonResp({
                workerWeek: [
                  {
                    date: FUTURE_DATE,
                    data: [
                      {
                        worker: { id: 1 },
                        appointments: [
                          { timeStart: blockStart, timeEnd: blockEnd },
                        ],
                      },
                    ],
                  },
                ],
              }),
          },
        ]);

        try {
          const res = await GET(
            new Request(
              `https://example.com/api/booking/slots?date=${FUTURE_DATE}&duration_h=2`
            )
          );
          const slots = (await res.json()) as Array<{ startMs: number; endMs: number }>;
          for (const s of slots) {
            const overlaps = s.startMs < blockEnd && blockStart < s.endMs;
            assert(
              !overlaps,
              `2h slot ${new Date(s.startMs).toISOString()} should not overlap block`
            );
          }
        } finally {
          globalThis.fetch = realFetch;
          clearEnvForWorker();
          _resetWorkerTokenCacheForTests();
        }
      },
    },
    {
      name: "bad date → 400 VALIDATION",
      fn: async () => {
        const res = await GET(
          new Request("https://example.com/api/booking/slots?date=nope&duration_h=1")
        );
        assertEqual(res.status, 400);
      },
    },
    {
      name: "bad duration → 400 VALIDATION",
      fn: async () => {
        const res = await GET(
          new Request(
            `https://example.com/api/booking/slots?date=${FUTURE_DATE}&duration_h=-1`
          )
        );
        assertEqual(res.status, 400);
      },
    },
  ]);
