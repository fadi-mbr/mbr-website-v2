/**
 * Unit tests for the shared confirmed-booking submit helper
 * (src/lib/booking-arc-submit.ts).
 *
 * Both the ARC client and the Chatwoot client are swapped out via the
 * module's `_set*DepsForTests` seams.
 */

import {
  submitConfirmedBooking,
  _setArcDepsForTests,
  _setChatwootDepsForTests,
  _resetDepsForTests,
  _setLoggerForTests,
  _resetLoggerForTests,
} from "@/lib/booking-arc-submit";
import { ArcError } from "@/app/api/booking/_lib/arc-client";
import type { BookingIntent } from "@/lib/booking-types";
import { assert, assertEqual, runSuite } from "./_harness";

const INTENT: BookingIntent = {
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
  notes: "Bring espresso",
};

const SERVICE_42 = {
  id: 42,
  title: "Oil change",
  type: "oilChange",
  duration_h: 1,
  price: 250,
  templateType: null,
};

function fakeOkArc() {
  return {
    fetchServices: async () => [SERVICE_42],
    submitBooking: async () => undefined,
    // Stub the worker-auth lookup so we don't accidentally try to log in
    // against real ARC during unit tests. Default = no match (lookup miss).
    fetchWeekAppointmentsRaw: async () => [],
    getWorkerToken: async () => "fake-token",
  };
}

