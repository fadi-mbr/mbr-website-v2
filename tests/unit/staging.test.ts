import { NextRequest } from 'next/server';
import { proxy } from '../../src/proxy';
import { runSuite, assertEqual } from './_harness';

export default async function stagingSuite() {
  const saved = { ...process.env };
  const fetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected external request'); };
  try {
    process.env.VERCEL_ENV = 'preview';
    process.env.MBR_RUNTIME_ENV = 'production';
    process.env.GOOGLE_PLACES_API_KEY = 'copied-test-key';
    process.env.OPENAI_API_KEY = 'copied-test-key';
    await runSuite('staging-isolation', [
      { name: 'read fixtures work without reaching providers', fn: async () => {
        for (const path of ['/api/google-reviews', '/api/location']) {
          const response = proxy(new NextRequest(`https://preview.invalid${path}`));
          assertEqual(response.status, 200);
          assertEqual((await response.json()).fixture, true);
        }
        assertEqual(calls, 0);
      } },
      { name: 'refresh, selection and cron cannot run with copied credentials', fn: async () => {
        for (const path of ['/api/google-reviews', '/api/google-reviews/workflow', '/api/google-reviews/select', '/api/google-reviews/from-database', '/api/cron/fetch-reviews']) {
          for (const method of ['POST', 'PUT', 'DELETE']) {
            assertEqual(proxy(new NextRequest(`https://preview.invalid${path}`, { method })).status, 403);
          }
        }
        assertEqual(calls, 0);
      } },
      { name: 'production requests continue to existing handlers', fn: () => {
        process.env.VERCEL_ENV = 'production';
        const response = proxy(new NextRequest('https://www.mbrme.com/api/google-reviews'));
        assertEqual(response.headers.get('x-middleware-next'), '1');
      } },
    ]);
  } finally {
    globalThis.fetch = fetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
}
