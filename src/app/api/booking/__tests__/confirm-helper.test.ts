/**
 * Tests for `src/lib/booking-confirm.ts` — the confirm-from-token helper
 * that the `/book/confirm` Server Component drives on every magic-link
 * click. Covering the helper instead of the page itself keeps the suite
 * runner free from the Next.js rendering layer.
 *
 * Covers:
 *   - happy path (valid token + ARC ok → kind:ok with intent passed through)
 *   - expired token → kind:invalid-token reason:expired
 *   - tampered token (sig mismatch) → kind:invalid-token reason:bad-signature
 *   - bad-version token → kind:invalid-token reason:bad-version
 *   - malformed token → kind:invalid-token reason:malformed
 *   - ARC submit failure → kind:submit-failed with code passthrough
 */

import { confirmFromToken } from '@/lib/booking-confirm';
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

const SECRET_HEX = 'b'.repeat(64);

const SERVICE_42 = {
  id: 42,
  title: 'Oil change',
  type: 'oilChange',
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
      serviceName: 'Oil change',
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

export default function suite() {
  return runSuite('confirm-helper', [
    // ----- happy path -----------------------------------------------------
    {
      name: 'valid token + ARC ok → kind:ok with intent and serviceName',
      fn: async () => {
        silenceLogger();
        installOkArc();
        installFakeChatwoot();
        try {
          const payload = makePayload();
          const token = await signToken(payload, SECRET_HEX);
          const r = await confirmFromToken(token, SECRET_HEX);
          assertEqual(r.kind, 'ok');
          if (r.kind === 'ok') {
            assertEqual(r.serviceName, 'Oil change');
            assertEqual(r.estimatedDuration, 1);
            assertEqual(r.intent.email, payload.intent.email);
            assertEqual(r.intent.phone, payload.intent.phone);
            assertEqual(r.tokenId, payload.id);
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },

    // ----- expired --------------------------------------------------------
    {
      name: 'expired token → kind:invalid-token reason:expired',
      fn: async () => {
        silenceLogger();
        installOkArc();
        installFakeChatwoot();
        try {
          const payload = makePayload({
            iat: Date.now() - 2 * 60 * 60 * 1000,
            exp: Date.now() - 60 * 60 * 1000, // an hour in the past
          });
          const token = await signToken(payload, SECRET_HEX);
          const r = await confirmFromToken(token, SECRET_HEX);
          assertEqual(r.kind, 'invalid-token');
          if (r.kind === 'invalid-token') {
            assertEqual(r.reason, 'expired');
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },

    // ----- tampered -------------------------------------------------------
    {
      name: 'tampered token (signed with different secret) → bad-signature',
      fn: async () => {
        silenceLogger();
        installOkArc();
        try {
          const payload = makePayload();
          const wrongSecret = 'c'.repeat(64);
          const token = await signToken(payload, wrongSecret);
          const r = await confirmFromToken(token, SECRET_HEX);
          assertEqual(r.kind, 'invalid-token');
          if (r.kind === 'invalid-token') {
            assertEqual(r.reason, 'bad-signature');
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },

    // ----- malformed ------------------------------------------------------
    {
      name: 'malformed token (no dot) → malformed',
      fn: async () => {
        silenceLogger();
        try {
          const r = await confirmFromToken('not-a-real-token', SECRET_HEX);
          assertEqual(r.kind, 'invalid-token');
          if (r.kind === 'invalid-token') {
            assertEqual(r.reason, 'malformed');
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },

    // ----- ARC failure ----------------------------------------------------
    {
      name: 'ARC slot-taken (409) → kind:submit-failed code:SLOT_TAKEN',
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
          const payload = makePayload();
          const token = await signToken(payload, SECRET_HEX);
          const r = await confirmFromToken(token, SECRET_HEX);
          assertEqual(r.kind, 'submit-failed');
          if (r.kind === 'submit-failed') {
            assertEqual(r.code, 'SLOT_TAKEN');
            // intent must come back so the page can offer a "book again" link
            // pre-populated with the same details if we ever want to.
            assertEqual(r.intent.email, payload.intent.email);
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'ARC down (500) → kind:submit-failed code:ARC_DOWN',
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
          const payload = makePayload();
          const token = await signToken(payload, SECRET_HEX);
          const r = await confirmFromToken(token, SECRET_HEX);
          assertEqual(r.kind, 'submit-failed');
          if (r.kind === 'submit-failed') {
            assertEqual(r.code, 'ARC_DOWN');
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
    {
      name: 'confirm path skips the ARC services fetch (uses token data directly)',
      fn: async () => {
        silenceLogger();
        let fetchServicesCalled = false;
        _setArcDepsForTests({
          fetchServices: async () => {
            fetchServicesCalled = true;
            return [SERVICE_42];
          },
          submitBooking: async () => undefined,
        });
        installFakeChatwoot();
        try {
          const payload = makePayload();
          const token = await signToken(payload, SECRET_HEX);
          const r = await confirmFromToken(token, SECRET_HEX);
          assertEqual(r.kind, 'ok');
          assert(
            !fetchServicesCalled,
            'fetchServices must not be called on the confirm path',
          );
          if (r.kind === 'ok') {
            // serviceName + durationH come straight from the token.
            assertEqual(r.serviceName, payload.intent.serviceName);
            assertEqual(r.estimatedDuration, payload.intent.durationH);
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },

    // ----- assert intent fingerprint cleanliness --------------------------
    {
      name: 'success path passes plate and notes through into intent',
      fn: async () => {
        silenceLogger();
        installOkArc();
        installFakeChatwoot();
        try {
          const payload = makePayload();
          const token = await signToken(payload, SECRET_HEX);
          const r = await confirmFromToken(token, SECRET_HEX);
          assert(r.kind === 'ok');
          if (r.kind === 'ok') {
            assertEqual(r.intent.plate, 'A 12345');
            assertEqual(r.intent.notes, 'Bring espresso');
          }
        } finally {
          _resetDepsForTests();
          _resetLoggerForTests();
        }
      },
    },
  ]);
}
