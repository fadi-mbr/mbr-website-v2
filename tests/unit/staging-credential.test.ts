import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { APIRequestContext, BrowserContext, Route } from '@playwright/test';
import { protectApiRequest, protectBrowserContext } from '../browser/fixtures';

test('protected API requests cannot send a credential to another origin or follow redirects', async () => {
  const calls: unknown[][] = [];
  const request = { get: (...args: unknown[]) => { calls.push(args); } } as unknown as APIRequestContext;
  const scoped = protectApiRequest(request, 'https://staging.invalid', 'synthetic');
  await scoped.get('/health', { maxRedirects: 20 });
  assert.deepEqual(calls[0], ['/health', { maxRedirects: 0, headers: { 'x-vercel-protection-bypass': 'synthetic' } }]);
  for (const url of ['https://third-party.invalid', '//third-party.invalid', 'https://staging.invalid.evil.invalid']) {
    assert.throws(() => scoped.get(url));
  }
  assert.equal(calls.length, 1);
  assert.throws(() => protectApiRequest(request, 'http://staging.invalid', 'synthetic'));
});

test('browser authentication is scoped and redirect destinations must be rechecked', async () => {
  let handler!: (route: Route) => Promise<unknown>;
  const context = { route: async (_: string, callback: typeof handler) => { handler = callback; } } as unknown as BrowserContext;
  await protectBrowserContext(context, 'https://staging.invalid', 'synthetic');
  let continued = 0;
  const fetched: unknown[] = [];
  const route = (url: string) => ({
    request: () => ({ url: () => url, headers: () => ({ accept: '*/*' }) }),
    continue: async () => { continued++; },
    fetch: async (options: unknown) => { fetched.push(options); return {}; },
    fulfill: async () => {},
  }) as unknown as Route;
  await handler(route('https://staging.invalid/page'));
  await handler(route('https://third-party.invalid/redirect-target'));
  assert.equal(continued, 1);
  assert.deepEqual(fetched, [{ maxRedirects: 0, headers: { accept: '*/*', 'x-vercel-protection-bypass': 'synthetic' } }]);
});
