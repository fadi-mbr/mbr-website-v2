/**
 * Tests for src/app/api/booking/agent/route.ts.
 *
 * We mock the ARC + Chatwoot dependencies via the `_setArcDepsForTests` /
 * `_setChatwootDepsForTests` seams on `@/lib/booking-arc-submit`, and drive
 * the `POST` handler directly (no HTTP server).
 *
 * Covers:
 *   - auth (missing header, wrong secret, right secret)
 *   - validation (missing conversationId, bad body)
 *   - happy path (asserts submitConfirmedBooking is invoked with the right
 *     intent + chatwoot options) — verified by capturing the ARC fake's
 *     submitBooking call
 *   - rate-limit (second submit within the hour → 429; `?force=true` bypass)
 *   - ARC failure → 503
 */

import {
  POST,
  timingSafeStringEqual,
  writeBackVehicleAttrs,
  _setContactAttrsDepsForTests,
  _resetContactAttrsDepsForTests,
} from '../agent/route';
import {
  _setArcDepsForTests,
  _setChatwootDepsForTests,
  _resetDepsForTests,
  _setLoggerForTests,
  _resetLoggerForTests,
} from '@/lib/booking-arc-submit';
import { ArcError } from '../_lib/arc-client';
import { _resetForTests as _resetRateLimitForTests } from '../_lib/rate-limit';
import { runSuite, assert, assertEqual } from './_harness';

const SECRET = 'shhh-its-a-secret';

const SERVICE_42 = {
  id: 42,
  title: 'Oil change',
  type: 'oilChange',
  duration_h: 1,
  price: 250,
  templateType: null,
};

interface OkBody {
  serviceId: number;
  timeStartMs: number;
  ownerNameFirst: string;
  ownerNameLast: string;
  ownerPhone: string;
  ownerEmail: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate?: string;
  notes?: string;
  conversationId: number;
  contactId: number;
}

function makeBody(overrides: Partial<OkBody> = {}): OkBody {
  // timeStartMs must be > now+30min for the validator to accept it.
  const inTwoHours = Date.now() + 2 * 60 * 60 * 1000;
  return {
    serviceId: 42,
    timeStartMs: inTwoHours,
    ownerNameFirst: 'Fadi',
    ownerNameLast: 'Kelzia',
    ownerPhone: '971501234567',
    ownerEmail: 'fadi@example.com',
    vehicleYear: 2022,
    vehicleMake: 'Toyota',
    vehicleModel: 'Land Cruiser',
    vehiclePlate: 'A 12345',
    notes: 'Bring espresso',
    conversationId: 123,
    contactId: 456,
    ...overrides,
  };
}

function makeRequest(
  body: unknown,
  init: { secret?: string; url?: string } = {}
): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (init.secret !== undefined) {
    headers['x-mbr-agent-secret'] = init.secret;
  }
  return new Request(init.url ?? 'http://localhost/api/booking/agent', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function withEnv<T>(
  patch: Record<string, string | undefined>,
  fn: () => Promise<T> | T
): Promise<T> {
  const saved: Record<string, string | undefined> = {};
  for (const k of Object.keys(patch)) {
    saved[k] = process.env[k];
    if (patch[k] === undefined) delete process.env[k];
    else process.env[k] = patch[k]!;
  }
  const restore = () => {
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k]!;
    }
  };
  return Promise.resolve()
    .then(fn)
    .finally(restore) as Promise<T>;
}

function silenceLogger(): void {
  _setLoggerForTests(() => {});
}

function installFakeChatwoot(): void {
  _setChatwootDepsForTests({
    loadConfig: () => null,
    renderMessage: () => '',
    sendMessage: async () => ({ ok: true, status: 200, data: { id: 1 } }),
    setAttrs: async () => ({ ok: true, data: {} }),
  });
}

function installOkArc(opts: {
  onSubmit?: (body: unknown, serviceId: number) => void;
} = {}) {
  _setArcDepsForTests({
    fetchServices: async () => [SERVICE_42],
    submitBooking: async (body, serviceId) => {
      opts.onSubmit?.(body, serviceId);
      return undefined;
    },
  });
}

