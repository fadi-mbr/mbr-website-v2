import { test, expect } from '@playwright/test';

test('homepage retains contact links without online booking', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href*="wa.me"]').first()).toBeVisible();
  await expect(page.locator('a[href^="/book"]')).toHaveCount(0);
});

test('retired public and agent booking pages are unavailable', async ({ request }) => {
  for (const path of ['/book', '/book/agent', '/book/confirm?token=retired', '/book/faq']) {
    expect((await request.get(path)).status()).toBe(404);
  }
});

test('retired booking APIs cannot accept requests', async ({ request }) => {
  for (const route of ['health', 'services', 'slots', 'request', 'confirm', 'agent']) {
    const path = `/api/booking/${route}`;
    expect((await request.get(path)).status()).toBe(404);
    expect((await request.post(path, { data: { token: 'retired' } })).status()).toBe(404);
  }
});

test('preview is noindex and sitemap excludes booking', async ({ request }) => {
  expect((await request.get('/')).headers()['x-robots-tag']).toContain('noindex');
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain('/book');
});
