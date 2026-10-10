import { test, expect } from '@playwright/test';

test('staging serves synthetic reads and blocks integration writes', async ({ request }) => {
  for (const path of ['/api/google-reviews', '/api/location']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect((await response.json()).fixture).toBe(true);
    expect((await request.post(path)).status()).toBe(403);
  }
  for (const path of ['/api/google-reviews/workflow', '/api/google-reviews/select', '/api/google-reviews/from-database', '/api/cron/fetch-reviews']) {
    expect((await request.get(path)).status()).toBe(403);
    expect((await request.post(path)).status()).toBe(403);
  }
});

test('staging identifies itself and never loads production analytics', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', request => {
    if (/google-analytics|googletagmanager|vercel-insights|_vercel\/insights/.test(request.url())) {
      analyticsRequests.push(request.url());
    }
  });
  await page.goto('/');
  await expect(page.getByRole('status').filter({ hasText: 'Test environment' })).toBeVisible();
  await expect(page.getByText('Staging test customer').first()).toBeVisible();
  expect(analyticsRequests).toEqual([]);
});
