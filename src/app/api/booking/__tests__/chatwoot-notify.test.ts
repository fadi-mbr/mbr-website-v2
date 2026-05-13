/**
 * Tests for src/lib/booking-chatwoot-notify.ts
 *
 * The HTTP path is mocked via the `_setChatwootDepsForTests` seam — we
 * replace `fetch` with an in-memory recorder so we can assert on the
 * request URLs, headers, and bodies without hitting connect.mbrme.com.
 */

import {
  notifyTeamOfNewBooking,
  _setChatwootDepsForTests,
  _resetChatwootDepsForTests,
  _renderBookingMessage,
  _buildArcUrl,
  _escapeMd,
  _loadNotifyConfig,
} from "@/lib/booking-chatwoot-notify";
import type { BookingIntent } from "@/lib/booking-types";
import { assert, assertEqual, runSuite } from "./_harness";

const INTENT: BookingIntent = {
  serviceId: 1,
  serviceName: "Diagnosis",
  timeStartMs: Date.UTC(2026, 4, 19, 6, 0, 0), // 10:00 Asia/Dubai
  durationH: 1,
  firstName: "Faisal",
  lastName: "Al Hashimi",
  phone: "971502345699",
  email: "faisal@example.com",
  vehicleYear: 2023,
  vehicleMake: "Ferrari",
  vehicleModel: "296 GTB",
  plate: "Dubai M 11111",
  notes: "Customer reports a rattle at 4k RPM",
};

const FULL_ENV: NodeJS.ProcessEnv = {
  CHATWOOT_ADMIN_API_TOKEN: "tok",
  CHATWOOT_BOOKINGS_INBOX_ID: "6",
  CHATWOOT_BOOKINGS_TEAM_ID: "1",
  CHATWOOT_BASE_URL: "https://connect.mbrme.com",
  CHATWOOT_ACCOUNT_ID: "1",
} as unknown as NodeJS.ProcessEnv;

interface RecordedCall {
  url: string;
  init?: RequestInit;
}

/**
 * Build a fake-fetch that returns a pre-programmed response sequence.
 * Each call shifts off the next response; if the queue is empty, returns
 * a generic 200 success.
 */
function makeFakeFetch(
  responses: Array<{ status: number; body?: unknown }>,
  calls: RecordedCall[],
): (url: string, init?: RequestInit) => Promise<Response> {
  return async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift() || { status: 200, body: {} };
    const text =
      typeof next.body === "string"
        ? next.body
        : JSON.stringify(next.body ?? {});
    return new Response(text, {
      status: next.status,
      headers: { "Content-Type": "application/json" },
    }) as Response;
  };
}

