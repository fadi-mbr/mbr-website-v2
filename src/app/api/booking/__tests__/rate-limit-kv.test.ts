/**
 * Unit tests for the KV-backed rate limiter (src/lib/booking-rate-limit-kv.ts).
 */

import {
  _setKvForTests,
  _resetKvForTests,
  type KvLike,
} from "@/lib/booking-kv";
import {
  checkRateLimit,
  checkIpRateLimit,
  getPhoneCount,
  getIpCount,
} from "@/lib/booking-rate-limit-kv";
import { assert, assertEqual, runSuite } from "./_harness";

function makeFakeKv(): KvLike {
  const store = new Map<string, { value: unknown; expiresAt?: number }>();
  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      const e = store.get(key);
      return (e ? (e.value as T) : null) ?? null;
    },
    async set(
      key: string,
      value: unknown,
      options?: { ex?: number; nx?: boolean },
    ): Promise<"OK" | null> {
      if (options?.nx && store.has(key)) return null;
      store.set(key, {
        value,
        expiresAt: options?.ex ? Date.now() + options.ex * 1000 : undefined,
      });
      return "OK";
    },
    async incr(key: string): Promise<number> {
      const e = store.get(key);
      const n = e && typeof e.value === "number" ? e.value : 0;
      const next = n + 1;
      store.set(key, { value: next, expiresAt: e?.expiresAt });
      return next;
    },
    async expire(key: string, seconds: number): Promise<number> {
      const e = store.get(key);
      if (!e) return 0;
      e.expiresAt = Date.now() + seconds * 1000;
      return 1;
    },
  };
}

export default () =>
  runSuite("booking-rate-limit-kv", [
    {
      name: "phone bucket — first call allowed, second blocked (max=1)",
      fn: async () => {
        _setKvForTests(makeFakeKv());
        try {
          const a = await checkRateLimit("971500000088");
          assert(a.allowed);
          const b = await checkRateLimit("971500000088");
          assert(!b.allowed, "second call should be blocked");
          assert(
            typeof b.retryAfterSec === "number" && b.retryAfterSec! > 0,
            "retryAfterSec should be set",
          );
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "phone bucket — different phone isolated",
      fn: async () => {
        _setKvForTests(makeFakeKv());
        try {
          await checkRateLimit("971500000088");
          const r = await checkRateLimit("971500000099");
          assert(r.allowed, "different phone should still be allowed");
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "phone bucket — force=true always allowed (agent retry)",
      fn: async () => {
        _setKvForTests(makeFakeKv());
        try {
          await checkRateLimit("971500000088");
          const r = await checkRateLimit("971500000088", { force: true });
          assert(r.allowed, "force should bypass");
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "ip bucket — 10 allowed, 11th blocked (default max=10)",
      fn: async () => {
        _setKvForTests(makeFakeKv());
        try {
          const results: Array<{ allowed: boolean }> = [];
          for (let i = 0; i < 11; i++) {
            results.push(await checkIpRateLimit("1.2.3.4"));
          }
          const allowed = results.filter((r) => r.allowed).length;
          const blocked = results.filter((r) => !r.allowed).length;
          assertEqual(allowed, 10, "first 10 should be allowed");
          assertEqual(blocked, 1, "11th should be blocked");
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "ip bucket — different IP isolated",
      fn: async () => {
        _setKvForTests(makeFakeKv());
        try {
          for (let i = 0; i < 10; i++) {
            await checkIpRateLimit("1.2.3.4");
          }
          const r = await checkIpRateLimit("5.6.7.8");
          assert(r.allowed, "different IP should still be allowed");
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "getPhoneCount / getIpCount reflect the counter",
      fn: async () => {
        _setKvForTests(makeFakeKv());
        try {
          await checkRateLimit("971500000088");
          assertEqual(await getPhoneCount("971500000088"), 1);
          await checkIpRateLimit("1.2.3.4");
          await checkIpRateLimit("1.2.3.4");
          assertEqual(await getIpCount("1.2.3.4"), 2);
        } finally {
          _resetKvForTests();
        }
      },
    },
    {
      name: "phone bucket — custom max overrides default",
      fn: async () => {
        _setKvForTests(makeFakeKv());
        try {
          // max=3 → first 3 allowed, 4th blocked
          const r1 = await checkRateLimit("971500000088", { max: 3 });
          const r2 = await checkRateLimit("971500000088", { max: 3 });
          const r3 = await checkRateLimit("971500000088", { max: 3 });
          const r4 = await checkRateLimit("971500000088", { max: 3 });
          assert(r1.allowed && r2.allowed && r3.allowed, "first 3 allowed");
          assert(!r4.allowed, "4th blocked");
        } finally {
          _resetKvForTests();
        }
      },
    },
  ]);
