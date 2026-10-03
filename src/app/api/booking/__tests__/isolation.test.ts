import { runSuite, assert, assertEqual } from './_harness';
import { isProductionDeployment, bookingSigningSecret, bookingSiteOrigin } from '@/lib/runtime-environment';
import { fetchServices, submitBooking, workerLogin, type BookingBody } from '../_lib/arc-client';
import { sendConversationMessage } from '@/lib/chatwoot-client';
import { sendConfirmationEmail } from '@/lib/booking-email';

export default async function isolationSuite() {
  const saved = { ...process.env };
  const fetch = globalThis.fetch;
  process.env.VERCEL_ENV = 'preview';
  process.env.MBR_RUNTIME_ENV = 'production'; // copied production config must not win
  process.env.BOOKING_TOKEN_SECRET = 'a'.repeat(64);
  process.env.BOOKING_TEST_TOKEN_SECRET = 'b'.repeat(64);
  process.env.NEXT_PUBLIC_SITE_URL = 'https://mbrme.com';
  process.env.VERCEL_URL = 'isolated-preview.vercel.app';
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected outbound network'); };
  try {
    await runSuite('deployment-isolation', [
      { name: 'unknown deployment defaults to isolated, including production builds', fn: () => {
        assertEqual(isProductionDeployment({ NODE_ENV: 'production' }), false);
        assertEqual(isProductionDeployment(), false);
        assertEqual(isProductionDeployment({ VERCEL_ENV: 'production' }), true);
      } },
      { name: 'preview signing and confirmation host ignore production settings', fn: () => {
        assertEqual(bookingSigningSecret(), 'b'.repeat(64));
        assertEqual(bookingSiteOrigin(), 'https://isolated-preview.vercel.app');
        delete process.env.BOOKING_TEST_TOKEN_SECRET;
        assertEqual(bookingSigningSecret(), undefined);
      } },
      { name: 'ARC catalogue, login and booking submission never use fetch in preview', fn: async () => {
        assertEqual((await fetchServices({ fresh: true }))[0].id, 900001);
        assertEqual((await workerLogin('production-phone', 'production-password')).token, 'staging-fixture');
        await submitBooking({} as BookingBody, 900001);
        assertEqual(calls, 0);
      } },
      { name: 'copied Chatwoot config cannot send a message', fn: async () => {
        const r = await sendConversationMessage({ baseUrl: 'https://connect.mbrme.com', accountId: '1', token: 'fixture' }, { conversationId: 1, content: 'synthetic' });
        assert(!r.ok);
        assertEqual(calls, 0);
      } },
      { name: 'SMTP is captured without opening a socket even with copied config', fn: async () => {
        const r = await sendConfirmationEmail({ smtp: { host: '127.0.0.1', port: 1, user: 'fixture', password: 'fixture' }, fromEmail: 'sender@example.invalid', to: 'test@example.invalid', firstName: 'Synthetic', serviceName: 'Staging inspection', requestedAt: Date.now(), confirmUrl: bookingSiteOrigin() });
        assertEqual(r, { ok: true, captured: true });
      } },
    ]);
  } finally {
    globalThis.fetch = fetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
}
