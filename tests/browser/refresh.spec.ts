import { test, expect } from '@playwright/test';

for (const width of [390, 768, 1440]) {
  test(`refresh is usable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('MakingBetter Rides.');
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByText('Staging test customer')).toBeVisible();
    if (width <= 800) {
      const menu = page.locator('button[aria-controls="site-navigation"]');
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await menu.click();
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Services', exact: true }).click();
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator('a[href^="/book"]')).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`homepage-${width}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('unavailable reviews never invent a rating', async ({ page }) => {
  await page.route('**/api/google-reviews', route => route.fulfill({ status: 503, json: { success: false } }));
  await page.goto('/');
  await expect(page.getByText('Read our latest reviews on Google.')).toBeVisible();
  await expect(page.locator('#reviews')).not.toContainText('883');
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
});

test('keyboard users can skip navigation', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('cookie preferences stay readable and fit a mobile viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const banner = page.getByRole('region', { name: 'Cookie consent', exact: true });
  await expect(banner).toBeVisible();
  await expect(banner.locator('.bg-\\[\\#171c18\\]')).toHaveCSS('background-color', 'rgb(23, 28, 24)');
  await banner.getByRole('button', { name: 'Customize', exact: true }).click();
  const analytics = banner.getByRole('button', { name: 'Toggle analytics cookies' });
  await expect(analytics).toHaveAttribute('aria-pressed', 'false');
  await analytics.click();
  await expect(analytics).toHaveAttribute('aria-pressed', 'true');
  const box = await banner.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath('cookie-preferences-mobile.png') });
  await banner.getByRole('button', { name: 'Cancel', exact: true }).click();
  await banner.getByRole('button', { name: 'Reject All', exact: true }).click();
  await expect(banner).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mbr_cookie_consent')!).consent.analytics)).toBe(false);
});

test('workshop film is opt-in and fails with a readable fallback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.reject(new Error('Film offline'));
  });
  await page.goto('/');
  const film = page.locator('video');
  await expect(film).not.toHaveAttribute('autoplay');
  expect(await film.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  await page.getByRole('button', { name: 'Watch workshop film' }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Film unavailable. Please try again later.');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
