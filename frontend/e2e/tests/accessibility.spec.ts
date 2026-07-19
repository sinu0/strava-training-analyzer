import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const preferences = {
  schemaVersion: 1,
  revision: 0,
  dashboard: {
    widgets: [
      { id: 'decision-main', type: 'decision', order: 0, span: 12, settings: {} },
      { id: 'recovery-main', type: 'recovery', order: 1, span: 4, settings: {} },
      { id: 'load-main', type: 'load', order: 2, span: 4, settings: {} },
      { id: 'last-activity-main', type: 'lastActivity', order: 3, span: 4, settings: {} },
      { id: 'next-workout-main', type: 'nextWorkout', order: 4, span: 6, settings: {} },
      { id: 'weather-main', type: 'weather', order: 5, span: 6, settings: {} },
    ],
  },
  mobileNavigation: ['/', '/activities', '/analytics', '/training'],
  warnings: [],
};

async function mockApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    if (path === '/api/v2/ui-preferences') return route.fulfill({ json: preferences });
    if (path === '/api/v2/today') {
      return route.fulfill({
        json: {
          asOf: '2026-07-19',
          dataStatus: 'UNKNOWN',
          recommendation: null,
          evidence: [],
          confidence: { level: 'LOW', reasons: ['Brak zsynchronizowanych aktywności'] },
          lastActivity: null,
          load: null,
          nextTraining: null,
          sync: { status: 'idle', imported: 0, skipped: 0 },
        },
      });
    }
    if (path === '/api/v2/activities') {
      return route.fulfill({ json: { items: [], total: 0, page: 0, size: 20, totalPages: 0 } });
    }
    if (path === '/api/v2/analytics/compare') {
      return route.fulfill({
        json: {
          availability: 'UNKNOWN',
          period1: { from: '2026-04-01', to: '2026-07-19', activityCount: 0, totalDistanceM: 0, totalTimeSec: 0, totalElevationM: 0 },
          period2: { from: '2025-12-01', to: '2026-03-31', activityCount: 0, totalDistanceM: 0, totalTimeSec: 0, totalElevationM: 0 },
        },
      });
    }
    if (path === '/api/training/calendar') return route.fulfill({ json: [] });
    if (path === '/api/routes') return route.fulfill({ json: [] });
    if (path === '/api/weather/locations') return route.fulfill({ json: [] });
    if (path === '/api/sync/status') return route.fulfill({ json: { status: 'idle', imported: 0, skipped: 0 } });
    return route.fulfill({ json: [] });
  });
}

async function expectNoAccessibilityViolations(page: Page, path: string, heading: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('main h1').filter({ hasText: heading }).first().waitFor({ state: 'visible', timeout: 30_000 });
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

test.beforeEach(async ({ page }) => mockApi(page));

test('główne ekrany spełniają automatyczne reguły WCAG 2.1 AA', async ({ page }) => {
  for (const [path, heading] of [
    ['/', 'Dzisiaj'],
    ['/activities', 'Historia treningów'],
    ['/analytics', 'Laboratorium wydolności'],
    ['/training', 'Plan treningowy'],
    ['/routes', 'Trasy'],
    ['/more', 'Więcej'],
  ]) {
    await expectNoAccessibilityViolations(page, path, heading);
  }
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`Dzisiaj pozostaje dostępne przy ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await expectNoAccessibilityViolations(page, '/', 'Dzisiaj');
  });
}
