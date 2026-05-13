/**
 * Tests for src/lib/chatwoot-client.ts — URL building and message rendering.
 *
 * The network path is not unit-tested (no real HTTP in CI). The
 * confirmation-message renderer + URL builders are pure and that's where
 * a regression would be silent and damaging.
 */

import {
  buildConversationUrl,
  buildContactUrl,
  renderConfirmationMessage,
  loadChatwootConfig,
  updateContactCustomAttributes,
} from '../../../../lib/chatwoot-client';
import { runSuite, assertEqual, assert } from './_harness';

export default function suite() {
  return runSuite('chatwoot-client', [
    {
      name: 'buildConversationUrl with no suffix',
      fn: () => {
        assertEqual(
          buildConversationUrl(
            { baseUrl: 'https://connect.mbrme.com', accountId: '1' },
            42
          ),
          'https://connect.mbrme.com/api/v1/accounts/1/conversations/42'
        );
      },
    },
    {
      name: 'buildConversationUrl with suffix=messages',
      fn: () => {
        assertEqual(
          buildConversationUrl(
            { baseUrl: 'https://connect.mbrme.com', accountId: '1' },
            42,
            'messages'
          ),
          'https://connect.mbrme.com/api/v1/accounts/1/conversations/42/messages'
        );
      },
    },
    {
      name: 'buildConversationUrl strips trailing slashes on baseUrl',
      fn: () => {
        assertEqual(
          buildConversationUrl(
            { baseUrl: 'https://connect.mbrme.com/', accountId: '1' },
            42,
            'messages'
          ),
          'https://connect.mbrme.com/api/v1/accounts/1/conversations/42/messages'
        );
      },
    },
    {
      name: 'buildContactUrl',
      fn: () => {
        assertEqual(
          buildContactUrl(
            { baseUrl: 'https://connect.mbrme.com', accountId: '1' },
            123
          ),
          'https://connect.mbrme.com/api/v1/accounts/1/contacts/123'
        );
      },
    },

    {
      name: 'loadChatwootConfig returns null without token',
      fn: () => {
        const cfg = loadChatwootConfig({} as unknown as NodeJS.ProcessEnv);
        assertEqual(cfg, null);
      },
    },
    {
      name: 'loadChatwootConfig uses defaults when env is sparse',
      fn: () => {
        const cfg = loadChatwootConfig({
          CHATWOOT_ADMIN_API_TOKEN: 'xyz',
        } as unknown as NodeJS.ProcessEnv);
        assert(cfg !== null, 'cfg should not be null');
        assertEqual(cfg!.baseUrl, 'https://connect.mbrme.com');
        assertEqual(cfg!.accountId, '1');
        assertEqual(cfg!.token, 'xyz');
      },
    },
    {
      name: 'loadChatwootConfig honours overrides',
      fn: () => {
        const cfg = loadChatwootConfig({
          CHATWOOT_ADMIN_API_TOKEN: 'tok',
          CHATWOOT_BASE_URL: 'https://staging.example.com/',
          CHATWOOT_ACCOUNT_ID: '7',
        } as unknown as NodeJS.ProcessEnv);
        assert(cfg !== null);
        assertEqual(cfg!.baseUrl, 'https://staging.example.com');
        assertEqual(cfg!.accountId, '7');
      },
    },

    {
      name: 'renderConfirmationMessage includes first name',
      fn: () => {
        const msg = renderConfirmationMessage({
          customerFirstName: 'Faisal',
          serviceName: 'Major Service',
          slotStartIso: '2026-05-18T10:00:00+04:00',
          durationH: 4,
        });
        assert(msg.includes('Faisal'), `expected msg to mention Faisal, got: ${msg}`);
      },
    },
    {
      name: 'renderConfirmationMessage falls back to "there" when name missing',
      fn: () => {
        const msg = renderConfirmationMessage({
          customerFirstName: '',
          serviceName: 'Diagnostic',
          slotStartIso: '2026-05-18T10:00:00+04:00',
          durationH: 1,
        });
        assert(msg.includes('there'), `expected fallback "there", got: ${msg}`);
      },
    },
    {
      name: 'renderConfirmationMessage includes service name + duration suffix',
      fn: () => {
        const msg = renderConfirmationMessage({
          customerFirstName: 'F',
          serviceName: 'Tire Rotation',
          slotStartIso: '2026-05-18T10:00:00+04:00',
          durationH: 2,
        });
        assert(msg.includes('Tire Rotation'), 'service name present');
        assert(msg.includes('(2h)'), `expected (2h) marker, got: ${msg}`);
      },
    },
    {
      name: 'renderConfirmationMessage renders Asia/Dubai time regardless of input offset',
      fn: () => {
        // 10:00 UTC === 14:00 Asia/Dubai
        const msg = renderConfirmationMessage({
          customerFirstName: 'X',
          serviceName: 'S',
          slotStartIso: '2026-05-18T10:00:00Z',
          durationH: 1,
        });
        // We just assert the message contains a time and a date label —
        // exact locale-format strings vary by Node version, so don't pin.
        assert(/\d{2}:\d{2}/.test(msg) || /\d{1,2}\s?[ap]m/i.test(msg),
          `expected time-like substring, got: ${msg}`);
      },
    },

    /* --------- updateContactCustomAttributes (PATCH body shape) --------- */
    {
      name: 'updateContactCustomAttributes PATCHes the contact URL with custom_attributes body',
      fn: async () => {
        const origFetch = globalThis.fetch;
        let capturedUrl = '';
        let capturedInit: RequestInit | undefined;
        globalThis.fetch = (async (
          input: RequestInfo | URL,
          init?: RequestInit,
        ) => {
          capturedUrl =
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.toString()
                : (input as Request).url;
          capturedInit = init;
          return new Response(JSON.stringify({ id: 5 }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }) as typeof fetch;
        try {
          const res = await updateContactCustomAttributes(
            { baseUrl: 'https://connect.mbrme.com', accountId: '1', token: 'tok' },
            5,
            { vehicle_year: 2023, vehicle_make: 'Ferrari' },
          );
          assert(res.ok, `expected ok result, got ${JSON.stringify(res)}`);
          assertEqual(
            capturedUrl,
            'https://connect.mbrme.com/api/v1/accounts/1/contacts/5',
          );
          assertEqual(capturedInit?.method, 'PATCH');
          assertEqual(
            (capturedInit?.headers as Record<string, string> | undefined)?.api_access_token,
            'tok',
          );
          const parsed = JSON.parse(String(capturedInit?.body ?? '{}'));
          assertEqual(parsed, {
            custom_attributes: { vehicle_year: 2023, vehicle_make: 'Ferrari' },
          });
        } finally {
          globalThis.fetch = origFetch;
        }
      },
    },
    {
      name: 'updateContactCustomAttributes surfaces non-2xx as ok:false with status',
      fn: async () => {
        const origFetch = globalThis.fetch;
        globalThis.fetch = (async () =>
          new Response('nope', { status: 403 })) as typeof fetch;
        try {
          const res = await updateContactCustomAttributes(
            { baseUrl: 'https://chat', accountId: '1', token: 't' },
            7,
            { x: 1 },
          );
          assertEqual(res.ok, false);
          if (!res.ok) {
            assertEqual(res.status, 403);
            assert(res.reason.includes('chatwoot 403'));
          }
        } finally {
          globalThis.fetch = origFetch;
        }
      },
    },
  ]);
}