export default () =>
  runSuite("booking-chatwoot-notify", [
    {
      name: "_escapeMd backslash-escapes Markdown specials",
      fn: () => {
        assertEqual(_escapeMd("**bold**"), "\\*\\*bold\\*\\*");
        assertEqual(_escapeMd("a_b"), "a\\_b");
        assertEqual(_escapeMd("[x](y)"), "\\[x\\]\\(y\\)");
        assertEqual(_escapeMd("plain"), "plain");
        assertEqual(_escapeMd(undefined), "");
      },
    },

    {
      name: "_buildArcUrl prefers repairId > appointmentId > customer search",
      fn: () => {
        assertEqual(
          _buildArcUrl({ arcRepairId: 99, email: "a@b.com" }),
          "https://autorepaircloud.com/main/repair?id=99",
        );
        assertEqual(
          _buildArcUrl({ arcAppointmentId: 12, email: "a@b.com" }),
          "https://autorepaircloud.com/main/appointment-list?id=12",
        );
        assertEqual(
          _buildArcUrl({ email: "a+b@example.com" }),
          "https://autorepaircloud.com/main/customer-list?search=a%2Bb%40example.com",
        );
      },
    },

    {
      name: "_renderBookingMessage includes customer + service + ARC link",
      fn: () => {
        const msg = _renderBookingMessage({
          intent: INTENT,
          serviceName: "Computerized Diagnosis",
          durationH: 1,
          arcAppointmentId: 12345,
          arcRepairId: 6789,
        });
        assert(msg.includes("Faisal Al Hashimi"), "customer name present");
        assert(msg.includes("Ferrari"), "vehicle make present");
        assert(msg.includes("296 GTB"), "vehicle model present");
        assert(msg.includes("Plate: Dubai M 11111"), "plate present");
        assert(msg.includes("Computerized Diagnosis"), "service name present");
        assert(msg.includes("(1h)"), "duration suffix");
        assert(msg.includes("appointment `12345`"), "appt id rendered");
        assert(msg.includes("RO `6789`"), "ro id rendered");
        assert(
          msg.includes("https://autorepaircloud.com/main/repair?id=6789"),
          "ARC repair URL",
        );
        // The "+" in GMT+4 gets backslash-escaped in our Markdown safety
        // pass. Accept either form so the renderer keeps the escape.
        assert(/GMT\\?\+4/.test(msg), "tz marker present");
      },
    },

    {
      name: "_renderBookingMessage falls back to customer-search URL without IDs",
      fn: () => {
        const msg = _renderBookingMessage({
          intent: INTENT,
          serviceName: "Diagnosis",
          durationH: 1,
        });
        assert(
          msg.includes("customer-list?search=faisal%40example.com"),
          "search URL used as fallback",
        );
        assert(msg.includes("appointment `?`"), "appt id placeholder when missing");
        assert(msg.includes("RO `?`"), "ro id placeholder when missing");
      },
    },

    {
      name: "_renderBookingMessage escapes Markdown injection in user fields",
      fn: () => {
        const malicious: BookingIntent = {
          ...INTENT,
          firstName: "**bold**",
          lastName: "_italic_",
          notes: "[click](http://evil)",
        };
        const msg = _renderBookingMessage({
          intent: malicious,
          serviceName: "Diagnosis",
          durationH: 1,
        });
        assert(
          !msg.match(/\*\*bold\*\*(?!\\)/) || msg.includes("\\*\\*bold\\*\\*"),
          "** in name is escaped",
        );
        assert(msg.includes("\\[click\\]\\(http"), "[] and () in notes escaped");
      },
    },

    {
      name: "_loadNotifyConfig returns reason when token missing",
      fn: () => {
        const res = _loadNotifyConfig({} as NodeJS.ProcessEnv);
        assert(!res.ok);
        if (!res.ok) assert(/CHATWOOT_ADMIN_API_TOKEN/.test(res.reason));
      },
    },

    {
      name: "_loadNotifyConfig returns reason when inbox id missing",
      fn: () => {
        const res = _loadNotifyConfig({
          CHATWOOT_ADMIN_API_TOKEN: "tok",
        } as unknown as NodeJS.ProcessEnv);
        assert(!res.ok);
        if (!res.ok) assert(/CHATWOOT_BOOKINGS_INBOX_ID/.test(res.reason));
      },
    },

    {
      name: "_loadNotifyConfig populates defaults + optional teamId",
      fn: () => {
        const res = _loadNotifyConfig(FULL_ENV);
        assert(res.ok);
        if (res.ok) {
          assertEqual(res.cfg.baseUrl, "https://connect.mbrme.com");
          assertEqual(res.cfg.accountId, "1");
          assertEqual(res.cfg.inboxId, "6");
          assertEqual(res.cfg.teamId, "1");
        }
      },
    },

    {
      name: "notifyTeamOfNewBooking returns config_missing when env unset",
      fn: async () => {
        _setChatwootDepsForTests({
          loadConfig: () => ({ ok: false, reason: "CHATWOOT_ADMIN_API_TOKEN not set" }),
        });
        try {
          const r = await notifyTeamOfNewBooking({
            intent: INTENT,
            serviceName: "Diagnosis",
            durationH: 1,
          });
          assert(!r.ok);
          assert(typeof r.reason === "string" && /config_missing/.test(r.reason));
        } finally {
          _resetChatwootDepsForTests();
        }
      },
    },

    {
      name: "notifyTeamOfNewBooking happy path — creates contact, conv, message",
      fn: async () => {
        const calls: RecordedCall[] = [];
        // 1) contact create → returns contact id + contact_inboxes[]
        // 2) conversation create → returns conv id
        // 3) message post → 200 ok
        _setChatwootDepsForTests({
          loadConfig: () => ({
            ok: true,
            cfg: {
              baseUrl: "https://connect.mbrme.com",
              accountId: "1",
              token: "tok",
              inboxId: "6",
              teamId: "1",
            },
          }),
          fetch: makeFakeFetch(
            [
              {
                status: 200,
                body: {
                  payload: {
                    contact: { id: 111 },
                    contact_inboxes: [
                      { source_id: "src-111", inbox: { id: 6 } },
                    ],
                  },
                },
              },
              { status: 200, body: { id: 222 } },
              { status: 200, body: { id: 999 } },
            ],
            calls,
          ),
        });
        try {
          const r = await notifyTeamOfNewBooking({
            intent: INTENT,
            arcAppointmentId: 12345,
            arcRepairId: 6789,
            serviceName: "Computerized Diagnosis",
            durationH: 1,
          });
          assert(r.ok, `expected ok, got reason: ${r.reason}`);
          assertEqual(r.conversationId, 222);

          assertEqual(calls.length, 3, "three HTTP calls expected");
          assert(calls[0].url.includes("/api/v1/accounts/1/contacts"));
          assert(calls[1].url.includes("/api/v1/accounts/1/conversations"));
          assert(calls[2].url.includes("/conversations/222/messages"));

          // Verify conversation body has inbox_id + team_id + source_id
          const convBody = JSON.parse(String(calls[1].init?.body));
          assertEqual(convBody.inbox_id, 6);
          assertEqual(convBody.team_id, 1);
          assertEqual(convBody.source_id, "src-111");
          assertEqual(convBody.contact_id, 111);

          // Verify message body has the rendered markdown content
          const msgBody = JSON.parse(String(calls[2].init?.body));
          assert(typeof msgBody.content === "string");
          assert(msgBody.content.includes("Faisal Al Hashimi"));
          assert(msgBody.content.includes("repair?id=6789"));
          assertEqual(msgBody.message_type, "outgoing");
          assertEqual(msgBody.private, false);
        } finally {
          _resetChatwootDepsForTests();
        }
      },
    },

    {
      name: "notifyTeamOfNewBooking falls back when contact-create returns no inbox source",
      fn: async () => {
        // contact-create succeeds but doesn't return contact_inboxes →
        // we mint a source_id via POST /contacts/:id/contact_inboxes
        const calls: RecordedCall[] = [];
        _setChatwootDepsForTests({
          loadConfig: () => ({
            ok: true,
            cfg: {
              baseUrl: "https://chat",
              accountId: "1",
              token: "tok",
              inboxId: "6",
            },
          }),
          fetch: makeFakeFetch(
            [
              { status: 200, body: { payload: { contact: { id: 111 } } } },
              { status: 200, body: { source_id: "minted-99" } },
              { status: 200, body: { id: 222 } },
              { status: 200, body: { id: 999 } },
            ],
            calls,
          ),
        });
        try {
          const r = await notifyTeamOfNewBooking({
            intent: INTENT,
            serviceName: "Diagnosis",
            durationH: 1,
          });
          assert(r.ok, `expected ok, got reason: ${r.reason}`);
          assert(calls[1].url.includes("/contacts/111/contact_inboxes"));
          const convBody = JSON.parse(String(calls[2].init?.body));
          assertEqual(convBody.source_id, "minted-99");
        } finally {
          _resetChatwootDepsForTests();
        }
      },
    },

    {
      name: "notifyTeamOfNewBooking returns reason on conversation-create failure",
      fn: async () => {
        const calls: RecordedCall[] = [];
        _setChatwootDepsForTests({
          loadConfig: () => ({
            ok: true,
            cfg: {
              baseUrl: "https://chat",
              accountId: "1",
              token: "tok",
              inboxId: "6",
            },
          }),
          fetch: makeFakeFetch(
            [
              {
                status: 200,
                body: {
                  payload: {
                    contact: { id: 111 },
                    contact_inboxes: [{ source_id: "src-1", inbox: { id: 6 } }],
                  },
                },
              },
              { status: 500, body: { error: "boom" } },
            ],
            calls,
          ),
        });
        try {
          const r = await notifyTeamOfNewBooking({
            intent: INTENT,
            serviceName: "Diagnosis",
            durationH: 1,
          });
          assert(!r.ok);
          assert(
            typeof r.reason === "string" &&
              /conversation_create_failed/.test(r.reason),
          );
        } finally {
          _resetChatwootDepsForTests();
        }
      },
    },

    {
      name: "notifyTeamOfNewBooking never throws on network error",
      fn: async () => {
        _setChatwootDepsForTests({
          loadConfig: () => ({
            ok: true,
            cfg: {
              baseUrl: "https://chat",
              accountId: "1",
              token: "tok",
              inboxId: "6",
            },
          }),
          fetch: async () => {
            throw new Error("ECONNRESET");
          },
        });
        try {
          const r = await notifyTeamOfNewBooking({
            intent: INTENT,
            serviceName: "Diagnosis",
            durationH: 1,
          });
          assert(!r.ok);
          // The thrown ECONNRESET surfaces as contact_create_failed because
          // the failure happens at the first hop. The important thing is
          // that the call resolved with ok:false and didn't throw.
          assert(typeof r.reason === "string" && r.reason.length > 0);
        } finally {
          _resetChatwootDepsForTests();
        }
      },
    },

    {
      name: "notifyTeamOfNewBooking is idempotent on duplicate email (422 → search recovery)",
      fn: async () => {
        const calls: RecordedCall[] = [];
        // 1) contact-create 422 (already exists)
        // 2) contact search → returns existing id
        // 3) contact_inboxes mint
        // 4) conversation create
        // 5) message post
        _setChatwootDepsForTests({
          loadConfig: () => ({
            ok: true,
            cfg: {
              baseUrl: "https://chat",
              accountId: "1",
              token: "tok",
              inboxId: "6",
            },
          }),
          fetch: makeFakeFetch(
            [
              { status: 422, body: { errors: ["Email taken"] } },
              { status: 200, body: { payload: [{ id: 555 }] } },
              { status: 200, body: { source_id: "src-555" } },
              { status: 200, body: { id: 777 } },
              { status: 200, body: { id: 1234 } },
            ],
            calls,
          ),
        });
        try {
          const r = await notifyTeamOfNewBooking({
            intent: INTENT,
            serviceName: "Diagnosis",
            durationH: 1,
          });
          assert(r.ok, `expected ok, got reason: ${r.reason}`);
          assertEqual(r.conversationId, 777);
          assert(calls[1].url.includes("/contacts/search"));
        } finally {
          _resetChatwootDepsForTests();
        }
      },
    },

    {
      name: "notifyTeamOfNewBooking sends api_access_token header",
      fn: async () => {
        const calls: RecordedCall[] = [];
        _setChatwootDepsForTests({
          loadConfig: () => ({
            ok: true,
            cfg: {
              baseUrl: "https://chat",
              accountId: "1",
              token: "secret-token",
              inboxId: "6",
            },
          }),
          fetch: makeFakeFetch(
            [
              {
                status: 200,
                body: {
                  payload: {
                    contact: { id: 1 },
                    contact_inboxes: [{ source_id: "s", inbox: { id: 6 } }],
                  },
                },
              },
              { status: 200, body: { id: 2 } },
              { status: 200, body: { id: 3 } },
            ],
            calls,
          ),
        });
        try {
          const r = await notifyTeamOfNewBooking({
            intent: INTENT,
            serviceName: "Diagnosis",
            durationH: 1,
          });
          assert(r.ok);
          const headers = calls[0].init?.headers as
            | Record<string, string>
            | undefined;
          assertEqual(headers?.api_access_token, "secret-token");
          assertEqual(headers?.["Content-Type"], "application/json");
        } finally {
          _resetChatwootDepsForTests();
        }
      },
    },
  ]);
