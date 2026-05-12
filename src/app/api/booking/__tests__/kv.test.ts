/**
 * Unit tests for the Vercel-KV wrapper (src/lib/booking-kv.ts).
 *
 * We swap the underlying KV client for an in-memory fake via the
 * `_setKvForTests` seam — `vi.mock` doesn't exist in this repo because
 * the test runner is hand-rolled (see `_harness.ts`).
 */

import {
  _setKvForTests,
  _resetKvForTests,
  type KvLike,
  getBookingIntent,
  setBookingIntent,
  claimBookingIntent,
  incrementRateLimit,
  getRateLimitCount,
  type BookingIntent,
} from "@/lib/booking-kv";
import { assertEqual, runSuite } from "./_harness";

interface Entry {
  value: unknown;
  expiresAt?: number;
}

function makeFakeKv(): KvLike & { _store: Map<string, Entry> } {
  const store = new Map<string, Entry>();
  const now = (): number => Date.now();

  function expiredCheck(key: string): boolean {
    const e = store.get(key);
    if (!e) return false;
    if (e.expiresAt !== undefined && e.expiresAt <= now()) {
      store.delete(key);
      return true;
    }
    return false;
  }

  return {
    _store: store,
    async get<T = unknown>(key: string): Promise<T | null> {
      expiredCheck(key);
      const e = store.get(key);
      return (e ? (e.value as T) : null) ?? null;
    },
    async set(
      key: string,
      value: unknown,
      options?: { ex?: number; nx?: boolean },
    ): Promise<"OK" | null> {
      expiredCheck(key);
      if (options?.nx && store.has(key)) return null;
      const expiresAt =
        options?.ex !== undefined ? now() + options.ex * 1000 : undefined;
      store.set(key, { value, expiresAt });
      return "OK";
    },
    async incr(key: string): Promise<number> {
      expiredCheck(key);
      const e = store.get(key);
      const n = e && typeof e.value === "number" ? e.value : 0;
      const next = n + 1;
      store.set(key, { value: next, expiresAt: e?.expiresAt });
      return next;
    },
    async expire(key: string, seconds: number): Promise<number> {
      const e = store.get(key);
      if (!e) return 0;
      e.expiresAt = now() + seconds * 1000;
      store.set(key, e);
      return 1;
    },
  };
}

const SAMPLE_INTENT: BookingIntent = {
  serviceId: 42,
  serviceName: "Oil change",
  timeStartMs: 1_700_000_000_000,
  durationH: 1,
  firstName: "Fadi",
  lastName: "Kelzia",
  phone: "971500000088",
  email: "fadi@example.com",
  vehicleYear: 2022,
  vehicleMake: "Toyota",
  vehicleModel: "Land Cruiser",
  plate: "A 12345",
};

export default () =>
  runSuite("booking-kv", [
    {
      name: "set + get round-trips an intent",
      fn: async () => {
        const fake = makeFakeKv();
        _setKvForTests(fake);
        try {
          await setBookingIntent("abc-123", SAMPLE_INTENT, 1800);
          const out = await getBookingIntent("abc-123");
          assertEqual(out, SAMPLE_INTENT);
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "get returns null for missing key",
      fn: async () => {
        const fake = makeFakeKv();
        _setKvForTests(fake);
        try {
          const out = await getBookingIntent("nope");
          assertEqual(out, null);
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "claimBookingIntent — first call wins, second loses",
      fn: async () => {
        const fake = makeFakeKv();
        _setKvForTests(fake);
        try {
          const first = await claimBookingIntent("abc-123", 3600);
          const second = await claimBookingIntent("abc-123", 3600);
          assertEqual(first, true);
          assertEqual(second, false);
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "claimBookingIntent — atomic race (parallel)",
      fn: async () => {
        const fake = makeFakeKv();
        _setKvForTests(fake);
        try {
          // The fake is synchronous-ish, but Promise.all still ensures we
          // exercise the API surface in parallel; the NX guarantee in the
          // fake matches the real KV semantics.
          const results = await Promise.all([
            claimBookingIntent("race-key", 60),
            claimBookingIntent("race-key", 60),
            claimBookingIntent("race-key", 60),
          ]);
          const wins = results.filter((r) => r === true);
          assertEqual(wins.length, 1, "exactly one parallel call should win");
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "incrementRateLimit — first hit sets expire, subsequent hits do not",
      fn: async () => {
        const fake = makeFakeKv();
        _setKvForTests(fake);
        try {
          let expireCalls = 0;
          const originalExpire = fake.expire.bind(fake);
          fake.expire = async (k: string, s: number) => {
            expireCalls++;
            return originalExpire(k, s);
          };
          const c1 = await incrementRateLimit("rl:phone:", "971500000088", 3600);
          const c2 = await incrementRateLimit("rl:phone:", "971500000088", 3600);
          const c3 = await incrementRateLimit("rl:phone:", "971500000088", 3600);
          assertEqual(c1, 1);
          assertEqual(c2, 2);
          assertEqual(c3, 3);
          assertEqual(expireCalls, 1, "expire should be set exactly once per window");
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "getRateLimitCount — reads without bumping",
      fn: async () => {
        const fake = makeFakeKv();
        _setKvForTests(fake);
        try {
          await incrementRateLimit("rl:ip:", "1.2.3.4", 3600);
          await incrementRateLimit("rl:ip:", "1.2.3.4", 3600);
          const c = await getRateLimitCount("rl:ip:", "1.2.3.4");
          assertEqual(c, 2);
          const cAfter = await getRateLimitCount("rl:ip:", "1.2.3.4");
          assertEqual(cAfter, 2, "read should not increment");
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "getRateLimitCount — missing key returns 0",
      fn: async () => {
        const fake = makeFakeKv();
        _setKvForTests(fake);
        try {
          const c = await getRateLimitCount("rl:phone:", "nope");
          assertEqual(c, 0);
        } finally {
          _resetKvForTests();
        }
      },
    },
  ]);
