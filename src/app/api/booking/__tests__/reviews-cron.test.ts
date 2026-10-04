import { runSuite, assert, assertEqual } from './_harness';
import { GET, POST } from '../../cron/fetch-reviews/route';

export default async function cronSuite() {
  const saved = { ...process.env };
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  let calls = 0;
  const logs: string[] = [];
  const sensitive = 'secret-token customer@example.invalid';
  process.env.CRON_SECRET = 'synthetic-cron-secret';
  process.env.GOOGLE_PLACE_ID = 'fixture';
  process.env.GOOGLE_PLACES_API_KEY = sensitive;
  const request = () => new Request('http://localhost/api/cron/fetch-reviews', {
    headers: { authorization: 'Bearer synthetic-cron-secret' },
  });
  globalThis.fetch = async () => { calls++; throw new Error(sensitive); };
  console.error = (line: string) => { logs.push(line); };
  try {
    await runSuite('reviews-cron-safety', [
      { name: 'preview with copied credentials cannot fetch or persist reviews', fn: async () => {
        process.env.VERCEL_ENV = 'preview';
        process.env.MBR_RUNTIME_ENV = 'production';
        assertEqual((await GET(request())).status, 403);
        assertEqual((await POST(request())).status, 403);
        assertEqual(calls, 0);
      } },
      { name: 'unauthorized production calls never reach Google', fn: async () => {
        process.env.VERCEL_ENV = 'production';
        assertEqual((await GET(new Request('http://localhost/api/cron/fetch-reviews'))).status, 401);
        assertEqual(calls, 0);
      } },
      { name: 'failed upstream call has correlated telemetry without sensitive error data', fn: async () => {
        const response = await POST(request());
        assertEqual(response.status, 500);
        assertEqual(calls, 1);
        const body = await response.json();
        const event = JSON.parse(logs[0]);
        assertEqual(event.event, 'reviews_cron_failed');
        assertEqual(event.stage, 'google_fetch');
        assertEqual(event.correlationId, body.correlationId);
        assert(typeof event.correlationId === 'string');
        assert(!JSON.stringify({ logs, body }).includes(sensitive));
      } },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
}
