import { test, expect } from './fixtures';

// Check the actual rendered colors against the brightest possible image.
// A photograph/video may change; caption legibility must not depend on it.
for (const width of [390, 1440]) {
  test(`photo captions retain normal-text contrast at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/', '/about', '/workshop']) {
      await page.goto(route);
      for (const caption of await page.locator('.media-caption').all()) {
        await caption.scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);
        const ratios = await caption.evaluate(element => {
          const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
          const luminance = (color: number[]) => color.slice(0, 3).map(v => {
            v /= 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
          const backing = rgb(getComputedStyle(element).backgroundColor);
          const alpha = backing[3] ?? 1;
          const background = backing.slice(0, 3).map(v => v * alpha + 255 * (1 - alpha));
          return [element, ...element.querySelectorAll('p, span')].filter(node =>
            node.textContent?.trim() && !node.children.length && getComputedStyle(node).opacity === '1'
          ).map(node => {
            const foreground = rgb(getComputedStyle(node).color);
            const opacity = foreground[3] ?? 1;
            const composite = foreground.slice(0, 3).map((v, i) => v * opacity + background[i] * (1 - opacity));
            const a = luminance(composite), b = luminance(background);
            return { text: node.textContent, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
          });
        });
        expect(ratios.length).toBeGreaterThan(0);
        for (const result of ratios) expect(result.ratio, result.text || '').toBeGreaterThanOrEqual(4.5);
      }
    }
  });
}