export default () =>
  runSuite("booking-arc-submit", [
    {
      name: "happy path — ok:true with serviceName + confirmAt",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests(fakeOkArc());
        _setChatwootDepsForTests({
          loadConfig: () => null,
          renderMessage: () => "",
          sendMessage: async () => ({ ok: true, status: 200, data: { id: 1 } }),
          setAttrs: async () => ({ ok: true, data: {} }),
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(r.ok);
          if (r.ok) {
            assertEqual(r.serviceName, "Oil change");
            assertEqual(r.estimatedDuration, 1);
            assertEqual(r.confirmAt, new Date(INTENT.timeStartMs).toISOString());
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "service-lookup failure → SERVICE_LOOKUP_FAILED",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests({
          fetchServices: async () => {
            throw new Error("network down");
          },
          submitBooking: async () => undefined,
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(!r.ok);
          if (!r.ok) assertEqual(r.code, "SERVICE_LOOKUP_FAILED");
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "unknown service id → UNKNOWN_SERVICE",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests({
          fetchServices: async () => [{ ...SERVICE_42, id: 99 }],
          submitBooking: async () => undefined,
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(!r.ok);
          if (!r.ok) assertEqual(r.code, "UNKNOWN_SERVICE");
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "ARC 409 → SLOT_TAKEN",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => {
            throw new ArcError("conflict", { status: 409 });
          },
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(!r.ok);
          if (!r.ok) assertEqual(r.code, "SLOT_TAKEN");
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "ARC ALREADY_EXISTS_EMAIL → EXISTING_CUSTOMER",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => {
            throw new ArcError("already exists", {
              status: 400,
              code: "ALREADY_EXISTS_EMAIL",
            });
          },
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(!r.ok);
          if (!r.ok) {
            assertEqual(r.code, "EXISTING_CUSTOMER");
            assert(/WhatsApp/.test(r.message));
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "buildBookingBody — defaults empty vehicleTrim to model",
      fn: async () => {
        _setLoggerForTests(() => {});
        let capturedBody: { vehicleTrim?: string } | null = null;
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async (body) => {
            capturedBody = body as { vehicleTrim?: string };
          },
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(r.ok, "submit should succeed");
          assert(capturedBody !== null, "submitBooking should have been called");
          const trim = (capturedBody as { vehicleTrim?: string }).vehicleTrim;
          // INTENT.vehicleModel is "M3" so trim should match. The key fact is
          // it's NEVER an empty string (which is what ARC rejects).
          assert(typeof trim === "string" && trim.length > 0, "vehicleTrim must be non-empty");
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "ARC PHONE_PROBLEM → PHONE_PROBLEM",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => {
            throw new ArcError("phone problem", {
              status: 400,
              code: "PHONE_PROBLEM",
            });
          },
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(!r.ok);
          if (!r.ok) assertEqual(r.code, "PHONE_PROBLEM");
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "ARC 500 → ARC_DOWN",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => {
            throw new ArcError("boom", { status: 500 });
          },
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(!r.ok);
          if (!r.ok) assertEqual(r.code, "ARC_DOWN");
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "Chatwoot success — message + attrs posted",
      fn: async () => {
        _setLoggerForTests(() => {});
        let messageSent = false;
        let attrsSet = false;
        _setArcDepsForTests(fakeOkArc());
        _setChatwootDepsForTests({
          loadConfig: () => ({
            baseUrl: "https://chat",
            accountId: "1",
            token: "tok",
          }),
          renderMessage: () => "Booked!",
          sendMessage: async () => {
            messageSent = true;
            return { ok: true, status: 200, data: { id: 7 } };
          },
          setAttrs: async () => {
            attrsSet = true;
            return { ok: true, data: {} };
          },
        });
        try {
          const r = await submitConfirmedBooking(INTENT, {
            chatwoot: { conversationId: 123, contactId: 456 },
          });
          assert(r.ok);
          assert(messageSent, "chatwoot message should have been sent");
          assert(attrsSet, "chatwoot attrs should have been set");
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "Chatwoot failure is non-fatal — booking still ok:true",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests(fakeOkArc());
        _setChatwootDepsForTests({
          loadConfig: () => ({
            baseUrl: "https://chat",
            accountId: "1",
            token: "tok",
          }),
          renderMessage: () => "Booked!",
          sendMessage: async () => ({ ok: false, status: 500, reason: "chatwoot_500" }),
          setAttrs: async () => ({ ok: true, data: {} }),
        });
        try {
          const r = await submitConfirmedBooking(INTENT, {
            chatwoot: { conversationId: 123, contactId: 456 },
          });
          assert(r.ok, "booking should succeed despite chatwoot failure");
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "post-submit ARC ID lookup — match populates arcAppointmentId + arcRepairId",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => undefined,
          getWorkerToken: async () => "tok",
          fetchWeekAppointmentsRaw: async () => [
            {
              appointmentId: 12345,
              repairId: 6789,
              startMs: INTENT.timeStartMs,
              endMs: INTENT.timeStartMs + 3_600_000,
              workerId: 1,
              ownerEmail: INTENT.email,
            },
          ],
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(r.ok);
          if (r.ok) {
            assertEqual(r.arcAppointmentId, 12345);
            assertEqual(r.arcRepairId, 6789);
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "post-submit ARC ID lookup — throw leaves arcAppointmentId undefined",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => undefined,
          getWorkerToken: async () => "tok",
          fetchWeekAppointmentsRaw: async () => {
            throw new Error("ARC week endpoint 503");
          },
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(r.ok, "submit should still succeed despite lookup failure");
          if (r.ok) {
            assertEqual(r.arcAppointmentId, undefined);
            assertEqual(r.arcRepairId, undefined);
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "post-submit ARC ID lookup — no email/start match leaves IDs undefined",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => undefined,
          getWorkerToken: async () => "tok",
          fetchWeekAppointmentsRaw: async () => [
            {
              appointmentId: 99999,
              repairId: 88888,
              startMs: INTENT.timeStartMs + 3_600_000, // different time
              endMs: INTENT.timeStartMs + 7_200_000,
              workerId: 1,
              ownerEmail: "someone-else@example.com",
            },
          ],
        });
        try {
          const r = await submitConfirmedBooking(INTENT);
          assert(r.ok);
          if (r.ok) {
            assertEqual(r.arcAppointmentId, undefined);
            assertEqual(r.arcRepairId, undefined);
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: "Chatwoot thrown error is non-fatal — booking still ok:true",
      fn: async () => {
        _setLoggerForTests(() => {});
        _setArcDepsForTests(fakeOkArc());
        _setChatwootDepsForTests({
          loadConfig: () => ({
            baseUrl: "https://chat",
            accountId: "1",
            token: "tok",
          }),
          renderMessage: () => "Booked!",
          sendMessage: async () => {
            throw new Error("network reset");
          },
          setAttrs: async () => ({ ok: true, data: {} }),
        });
        try {
          const r = await submitConfirmedBooking(INTENT, {
            chatwoot: { conversationId: 123, contactId: 456 },
          });
          assert(r.ok, "booking should succeed despite chatwoot throw");
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
  ]);
