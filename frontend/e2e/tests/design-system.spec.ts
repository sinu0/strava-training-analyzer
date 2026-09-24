import AxeBuilder from '@axe-core/playwright';

import { expect, test } from '../fixtures';

// The catalogue renders every @/ui part in both colour modes; it is the visual
// contract of the component standard (docs/DESIGN_SYSTEM.md).
test.describe('System komponentów', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', (route) => (new URL(route.request().url()).pathname.startsWith('/api/')
      ? route.fulfill({ json: {} })
      : route.continue()));
  });

  for (const mode of ['light', 'dark'] as const) {
    test(`katalog ${mode} zgadza się ze wzorcem`, async ({ page }) => {
      // Baselines are rendered on the development machine; CI fonts differ, so only local runs compare pixels.
      test.skip(Boolean(process.env.CI), 'Wzorce zrzutów są zależne od systemu renderującego.');
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/design-system');
      const catalog = page.getByTestId(`catalog-${mode}`);
      await expect(catalog.getByRole('heading', { level: 1, name: 'System komponentów' })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(catalog).toHaveScreenshot(`catalog-${mode}.png`, { maxDiffPixelRatio: 0.01, animations: 'disabled' });
    });
  }

  test('katalog nie ma poziomego przewijania na telefonie i spełnia WCAG AA', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/design-system');
    await expect(page.getByTestId('catalog-dark')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});
