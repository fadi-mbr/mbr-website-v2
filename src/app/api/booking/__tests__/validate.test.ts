/**
 * Unit tests for `validateBookingRequest`.
 *
 * The validator expects phone normalisation to have already happened,
 * so we feed E.164 phones throughout.
 */

import { validateBookingRequest } from "../_lib/validate";
import { assert, assertEqual, runSuite } from "./_harness";

const FUTURE = Date.now() + 24 * 60 * 60 * 1000; // tomorrow

function baseBody(): Record<string, unknown> {
  return {
    ownerEmail: "test@example.com",
    ownerNameFirst: "Test",
    ownerNameLast: "Customer",
    ownerPhone: "971501234567",
    serviceId: 1,
    description: "Brake inspection request",
    timeStartMs: FUTURE,
    vehicleYear: 2020,
    vehicleModel: "Cayenne",
    vehicleMake: "Porsche",
    preferredLanguage: "en",
  };
}

export default () => runSuite("validateBookingRequest", [
  {
    name: "happy path → BookingRequest",
    fn: () => {
      const r = validateBookingRequest(baseBody());
      assert(!("code" in r), "should not be ValidationError");
      assertEqual((r as { ownerEmail: string }).ownerEmail, "test@example.com");
    },
  },
  {
    name: "missing ownerEmail",
    fn: () => {
      const b = baseBody();
      delete b.ownerEmail;
      const r = validateBookingRequest(b);
      assert("code" in r, "should be a ValidationError");
      assertEqual(r.field, "ownerEmail");
    },
  },
  {
    name: "bad email format",
    fn: () => {
      const b = baseBody();
      b.ownerEmail = "not-an-email";
      const r = validateBookingRequest(b);
      assert("code" in r);
      assertEqual(r.field, "ownerEmail");
    },
  },
  {
    name: "phone in local form (not pre-normalised) is rejected",
    fn: () => {
      const b = baseBody();
      b.ownerPhone = "0501234567";
      const r = validateBookingRequest(b);
      assert("code" in r);
      assertEqual(r.field, "ownerPhone");
    },
  },
  {
    name: "serviceId not an integer",
    fn: () => {
      const b = baseBody();
      b.serviceId = "1";
      const r = validateBookingRequest(b);
      assert("code" in r);
      assertEqual(r.field, "serviceId");
    },
  },
  {
    name: "timeStartMs in the past",
    fn: () => {
      const b = baseBody();
      b.timeStartMs = Date.now() - 1000;
      const r = validateBookingRequest(b);
      assert("code" in r);
      assertEqual(r.field, "timeStartMs");
    },
  },
  {
    name: "timeStartMs within 30 min future floor",
    fn: () => {
      const b = baseBody();
      b.timeStartMs = Date.now() + 5 * 60 * 1000;
      const r = validateBookingRequest(b);
      assert("code" in r);
      assertEqual(r.field, "timeStartMs");
    },
  },
  {
    name: "vehicleYear too old",
    fn: () => {
      const b = baseBody();
      b.vehicleYear = 1970;
      const r = validateBookingRequest(b);
      assert("code" in r);
      assertEqual(r.field, "vehicleYear");
    },
  },
  {
    name: "vehicleYear too future",
    fn: () => {
      const b = baseBody();
      b.vehicleYear = new Date().getFullYear() + 10;
      const r = validateBookingRequest(b);
      assert("code" in r);
      assertEqual(r.field, "vehicleYear");
    },
  },
  {
    name: "description too long (>500)",
    fn: () => {
      const b = baseBody();
      b.description = "x".repeat(501);
      const r = validateBookingRequest(b);
      assert("code" in r);
      assertEqual(r.field, "description");
    },
  },
  {
    name: "preferredLanguage invalid",
    fn: () => {
      const b = baseBody();
      b.preferredLanguage = "fr";
      const r = validateBookingRequest(b);
      assert("code" in r);
      assertEqual(r.field, "preferredLanguage");
    },
  },
  {
    name: "concern optional empty → accepted",
    fn: () => {
      const b = baseBody();
      b.concern = "";
      const r = validateBookingRequest(b);
      assert(!("code" in r));
    },
  },
  {
    name: "non-object body",
    fn: () => {
      const r = validateBookingRequest("hello" as unknown);
      assert("code" in r);
      assertEqual(r.field, "body");
    },
  },
]);
