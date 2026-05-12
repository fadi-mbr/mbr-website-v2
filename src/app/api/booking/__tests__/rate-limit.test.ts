/**
 * Unit tests for the in-memory per-phone rate limiter.
 */

import {
  checkRateLimit,
  recordBooking,
  checkIpRateLimit,
  _resetForTests,
} from "../_lib/rate-limit";
import { assert, assertEqual, runSuite } from "./_harness";

const PHONE = "971500000088";

export default () => runSuite("rate-limit", [
  {
    name: "first call is allowed",
    fn: () => {
      _resetForTests();
      const r = checkRateLimit(PHONE, 1_000_000);
      assert(r.allowed, "first call should be allowed");
      assertEqual(r.retryAfterMs, 0);
    },
  },
  {
    name: "second call within 60min is rejected",
    fn: () => {
      _resetForTests();
      recordBooking(PHONE, 1_000_000);
      const r = checkRateLimit(PHONE, 1_000_000 + 30 * 60 * 1000); // 30 min later
      assert(!r.allowed, "should be blocked");
      assert(r.retryAfterMs > 0, "should have positive retryAfterMs");
    },
  },
  {
    name: "different phone is unaffected",
    fn: () => {
      _resetForTests();
      recordBooking(PHONE, 1_000_000);
      const r = checkRateLimit("971500000099", 1_000_000 + 60_000);
      assert(r.allowed, "other phone unaffected");
    },
  },
  {
    name: "after 60min window, call is allowed again",
    fn: () => {
      _resetForTests();
      recordBooking(PHONE, 1_000_000);
      const r = checkRateLimit(PHONE, 1_000_000 + 60 * 60 * 1000 + 1);
      assert(r.allowed, "after window expiry, allowed");
    },
  },

  // ----- IP bucket (new in PR D) -------------------------------------------
  {
    name: "checkIpRateLimit allows the first 10 hits, blocks the 11th",
    fn: () => {
      _resetForTests();
      const ip = "203.0.113.1";
      for (let i = 0; i < 10; i++) {
        const r = checkIpRateLimit(ip, 10, 1_000_000 + i);
        assert(r.allowed, `hit ${i + 1} should be allowed`);
      }
      const blocked = checkIpRateLimit(ip, 10, 1_000_000 + 10);
      assert(!blocked.allowed, "11th hit must be blocked");
      assert(blocked.retryAfterMs > 0, "retryAfterMs should be positive");
    },
  },
  {
    name: "checkIpRateLimit: empty IP is always allowed (no enforcement)",
    fn: () => {
      _resetForTests();
      const r = checkIpRateLimit("", 10, 1_000_000);
      assert(r.allowed);
    },
  },
  {
    name: "checkIpRateLimit: hits older than the window are dropped",
    fn: () => {
      _resetForTests();
      const ip = "203.0.113.2";
      // 10 hits at t=0
      for (let i = 0; i < 10; i++) {
        const r = checkIpRateLimit(ip, 10, 0);
        assert(r.allowed);
      }
      // a 11th hit 1ms later is blocked
      const b = checkIpRateLimit(ip, 10, 1);
      assert(!b.allowed);
      // ...but 1 hour + 1ms later is allowed again
      const ok = checkIpRateLimit(ip, 10, 60 * 60 * 1000 + 1);
      assert(ok.allowed);
    },
  },
  {
    name: "checkIpRateLimit: different IPs do not interfere",
    fn: () => {
      _resetForTests();
      for (let i = 0; i < 10; i++) {
        checkIpRateLimit("a", 10, 1_000_000 + i);
      }
      const other = checkIpRateLimit("b", 10, 1_000_000);
      assert(other.allowed, "different IP unaffected");
    },
  },
]);
