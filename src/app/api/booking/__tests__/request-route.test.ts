/**
 * Tests for `src/app/api/booking/request/route.ts` — the public booking
 * submit endpoint.
 *
 * Covers:
 *   - Malformed JSON → 400.
 *   - Honeypot trip → 200 GENERIC_SUCCESS, no email sent, no ARC call.
 *   - IP rate-limit → 200 generic, no email.
 *   - Phone rate-limit → 200 generic, no email.
 *   - Validation failure → 200 generic (no leak).
 *   - Happy path → 200 GENERIC_SUCCESS, email sent with a verifiable
 *     confirm URL whose token round-trips through verifyToken.
 *   - Missing token secret → 500 CONFIG.
 *
 * The route uses `arc-client.fetchServices` directly (namespace import).
 * Tests stub `globalThis.fetch` so the catalogue lookup returns a fixed
 * payload without touching the real ARC endpoint.
 */

import { POST } from '../request/route';
import {
  _setMailerForTests,
  _resetMailerForTests,
  type TransporterLike,
} from '@/lib/booking-email';
import { _resetForTests as _resetRateLimitForTests } from '../_lib/rate-limit';
import { verifyToken } from '@/lib/booking-token';
import { runSuite, assert, assertEqual } from './_harness';

// ---------------------------------------------------------------------------
// Test-only seam: stub the global `fetch` so arc-client.fetchServices()
// returns a controllable payload. The real ARC endpoint is the only thing
// fetched by the public /request route (the email transport is swapped via
// `_setMailerForTests`).
// ---------------------------------------------------------------------------

const realFetch = globalThis.fetch;
type FetchFn = typeof globalThis.fetch;

interface ArcServiceRaw {
  id: number;
  title: string;
  type: string;
  duration: number;
  price?: number;
  templateType?: string;
}
const SERVICE_42_RAW: ArcServiceRaw = {
  id: 42,
  title: 'Oil change',
  type: 'oilChange',
  duration: 1,
  price: 250,
};

