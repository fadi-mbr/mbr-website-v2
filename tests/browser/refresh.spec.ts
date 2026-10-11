import { test, expect } from '@playwright/test';

for (const width of [390, 768, 1440]) {
  test(`refresh is usable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('For the loveof the drive.');
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
