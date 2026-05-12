/**
 * Tests for src/app/api/booking/embed-context/route.ts and the supporting
 * `fetchContact` helper in src/lib/chatwoot-client.ts.
 *
 * We mock `globalThis.fetch` to simulate Chatwoot, then drive the route's
 * `POST` handler directly (no HTTP server). Per the route's design, every
 * non-success path must still resolve with HTTP 200 + `ok:false` so the
 * wizard never breaks on a Chatwoot hiccup — the one exception is
 * "Chatwoot not configured" which is 503 (deploy-config problem).
 */

import { POST, projectContact } from '../embed-context/route';
import { fetchContact } from '../../../../lib/chatwoot-client';
import { runSuite, assertEqual, assert } from './_harness';

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

interface StubResponseSpec {
  status?: number;
  body?: unknown;
  /** If set, the stub throws this on call (simulates network error / abort). */
  throws?: Error;
  /** If set, await this delay before resolving (simulates slow Chatwoot). */
  delayMs?: number;
}

function installFetchStub(spec: StubResponseSpec): () => void {
  const original = globalThis.fetch;
  const stub: typeof fetch = async (_url: FetchInput, init?: FetchInit) => {
    if (spec.delayMs && init?.signal) {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, spec.delayMs);
        init.signal!.addEventListener('abort', () => {
          clearTimeout(t);
          // Mirror node-fetch / undici behaviour on abort.
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    } else if (spec.delayMs) {
      await new Promise((r) => setTimeout(r, spec.delayMs));
    }
    if (spec.throws) throw spec.throws;
    const status = spec.status ?? 200;
    const body = typeof spec.body === 'string' ? spec.body : JSON.stringify(spec.body ?? {});
    return new Response(body, {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  globalThis.fetch = stub as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function withEnv<T>(patch: Record<string, string | undefined>, fn: () => Promise<T> | T): Promise<T> {
  const saved: Record<string, string | undefined> = {};
  for (const k of Object.keys(patch)) {
    saved[k] = process.env[k];
    if (patch[k] === undefined) delete process.env[k];
    else process.env[k] = patch[k];
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

function makeRequest(body: unknown): Request {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
  return new Request('http://localhost/api/booking/embed-context', init);
}

const CHATWOOT_ENV = {
  CHATWOOT_ADMIN_API_TOKEN: 'test-token',
  CHATWOOT_BASE_URL: 'https://connect.example.test',
  CHATWOOT_ACCOUNT_ID: '1',
};

export default function suite() {
  return runSuite('embed-context route + fetchContact', [
    // ---- projectContact (pure) ----
    {
      name: 'projectContact returns null when no usable fields',
      fn: () => {
        assertEqual(projectContact({ id: 1 }), null);
      },
    },
    {
      name: 'projectContact extracts name/email/phone',
      fn: () => {
        const out = projectContact({
          id: 1,
          name: 'Faisal',
          email: 'f@x.com',
          phone_number: '+971501234567',
        });
        assertEqual(out, { name: 'Faisal', email: 'f@x.com', phone: '971501234567' });
      },
    },
    {
      name: 'projectContact drops malformed email',
      fn: () => {
        const out = projectContact({ id: 1, email: 'not-an-email' });
        assertEqual(out, null);
      },
    },
    {
      name: 'projectContact drops phone shorter than 6 digits',
      fn: () => {
        const out = projectContact({ id: 1, phone_number: '+123' });
        assertEqual(out, null);
      },
    },

    // ---- fetchContact (network) ----
    {
      name: 'fetchContact parses a v3-style envelope',
      fn: async () => {
        const restore = installFetchStub({
          status: 200,
          body: { id: 7, name: 'Faisal', email: 'f@x.com', phone_number: '+971501234567' },
        });
        try {
          const cfg = { baseUrl: 'https://c.test', accountId: '1', token: 't' };
          const r = await fetchContact(cfg, 7);
          assert(r.ok, 'expected ok=true');
          if (r.ok) {
            assertEqual(r.data.id, 7);
            assertEqual(r.data.name, 'Faisal');
            assertEqual(r.data.email, 'f@x.com');
            assertEqual(r.data.phone_number, '+971501234567');
          }
        } finally {
          restore();
        }
      },
    },
    {
      name: 'fetchContact parses a v4-style { payload: {...} } envelope',
      fn: async () => {
        const restore = installFetchStub({
          status: 200,
          body: { payload: { id: 8, name: 'Layla' } },
        });
        try {
          const cfg = { baseUrl: 'https://c.test', accountId: '1', token: 't' };
          const r = await fetchContact(cfg, 8);
          assert(r.ok);
          if (r.ok) assertEqual(r.data.name, 'Layla');
        } finally {
          restore();
        }
      },
    },
    {
      name: 'fetchContact returns ok:false on 404',
      fn: async () => {
        const restore = installFetchStub({ status: 404, body: { error: 'not found' } });
        try {
          const cfg = { baseUrl: 'https://c.test', accountId: '1', token: 't' };
          const r = await fetchContact(cfg, 999);
          assert(!r.ok, 'expected ok=false');
          if (!r.ok) assertEqual(r.status, 404);
        } finally {
          restore();
        }
      },
    },
    {
      name: 'fetchContact returns ok:false on timeout',
      fn: async () => {
        const restore = installFetchStub({ delayMs: 200 });
        try {
          const cfg = { baseUrl: 'https://c.test', accountId: '1', token: 't' };
          // Use a 20ms timeout — far below the stub's 200ms delay.
          const r = await fetchContact(cfg, 7, 20);
          assert(!r.ok, 'expected ok=false on timeout');
        } finally {
          restore();
        }
      },
    },

    // ---- POST /api/booking/embed-context ----
    {
      name: 'route rejects invalid JSON body with 400',
      fn: async () => {
        await withEnv(CHATWOOT_ENV, async () => {
          const req = makeRequest('{not-json');
          const res = await POST(req);
          assertEqual(res.status, 400);
          const body = (await res.json()) as { ok: boolean };
          assertEqual(body.ok, false);
        });
      },
    },
    {
      name: 'route rejects missing contact_id with 400',
      fn: async () => {
        await withEnv(CHATWOOT_ENV, async () => {
          const req = makeRequest({});
          const res = await POST(req);
          assertEqual(res.status, 400);
        });
      },
    },
    {
      name: 'route rejects negative contact_id with 400',
      fn: async () => {
        await withEnv(CHATWOOT_ENV, async () => {
          const req = makeRequest({ contact_id: -1 });
          const res = await POST(req);
          assertEqual(res.status, 400);
        });
      },
    },
    {
      name: 'route returns 503 when CHATWOOT_ADMIN_API_TOKEN is unset',
      fn: async () => {
        await withEnv({ CHATWOOT_ADMIN_API_TOKEN: undefined }, async () => {
          const req = makeRequest({ contact_id: 7 });
          const res = await POST(req);
          assertEqual(res.status, 503);
          const body = (await res.json()) as { ok: boolean; reason?: string };
          assertEqual(body.ok, false);
          assertEqual(body.reason, 'chatwoot_not_configured');
        });
      },
    },
    {
      name: 'route returns ok:true with contact on Chatwoot 200',
      fn: async () => {
        const restore = installFetchStub({
          status: 200,
          body: { id: 7, name: 'Faisal', email: 'f@x.com', phone_number: '+971501234567' },
        });
        try {
          await withEnv(CHATWOOT_ENV, async () => {
            const req = makeRequest({ contact_id: 7 });
            const res = await POST(req);
            assertEqual(res.status, 200);
            const body = (await res.json()) as {
              ok: boolean;
              contact?: { name?: string; email?: string; phone?: string } | null;
            };
            assertEqual(body.ok, true);
            assertEqual(body.contact, {
              name: 'Faisal',
              email: 'f@x.com',
              phone: '971501234567',
            });
          });
        } finally {
          restore();
        }
      },
    },
    {
      name: 'route returns ok:true with contact:null when Chatwoot has no useful fields',
      fn: async () => {
        const restore = installFetchStub({
          status: 200,
          body: { id: 9 },
        });
        try {
          await withEnv(CHATWOOT_ENV, async () => {
            const req = makeRequest({ contact_id: 9 });
            const res = await POST(req);
            assertEqual(res.status, 200);
            const body = (await res.json()) as { ok: boolean; contact: unknown };
            assertEqual(body.ok, true);
            assertEqual(body.contact, null);
          });
        } finally {
          restore();
        }
      },
    },
    {
      name: 'route returns 200 ok:false when Chatwoot returns 404',
      fn: async () => {
        const restore = installFetchStub({ status: 404, body: { error: 'nope' } });
        try {
          await withEnv(CHATWOOT_ENV, async () => {
            const req = makeRequest({ contact_id: 999 });
            const res = await POST(req);
            // 200 is intentional — see route header. Wizard must keep working.
            assertEqual(res.status, 200);
            const body = (await res.json()) as { ok: boolean; reason?: string };
            assertEqual(body.ok, false);
            assertEqual(body.reason, 'chatwoot_lookup_failed');
          });
        } finally {
          restore();
        }
      },
    },
    {
      name: 'route returns 200 ok:false when Chatwoot throws (network error)',
      fn: async () => {
        const restore = installFetchStub({ throws: new Error('econnrefused') });
        try {
          await withEnv(CHATWOOT_ENV, async () => {
            const req = makeRequest({ contact_id: 7 });
            const res = await POST(req);
            assertEqual(res.status, 200);
            const body = (await res.json()) as { ok: boolean };
            assertEqual(body.ok, false);
          });
        } finally {
          restore();
        }
      },
    },
  ]);
}