export default function suite() {
  return runSuite('agent-route', [
    // -------- pure helper --------
    {
      name: 'timingSafeStringEqual returns true for equal strings',
      fn: () => {
        assertEqual(timingSafeStringEqual('hello', 'hello'), true);
      },
    },
    {
      name: 'timingSafeStringEqual returns false on length mismatch',
      fn: () => {
        assertEqual(timingSafeStringEqual('hello', 'hellox'), false);
      },
    },
    {
      name: 'timingSafeStringEqual returns false on empty input',
      fn: () => {
        assertEqual(timingSafeStringEqual('', 'whatever'), false);
        assertEqual(timingSafeStringEqual('something', ''), false);
      },
    },

    // -------- auth --------
    {
      name: 'missing x-mbr-agent-secret → 401',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
          const res = await POST(makeRequest(makeBody()));
          assertEqual(res.status, 401);
          const body = (await res.json()) as { ok: boolean; code: string };
          assertEqual(body.ok, false);
          assertEqual(body.code, 'AUTH');
        });
        _resetLoggerForTests();
      },
    },
    {
      name: 'wrong secret → 401',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
          const res = await POST(
            makeRequest(makeBody(), { secret: 'wrong-secret' })
          );
          assertEqual(res.status, 401);
        });
        _resetLoggerForTests();
      },
    },
    {
      name: 'no BOOKING_AGENT_SECRET configured → 401',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        await withEnv({ BOOKING_AGENT_SECRET: undefined }, async () => {
          const res = await POST(
            makeRequest(makeBody(), { secret: SECRET })
          );
          assertEqual(res.status, 401);
        });
        _resetLoggerForTests();
      },
    },

    // -------- validation --------
    {
      name: 'missing conversationId → 400 VALIDATION',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        installOkArc();
        installFakeChatwoot();
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const body = makeBody();
            // @ts-expect-error — deliberately omitting for the test
            delete body.conversationId;
            const res = await POST(
              makeRequest(body, { secret: SECRET })
            );
            assertEqual(res.status, 400);
            const j = (await res.json()) as { ok: boolean; code: string; field: string };
            assertEqual(j.ok, false);
            assertEqual(j.code, 'VALIDATION');
            assertEqual(j.field, 'conversationId');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'missing contactId → 400 VALIDATION',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        installOkArc();
        installFakeChatwoot();
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const body = makeBody();
            // @ts-expect-error — deliberately omitting for the test
            delete body.contactId;
            const res = await POST(
              makeRequest(body, { secret: SECRET })
            );
            assertEqual(res.status, 400);
            const j = (await res.json()) as { field: string };
            assertEqual(j.field, 'contactId');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'bad email → 400 VALIDATION',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        installOkArc();
        installFakeChatwoot();
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const res = await POST(
              makeRequest(makeBody({ ownerEmail: 'not-an-email' }), {
                secret: SECRET,
              })
            );
            assertEqual(res.status, 400);
            const j = (await res.json()) as { code: string; field: string };
            assertEqual(j.code, 'VALIDATION');
            assertEqual(j.field, 'ownerEmail');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'malformed JSON body → 400',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
          const req = new Request('http://localhost/api/booking/agent', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-mbr-agent-secret': SECRET,
            },
            body: '{not-json',
          });
          const res = await POST(req);
          assertEqual(res.status, 400);
        });
        _resetLoggerForTests();
      },
    },

    // -------- happy path --------
    {
      name: 'right secret + valid body → 200 with arcAppointmentId omitted (helper does not surface it)',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        let captured: { body: unknown; serviceId: number } | null = null;
        installOkArc({
          onSubmit: (body, serviceId) => {
            captured = { body, serviceId };
          },
        });
        installFakeChatwoot();
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const res = await POST(
              makeRequest(makeBody(), { secret: SECRET })
            );
            assertEqual(res.status, 200);
            const j = (await res.json()) as {
              ok: boolean;
              serviceName: string;
              estimatedDuration: number;
              confirmAt: string;
            };
            assertEqual(j.ok, true);
            assertEqual(j.serviceName, 'Oil change');
            assertEqual(j.estimatedDuration, 1);
            assert(typeof j.confirmAt === 'string' && j.confirmAt.length > 0);
            assert(captured !== null, 'submitBooking should have been called');
            if (captured !== null) {
              const cap = captured as { body: unknown; serviceId: number };
              assertEqual(cap.serviceId, 42);
              const arcBody = cap.body as Record<string, unknown>;
              assertEqual(arcBody.ownerEmail, 'fadi@example.com');
              assertEqual(arcBody.ownerNameFirst, 'Fadi');
              assertEqual(arcBody.ownerPhone, '971501234567');
              assertEqual(arcBody.vehicleMake, 'Toyota');
              assertEqual(arcBody.concern, 'Plate: A 12345');
            }
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'happy path passes chatwoot conversationId+contactId through to submitConfirmedBooking',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        installOkArc();
        let sentToConversation: number | null = null;
        _setChatwootDepsForTests({
          loadConfig: () => ({
            baseUrl: 'https://chat',
            accountId: '1',
            token: 'tok',
          }),
          renderMessage: () => 'Booked!',
          sendMessage: async (_cfg, input) => {
            sentToConversation = input.conversationId;
            return { ok: true, status: 200, data: { id: 7 } };
          },
          setAttrs: async () => ({ ok: true, data: {} }),
        });
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const res = await POST(
              makeRequest(
                makeBody({ conversationId: 999, contactId: 8 }),
                { secret: SECRET }
              )
            );
            assertEqual(res.status, 200);
            assertEqual(sentToConversation, 999);
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },

    // -------- rate limit --------
    {
      name: 'same phone twice → second call returns 429',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        installOkArc();
        installFakeChatwoot();
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const r1 = await POST(
              makeRequest(makeBody(), { secret: SECRET })
            );
            assertEqual(r1.status, 200);
            const r2 = await POST(
              makeRequest(makeBody(), { secret: SECRET })
            );
            assertEqual(r2.status, 429);
            const j2 = (await r2.json()) as { code: string };
            assertEqual(j2.code, 'RATE_LIMIT');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: '?force=true bypasses the rate limit for advisor retries',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        installOkArc();
        installFakeChatwoot();
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const r1 = await POST(
              makeRequest(makeBody(), { secret: SECRET })
            );
            assertEqual(r1.status, 200);
            const r2 = await POST(
              makeRequest(makeBody(), {
                secret: SECRET,
                url: 'http://localhost/api/booking/agent?force=true',
              })
            );
            assertEqual(r2.status, 200);
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },

    // -------- ARC failure --------
    {
      name: 'ARC down → 503 ARC_DOWN',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => {
            throw new ArcError('boom', { status: 500 });
          },
        });
        installFakeChatwoot();
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const res = await POST(
              makeRequest(makeBody(), { secret: SECRET })
            );
            assertEqual(res.status, 503);
            const j = (await res.json()) as { ok: boolean; code: string };
            assertEqual(j.ok, false);
            assertEqual(j.code, 'ARC_DOWN');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'ARC 409 → 409 SLOT_TAKEN',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => {
            throw new ArcError('conflict', { status: 409 });
          },
        });
        installFakeChatwoot();
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const res = await POST(
              makeRequest(makeBody(), { secret: SECRET })
            );
            assertEqual(res.status, 409);
            const j = (await res.json()) as { code: string };
            assertEqual(j.code, 'SLOT_TAKEN');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    // -------- write-back to Chatwoot contact custom_attributes --------
    {
      name: 'writeBackVehicleAttrs no-ops when Chatwoot config missing',
      fn: async () => {
        let updateCalls = 0;
        _setContactAttrsDepsForTests({
          loadConfig: () => null,
          updateAttrs: async () => {
            updateCalls++;
            return { ok: true, data: { id: 1 } };
          },
        });
        try {
          await writeBackVehicleAttrs({
            contactId: 5,
            vehicleYear: 2023,
            vehicleMake: 'Ferrari',
            vehicleModel: '296 GTB',
            vehiclePlate: 'Dubai M 12345',
          });
          assertEqual(updateCalls, 0);
        } finally {
          _resetContactAttrsDepsForTests();
        }
      },
    },
    {
      name: 'writeBackVehicleAttrs PATCHes the four vehicle attrs when plate present',
      fn: async () => {
        let captured: {
          contactId: number;
          attrs: Record<string, unknown>;
        } | null = null;
        _setContactAttrsDepsForTests({
          loadConfig: () => ({
            baseUrl: 'https://chat',
            accountId: '1',
            token: 't',
          }),
          updateAttrs: async (_cfg, contactId, attrs) => {
            captured = { contactId, attrs };
            return { ok: true, data: { id: contactId } };
          },
        });
        try {
          await writeBackVehicleAttrs({
            contactId: 5,
            vehicleYear: 2023,
            vehicleMake: 'Ferrari',
            vehicleModel: '296 GTB',
            vehiclePlate: 'Dubai M 12345',
          });
          assert(captured !== null, 'updateAttrs should have been called');
          const cap = captured as unknown as {
            contactId: number;
            attrs: Record<string, unknown>;
          };
          assertEqual(cap.contactId, 5);
          assertEqual(cap.attrs, {
            vehicle_year: 2023,
            vehicle_make: 'Ferrari',
            vehicle_model: '296 GTB',
            vehicle_plate: 'Dubai M 12345',
          });
        } finally {
          _resetContactAttrsDepsForTests();
        }
      },
    },
    {
      name: 'writeBackVehicleAttrs omits plate key when plate empty',
      fn: async () => {
        let captured: Record<string, unknown> | null = null;
        _setContactAttrsDepsForTests({
          loadConfig: () => ({
            baseUrl: 'https://chat',
            accountId: '1',
            token: 't',
          }),
          updateAttrs: async (_cfg, _contactId, attrs) => {
            captured = attrs;
            return { ok: true, data: { id: 1 } };
          },
        });
        try {
          await writeBackVehicleAttrs({
            contactId: 5,
            vehicleYear: 2023,
            vehicleMake: 'Ferrari',
            vehicleModel: '296 GTB',
          });
          assert(captured !== null);
          const c = captured as unknown as Record<string, unknown>;
          assertEqual('vehicle_plate' in c, false);
          assertEqual(c.vehicle_year, 2023);
          assertEqual(c.vehicle_make, 'Ferrari');
          assertEqual(c.vehicle_model, '296 GTB');
        } finally {
          _resetContactAttrsDepsForTests();
        }
      },
    },
    {
      name: 'writeBackVehicleAttrs swallows network errors',
      fn: async () => {
        silenceLogger();
        _setContactAttrsDepsForTests({
          loadConfig: () => ({
            baseUrl: 'https://chat',
            accountId: '1',
            token: 't',
          }),
          updateAttrs: async () => {
            throw new Error('boom');
          },
        });
        try {
          // Must not throw.
          await writeBackVehicleAttrs({
            contactId: 5,
            vehicleYear: 2023,
            vehicleMake: 'Ferrari',
            vehicleModel: '296 GTB',
          });
        } finally {
          _resetContactAttrsDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'happy-path POST schedules contact attrs write-back via after()',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        installOkArc();
        installFakeChatwoot();
        let captured: {
          contactId: number;
          attrs: Record<string, unknown>;
        } | null = null;
        _setContactAttrsDepsForTests({
          loadConfig: () => ({
            baseUrl: 'https://chat',
            accountId: '1',
            token: 't',
          }),
          updateAttrs: async (_cfg, contactId, attrs) => {
            captured = { contactId, attrs };
            return { ok: true, data: { id: contactId } };
          },
        });
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const res = await POST(
              makeRequest(makeBody({ contactId: 5 }), { secret: SECRET }),
            );
            assertEqual(res.status, 200);
            // `after()` runs the callback after the response is sent. In the
            // test harness (no real Next runtime) `after()` may run sync, but
            // it's not guaranteed — give it a microtask tick to drain.
            await new Promise((r) => setTimeout(r, 0));
            assert(
              captured !== null,
              'expected the after() callback to write back vehicle attrs',
            );
            const cap = captured as unknown as {
              contactId: number;
              attrs: Record<string, unknown>;
            };
            assertEqual(cap.contactId, 5);
            assertEqual(cap.attrs.vehicle_make, 'Toyota');
            assertEqual(cap.attrs.vehicle_model, 'Land Cruiser');
            assertEqual(cap.attrs.vehicle_year, 2022);
            assertEqual(cap.attrs.vehicle_plate, 'A 12345');
          });
        } finally {
          _resetDepsForTests();
          _resetContactAttrsDepsForTests();
          _resetLoggerForTests();
        }
      },
    },

    {
      name: 'unknown service id → 400 UNKNOWN_SERVICE',
      fn: async () => {
        silenceLogger();
        _resetRateLimitForTests();
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => undefined,
        });
        installFakeChatwoot();
        try {
          await withEnv({ BOOKING_AGENT_SECRET: SECRET }, async () => {
            const res = await POST(
              makeRequest(makeBody({ serviceId: 9999 }), { secret: SECRET })
            );
            assertEqual(res.status, 400);
            const j = (await res.json()) as { code: string };
            assertEqual(j.code, 'UNKNOWN_SERVICE');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
  ]);
}
