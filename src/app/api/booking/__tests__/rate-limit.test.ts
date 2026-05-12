/**
 * Unit tests for the in-memory per-phone rate limiter.
 */

import { checkRateLimit, recordBooking, _resetForTests } from "../_lib/rate-limit";
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
]);
