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
  await expect(page.getByRole('radio', { name: /Staging inspection/ })).toBeVisible();
  await page.getByLabel('Email', { exact: false }).fill('invalid');
  await page.getByLabel('First name', { exact: false }).click();
  await expect(page.getByText('Enter a valid email address.', { exact: true })).toBeVisible();
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

test('public form submits through the server action and shows the pending-email state', async ({ page }) => {
  // No request interception: exercise the real form, slots API and server action
  // against the isolated runtime configured in playwright.config.ts.
  await page.goto('/book');
  await page.getByRole('radio', { name: /Staging inspection/ }).click();
  // Tomorrow avoids today's elapsed slots, independently of the runner timezone.
  await page.getByRole('group', { name: 'Booking day' }).getByRole('button').nth(1).click();
  await page.getByRole('list', { name: 'Available times' }).getByRole('button').first().click();
  await page.getByLabel('First name', { exact: true }).fill('Synthetic');
  await page.getByLabel('Last name', { exact: true }).fill('Browser');
  await page.getByLabel('Phone', { exact: true }).fill('+971501234567');
  await page.getByLabel('Email', { exact: true }).fill('browser@example.invalid');
  await page.getByLabel('Year', { exact: true }).fill('2023');
  await page.getByRole('combobox', { name: 'Make', exact: true }).fill('BMW');
  await page.getByRole('option', { name: 'BMW', exact: true }).click();
  await page.getByRole('combobox', { name: 'Model', exact: true }).fill('X5');
  await page.getByRole('option', { name: 'X5', exact: true }).click();
  await page.getByLabel('Emirate', { exact: true }).selectOption('Dubai');
  await page.getByLabel('Code', { exact: true }).selectOption('M');
  await page.getByLabel('Number', { exact: true }).fill('12345');
  await page.getByRole('button', { name: 'Email me the confirmation link', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible();
  await expect(page.getByText('Booking confirmed', { exact: true })).toHaveCount(0);
  // The generic pending response does not prove mail capture or delivery.
});
