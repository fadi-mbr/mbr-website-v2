import { test, expect } from '@playwright/test';
import { signToken } from '../../src/lib/booking-token';

test('booking renders the isolated catalogue with no indexing or analytics', async ({ page }) => {
  const external: string[] = [];
  await page.route('**/*', route => {
    if (new URL(route.request().url()).hostname !== 'localhost') {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const response = await page.goto('/book');
  expect(response?.headers()['x-robots-tag']).toContain('noindex');
  await expect(page.getByRole('heading', { name: 'Book an appointment' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Staging inspection/ })).toBeVisible();
  await page.getByLabel('Email', { exact: false }).fill('invalid');
  await page.getByLabel('First name', { exact: false }).click();
  expect(external.filter(url => /google-analytics|googletagmanager|vercel-insights/.test(url))).toEqual([]);
});

test('missing and invalid confirmation links show an actionable error', async ({ page }) => {
  await page.goto('/book/confirm');
  await expect(page.getByRole('heading', { name: 'Missing token' })).toBeVisible();
  await page.goto('/book/confirm?token=invalid');
  await expect(page.getByRole('link', { name: 'Book again' })).toBeVisible();
  await expect(page.getByText('Confirming your booking')).toHaveCount(0);
});

test('test-signed confirmation completes against ARC fixtures and can be reopened', async ({ page }) => {
  const now = Date.now();
  const token = await signToken({ v: 2, id: crypto.randomUUID(), iat: now, exp: now + 600000, fp: 'test', intent: {
    serviceId: 900001, serviceName: 'Staging inspection', timeStartMs: now + 86400000, durationH: 1,
    firstName: 'Synthetic', lastName: 'Test', phone: '971500000000', email: 'test@example.invalid',
    vehicleYear: 2023, vehicleMake: 'BMW', vehicleModel: 'X5',
  } }, 'b'.repeat(64));
  await page.goto(`/book/confirm?token=${encodeURIComponent(token)}`);
  await expect(page.getByText('Booking confirmed', { exact: true })).toBeVisible({ timeout: 30000 });
  await page.reload();
  await expect(page.getByText('Booking confirmed', { exact: true })).toBeVisible();
});
