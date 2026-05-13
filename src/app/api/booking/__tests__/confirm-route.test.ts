/**
 * Tests for `POST /api/booking/confirm`.
 *
 * Drives the route handler directly (no HTTP server). The route delegates
 * to `confirmFromToken`, which itself calls `submitConfirmedBooking`. We
 * stub the ARC + Chatwoot clients on the submit helper, sign tokens with a
 * known secret, and assert the JSON envelope mirrors `ConfirmResult`.
 *
 * Covers:
 *   - happy path: signed token + ARC ok → 200 / kind:ok
 *   - invalid token (no body) → 400 / kind:invalid-token reason:malformed
 *   - expired token → 400 / kind:invalid-token reason:expired
 *   - bad signature → 400 / kind:invalid-token reason:bad-signature
 *   - submit failure: ARC 409 → 409 / kind:submit-failed code:SLOT_TAKEN
 *   - submit failure: ARC 500 → 503 / kind:submit-failed code:ARC_DOWN
 *   - no BOOKING_TOKEN_SECRET configured → 503
 */

import { POST } from '../confirm/route';
import { signToken, type TokenPayload } from '@/lib/booking-token';
import {
  _setArcDepsForTests,
  _setChatwootDepsForTests,
  _resetDepsForTests,
  _setLoggerForTests,
  _resetLoggerForTests,
} from '@/lib/booking-arc-submit';
import { ArcError } from '../_lib/arc-client';
import { runSuite, assert, assertEqual } from './_harness';

const SECRET_HEX = 'a'.repeat(64);

const SERVICE_42 = {
  id: 42,
  title: 'Pre-purchase inspection',
  type: 'INSPECTION',
  duration_h: 1,
  price: 250,
  templateType: null,
};

function silenceLogger(): void {
  _setLoggerForTests(() => {});
}

function installOkArc(): void {
  _setArcDepsForTests({
    fetchServices: async () => [SERVICE_42],
    submitBooking: async () => undefined,
  });
}

function installFakeChatwoot(): void {
  _setChatwootDepsForTests({
    loadConfig: () => null,
    renderMessage: () => '',
    sendMessage: async () => ({ ok: true, status: 200, data: { id: 1 } }),
    setAttrs: async () => ({ ok: true, data: {} }),
  });
}

function makePayload(overrides: Partial<TokenPayload> = {}): TokenPayload {
  const now = Date.now();
  return {
    v: 2,
    id: 'test-' + Math.random().toString(36).slice(2, 10),
    iat: now,
    exp: now + 30 * 60 * 1000,
    fp: 'deadbeef',
    intent: {
      serviceId: 42,
      serviceName: 'Pre-purchase inspection',
      timeStartMs: now + 2 * 60 * 60 * 1000,
      durationH: 1,
      firstName: 'Fadi',
      lastName: 'Kelzia',
      phone: '971501234567',
      email: 'fadi@example.com',
      vehicleYear: 2022,
      vehicleMake: 'Toyota',
      vehicleModel: 'Land Cruiser',
      plate: 'A 12345',
      notes: 'Bring espresso',
    },
    ...overrides,
  };
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/booking/confirm', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function withSecret<T>(
  value: string | undefined,
  fn: () => Promise<T> | T,
): Promise<T> {
  const saved = process.env.BOOKING_TOKEN_SECRET;
  if (value === undefined) {
    delete process.env.BOOKING_TOKEN_SECRET;
  } else {
    process.env.BOOKING_TOKEN_SECRET = value;
  }
  try {
    return await fn();
  } finally {
    if (saved === undefined) delete process.env.BOOKING_TOKEN_SECRET;
    else process.env.BOOKING_TOKEN_SECRET = saved;
  }
}