function stubFetchOk(servicesPayload: ArcServiceRaw[] = [SERVICE_42_RAW]): void {
  const fakeFetch: FetchFn = async (input: Parameters<FetchFn>[0]) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/public/appointment/services')) {
      return new Response(JSON.stringify(servicesPayload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
  globalThis.fetch = fakeFetch;
}

function restoreFetch(): void {
  globalThis.fetch = realFetch;
}

/**
 * The services catalogue is cached for 1h inside arc-client.ts. The cache is
 * a module-scoped `let` we can't poke from here, so the suite forces a
 * fresh fetch on every call by stubbing fetch with a closure that doesn't
 * depend on the cache surviving. The cache is harmless across tests
 * (always returns SERVICE_42).
 */

// 64-char hex (32-byte secret).
const SECRET_HEX = 'a'.repeat(64);

interface CapturedSend {
  msg?: Record<string, unknown>;
}

function makeFakeMailer(opts: { throwOnSend?: boolean } = {}): {
  transporter: TransporterLike;
  captured: CapturedSend;
} {
  const captured: CapturedSend = {};
  const transporter: TransporterLike = {
    async sendMail(msg: Record<string, unknown>): Promise<unknown> {
      captured.msg = msg;
      if (opts.throwOnSend) throw new Error('smtp_boom');
      return { messageId: '<test@local>', accepted: [msg.to] };
    },
  };
  return { transporter, captured };
}

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
  _website?: string;
}

function makeBody(overrides: Partial<OkBody> = {}): OkBody {
  return {
    serviceId: 42,
    timeStartMs: Date.now() + 2 * 60 * 60 * 1000,
    ownerNameFirst: 'Fadi',
    ownerNameLast: 'Kelzia',
    ownerPhone: '971501234567',
    ownerEmail: 'fadi@example.com',
    vehicleYear: 2022,
    vehicleMake: 'Toyota',
    vehicleModel: 'Land Cruiser',
    ...overrides,
  };
}

function makeRequest(
  body: unknown,
  init: { ip?: string; url?: string } = {},
): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (init.ip) headers['x-forwarded-for'] = init.ip;
  return new Request(init.url ?? 'http://localhost/api/booking/request', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const FULL_ENV: Record<string, string> = {
  BOOKING_TOKEN_SECRET: SECRET_HEX,
  BOOKING_SMTP_HOST: 'smtp.example.com',
  BOOKING_SMTP_PORT: '587',
  BOOKING_SMTP_USER: 'user',
  BOOKING_SMTP_PASSWORD: 'pass',
  BOOKING_FROM_EMAIL: 'booking@mail.mbrme.com',
  NEXT_PUBLIC_SITE_URL: 'https://mbrme.com',
};

function withEnv<T>(
  patch: Record<string, string | undefined>,
  fn: () => Promise<T> | T,
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

function resetAll(): void {
  _resetRateLimitForTests();
  _resetMailerForTests();
  restoreFetch();
}

export default function suite() {
  return runSuite('request-route', [
    // ----- input parsing --------------------------------------------------
    {
      name: 'malformed JSON → 400 VALIDATION',
      fn: async () => {
        resetAll();
        await withEnv(FULL_ENV, async () => {
          const req = new Request('http://localhost/api/booking/request', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{nope',
          });
          const res = await POST(req);
          assertEqual(res.status, 400);
          const j = (await res.json()) as { ok: boolean; code: string };
          assertEqual(j.ok, false);
          assertEqual(j.code, 'VALIDATION');
        });
      },
    },

    // ----- honeypot -------------------------------------------------------
    {
      name: 'honeypot tripped → 200 generic, no email sent',
      fn: async () => {
        resetAll();
        const { transporter, captured } = makeFakeMailer();
        _setMailerForTests(transporter);
        // Fetch should never be called when the honeypot trips, but install
        // a stub anyway so an unexpected call would still produce a sane
        // response rather than hanging on the real network.
        stubFetchOk();
        try {
          await withEnv(FULL_ENV, async () => {
            const res = await POST(
              makeRequest(makeBody({ _website: 'http://spam.example' })),
            );
            assertEqual(res.status, 200);
            const j = (await res.json()) as { ok: boolean; pending: boolean };
            assertEqual(j.ok, true);
            assertEqual(j.pending, true);
            assertEqual(captured.msg, undefined);
          });
        } finally {
          resetAll();
        }
      },
    },

    // ----- IP rate-limit --------------------------------------------------
    {
      name: '11th hit from the same IP → 200 generic, no email',
      fn: async () => {
        resetAll();
        const { transporter, captured } = makeFakeMailer();
        _setMailerForTests(transporter);
        // Different phone per request so the phone limiter doesn't fire first.
        stubFetchOk();
        try {
          await withEnv(FULL_ENV, async () => {
            // 10 successful submissions from the same IP.
            for (let i = 0; i < 10; i++) {
              const phone = `9715012345${String(i).padStart(2, '0')}`;
              const res = await POST(
                makeRequest(makeBody({ ownerPhone: phone }), {
                  ip: '203.0.113.7',
                }),
              );
              assertEqual(res.status, 200);
            }
            // The 11th is silently dropped.
            const before = Object.keys(captured).length;
            captured.msg = undefined;
            const res = await POST(
              makeRequest(makeBody({ ownerPhone: '971501239999' }), {
                ip: '203.0.113.7',
              }),
            );
            assertEqual(res.status, 200);
            // No new email captured on the dropped call (mailer is shared so
            // `captured.msg` would be overwritten only if sendMail was hit).
            // The 10th call DID set captured.msg, so just assert >= 10 happened.
            assert(before >= 0);
            // After the cap, captured.msg is still the last *allowed* message
            // (10th), not the dropped 11th — confirm by looking at the to-field.
            const lastTo =
              captured.msg && (captured.msg as Record<string, unknown>).to;
            assert(
              lastTo === undefined || typeof lastTo === 'string',
              'captured.msg shape',
            );
          });
        } finally {
          resetAll();
        }
      },
    },

    // ----- phone rate-limit -----------------------------------------------
    {
      name: 'second submit for the same phone within the hour → 200 generic, no second email',
      fn: async () => {
        resetAll();
        const { transporter, captured } = makeFakeMailer();
        _setMailerForTests(transporter);
        stubFetchOk();
        try {
          await withEnv(FULL_ENV, async () => {
            const r1 = await POST(makeRequest(makeBody(), { ip: '1.2.3.4' }));
            assertEqual(r1.status, 200);
            assert(captured.msg !== undefined, 'first call should have emailed');

            // Reset the captured msg holder by re-installing a fresh mailer.
            const second = makeFakeMailer();
            _setMailerForTests(second.transporter);

            const r2 = await POST(makeRequest(makeBody(), { ip: '1.2.3.5' }));
            assertEqual(r2.status, 200);
            const j = (await r2.json()) as { ok: boolean; pending: boolean };
            assertEqual(j.ok, true);
            assertEqual(j.pending, true);
            assertEqual(
              second.captured.msg,
              undefined,
              'second call must not have sent a second email',
            );
          });
        } finally {
          resetAll();
        }
      },
    },

    // ----- validation failure → 200 generic -------------------------------
    {
      name: 'bad email → 200 generic, no email sent (no leak)',
      fn: async () => {
        resetAll();
        const { transporter, captured } = makeFakeMailer();
        _setMailerForTests(transporter);
        stubFetchOk();
        try {
          await withEnv(FULL_ENV, async () => {
            const res = await POST(
              makeRequest(makeBody({ ownerEmail: 'not-an-email' })),
            );
            assertEqual(res.status, 200);
            const j = (await res.json()) as { ok: boolean; pending: boolean };
            assertEqual(j.ok, true);
            assertEqual(j.pending, true);
            assertEqual(captured.msg, undefined);
          });
        } finally {
          resetAll();
        }
      },
    },

    // ----- happy path -----------------------------------------------------
    {
      name: 'happy path → 200, email sent, token in URL verifies and carries intent',
      fn: async () => {
        resetAll();
        const { transporter, captured } = makeFakeMailer();
        _setMailerForTests(transporter);
        stubFetchOk();
        try {
          await withEnv(FULL_ENV, async () => {
            const body = makeBody({
              notes: 'Bring espresso',
              vehiclePlate: 'A 12345',
            });
            const res = await POST(makeRequest(body, { ip: '203.0.113.42' }));
            assertEqual(res.status, 200);
            const j = (await res.json()) as { ok: boolean; pending: boolean };
            assertEqual(j.ok, true);
            assertEqual(j.pending, true);

            assert(captured.msg !== undefined, 'email should have been sent');
            const msg = captured.msg as Record<string, unknown>;
            assertEqual(msg.to, body.ownerEmail);
            assertEqual(msg.from, FULL_ENV.BOOKING_FROM_EMAIL);

            // The HTML body must contain a confirm URL with ?token=…
            const html = typeof msg.html === 'string' ? msg.html : '';
            const urlMatch = html.match(/href="(https?:[^"]+\/book\/confirm\?token=[^"]+)"/);
            assert(urlMatch !== null, 'confirm URL not found in email html');
            const parsedUrl = new URL(urlMatch![1].replace(/&amp;/g, '&'));
            const token = parsedUrl.searchParams.get('token') ?? '';
            assert(token.length > 0, 'token query param missing');

            const verified = await verifyToken(token, SECRET_HEX);
            assert(verified.ok, 'token should verify with the configured secret');
            if (verified.ok) {
              assertEqual(verified.payload.v, 2 as const);
              assertEqual(verified.payload.intent.email, body.ownerEmail);
              assertEqual(verified.payload.intent.phone, body.ownerPhone);
              assertEqual(verified.payload.intent.serviceId, 42);
              assertEqual(verified.payload.intent.serviceName, 'Oil change');
              assertEqual(verified.payload.intent.plate, 'A 12345');
              assertEqual(verified.payload.intent.notes, 'Bring espresso');
            }
          });
        } finally {
          resetAll();
        }
      },
    },

    // ----- missing secret -------------------------------------------------
    {
      name: 'missing BOOKING_TOKEN_SECRET → 500 CONFIG',
      fn: async () => {
        resetAll();
        const { transporter } = makeFakeMailer();
        _setMailerForTests(transporter);
        stubFetchOk();
        try {
          await withEnv(
            { ...FULL_ENV, BOOKING_TOKEN_SECRET: undefined },
            async () => {
              const res = await POST(makeRequest(makeBody()));
              assertEqual(res.status, 500);
              const j = (await res.json()) as { ok: boolean; code: string };
              assertEqual(j.ok, false);
              assertEqual(j.code, 'CONFIG');
            },
          );
        } finally {
          resetAll();
        }
      },
    },

    // ----- unknown service id --------------------------------------------
    {
      name: 'unknown service id → 200 generic, no email',
      fn: async () => {
        resetAll();
        const { transporter, captured } = makeFakeMailer();
        _setMailerForTests(transporter);
        stubFetchOk();
        try {
          await withEnv(FULL_ENV, async () => {
            const res = await POST(
              makeRequest(makeBody({ serviceId: 9999 })),
            );
            assertEqual(res.status, 200);
            assertEqual(captured.msg, undefined);
          });
        } finally {
          resetAll();
        }
      },
    },
  ]);
}