export default function suite() {
  return runSuite('confirm-route', [
    {
      name: 'happy path → 200 with kind:ok and intent passthrough',
      fn: async () => {
        silenceLogger();
        installOkArc();
        installFakeChatwoot();
        try {
          await withSecret(SECRET_HEX, async () => {
            const payload = makePayload();
            const token = await signToken(payload, SECRET_HEX);
            const res = await POST(makeRequest({ token }));
            assertEqual(res.status, 200);
            const body = (await res.json()) as Record<string, unknown>;
            assertEqual(body.kind, 'ok');
            assertEqual(body.serviceName, 'Pre-purchase inspection');
            assertEqual(body.estimatedDuration, 1);
            assertEqual(body.tokenId, payload.id);
            const intent = body.intent as Record<string, unknown>;
            assertEqual(intent.email, payload.intent.email);
            assertEqual(intent.phone, payload.intent.phone);
            assertEqual(intent.firstName, payload.intent.firstName);
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'missing token in body → 400 / invalid-token / malformed',
      fn: async () => {
        silenceLogger();
        try {
          await withSecret(SECRET_HEX, async () => {
            const res = await POST(makeRequest({}));
            assertEqual(res.status, 400);
            const body = (await res.json()) as Record<string, unknown>;
            assertEqual(body.kind, 'invalid-token');
            assertEqual(body.reason, 'malformed');
          });
        } finally {
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'non-JSON body → 400 / invalid-token / malformed',
      fn: async () => {
        silenceLogger();
        try {
          await withSecret(SECRET_HEX, async () => {
            const res = await POST(makeRequest('not json'));
            assertEqual(res.status, 400);
            const body = (await res.json()) as Record<string, unknown>;
            assertEqual(body.kind, 'invalid-token');
            assertEqual(body.reason, 'malformed');
          });
        } finally {
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'expired token → 400 / invalid-token / expired',
      fn: async () => {
        silenceLogger();
        installOkArc();
        installFakeChatwoot();
        try {
          await withSecret(SECRET_HEX, async () => {
            const payload = makePayload({
              iat: Date.now() - 2 * 60 * 60 * 1000,
              exp: Date.now() - 60 * 60 * 1000,
            });
            const token = await signToken(payload, SECRET_HEX);
            const res = await POST(makeRequest({ token }));
            assertEqual(res.status, 400);
            const body = (await res.json()) as Record<string, unknown>;
            assertEqual(body.kind, 'invalid-token');
            assertEqual(body.reason, 'expired');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'bad signature → 400 / invalid-token / bad-signature',
      fn: async () => {
        silenceLogger();
        installOkArc();
        try {
          await withSecret(SECRET_HEX, async () => {
            const payload = makePayload();
            const token = await signToken(payload, 'c'.repeat(64));
            const res = await POST(makeRequest({ token }));
            assertEqual(res.status, 400);
            const body = (await res.json()) as Record<string, unknown>;
            assertEqual(body.kind, 'invalid-token');
            assertEqual(body.reason, 'bad-signature');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'ARC slot-taken → 409 / submit-failed / SLOT_TAKEN',
      fn: async () => {
        silenceLogger();
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => {
            throw new ArcError('conflict', { status: 409 });
          },
        });
        installFakeChatwoot();
        try {
          await withSecret(SECRET_HEX, async () => {
            const payload = makePayload();
            const token = await signToken(payload, SECRET_HEX);
            const res = await POST(makeRequest({ token }));
            assertEqual(res.status, 409);
            const body = (await res.json()) as Record<string, unknown>;
            assertEqual(body.kind, 'submit-failed');
            assertEqual(body.code, 'SLOT_TAKEN');
            assert(typeof body.message === 'string', 'message must be a string');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'ARC down (500) → 503 / submit-failed / ARC_DOWN',
      fn: async () => {
        silenceLogger();
        _setArcDepsForTests({
          fetchServices: async () => [SERVICE_42],
          submitBooking: async () => {
            throw new ArcError('boom', { status: 500 });
          },
        });
        installFakeChatwoot();
        try {
          await withSecret(SECRET_HEX, async () => {
            const payload = makePayload();
            const token = await signToken(payload, SECRET_HEX);
            const res = await POST(makeRequest({ token }));
            assertEqual(res.status, 503);
            const body = (await res.json()) as Record<string, unknown>;
            assertEqual(body.kind, 'submit-failed');
            assertEqual(body.code, 'ARC_DOWN');
          });
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'no BOOKING_TOKEN_SECRET configured → 503',
      fn: async () => {
        silenceLogger();
        try {
          await withSecret(undefined, async () => {
            const res = await POST(makeRequest({ token: 'anything' }));
            assertEqual(res.status, 503);
            const body = (await res.json()) as Record<string, unknown>;
            assertEqual(body.kind, 'submit-failed');
          });
        } finally {
          _resetLoggerForTests();
        }
      },
    },
  ]);
}
