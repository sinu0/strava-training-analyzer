import { expect, test, type Page } from '@playwright/test';

const activityId = '11111111-1111-1111-1111-111111111111';

const activity = {
  id: activityId,
  externalId: 'e2e-activity',
  source: 'strava',
  sportType: 'cycling',
  name: 'Jazda kontrolna V2',
  startedAt: '2026-07-18T08:00:00Z',
  elapsedTimeSec: 3600,
  movingTimeSec: 3500,
  distanceM: 30000,
  elevationGainM: 250,
  avgSpeedMs: 8.5,
  avgPowerW: 210,
  avgHeartrate: 142,
  photoUrls: [],
  laps: [],
  metrics: {},
};

async function mockApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    // Vite serves the source module /src/api/client.ts in development. The
    // broad glob also matches that module, so only mock actual backend calls.
    if (!path.startsWith('/api/')) return route.continue();

    if (path === '/api/activities') {
      return route.fulfill({ json: { items: [activity], total: 1, page: 0, size: 20, totalPages: 1 } });
    }
    if (path === '/api/v2/activities') {
      return route.fulfill({ json: { items: [activity], total: 1, page: 0, size: 20, totalPages: 1 } });
    }
    if (path === `/api/activities/${activityId}`) {
      return route.fulfill({ json: activity });
    }
    if (path === `/api/v2/activities/${activityId}`) {
      return route.fulfill({ json: { ...activity, metrics: [], trainingEffect: null } });
    }
    if (path === `/api/v2/activities/${activityId}/streams`) {
      return route.fulfill({ json: { series: ['power'], originalPoints: 2, returnedPoints: 2, resolution: '1000', time: [0, 1], power: [200, 210] } });
    }
    if (path === `/api/v2/activities/${activityId}/laps`) return route.fulfill({ json: [] });
    if (path === `/api/activities/${activityId}/map`) {
      return route.fulfill({ json: { type: 'FeatureCollection', features: [] } });
    }
    if (path === '/api/v2/today') {
      return route.fulfill({
        json: {
          asOf: '2026-07-18',
          dataStatus: 'AVAILABLE',
          recommendation: {
            decision: 'TRAIN',
            sessionType: 'ENDURANCE',
            durationMinutes: 60,
            targetTss: 45,
            description: 'Spokojna jazda Z2.',
          },
          evidence: [{ code: 'LOAD', message: 'Obciążenie jest stabilne', source: 'daily_metrics', asOf: '2026-07-18' }],
          confidence: { level: 'HIGH', reasons: ['Aktualne źródła'] },
          lastActivity: activity,
          load: { ctl42: 42, atl7: 45, form: -3, asOf: '2026-07-18' },
          nextTraining: null,
          sync: { status: 'completed', imported: 1, skipped: 0 },
        },
      });
    }
    if (path === '/api/coach/today') {
      return route.fulfill({
        json: {
          decision: 'TRAIN',
          insight: 'Dane są wystarczające do lekkiej sesji.',
          reasoning: ['Obciążenie i regeneracja są stabilne.'],
          alternatives: [],
          allScoredSessions: [],
          bestSession: {
            type: 'ENDURANCE',
            durationMinutes: 60,
            targetTss: 45,
            difficulty: 'MODERATE',
            description: 'Spokojna jazda Z2.',
            indoor: false,
          },
        },
      });
    }
    if (path === '/api/weather/locations') {
      return route.fulfill({ json: [{ name: 'Warszawa', latitude: 52.23, longitude: 21.01, active: true }] });
    }
    if (path.includes('/api/weather/gradient')) {
      return route.fulfill({
        json: {
          locationName: 'Warszawa',
          current: { temperature: 21, windSpeed: 8, precipitation: 0, weatherCode: 1, weatherDescription: 'Pogodnie', outdoorScore: 90, warnings: [] },
          days: [],
        },
      });
    }
    if (path === '/api/analytics/pmc') return route.fulfill({ json: [] });
    if (path === '/api/v2/analytics/compare') {
      return route.fulfill({
        json: {
          availability: 'AVAILABLE',
          period1: { from: '2026-04-01', to: '2026-07-18', activityCount: 1, totalDistanceM: 30000, totalTimeSec: 3500, totalElevationM: 250 },
          period2: { from: '2025-12-01', to: '2026-03-31', activityCount: 1, totalDistanceM: 28000, totalTimeSec: 3600, totalElevationM: 220 },
        },
      });
    }
    if (path === '/api/analytics/recent-activities') return route.fulfill({ json: [activity] });
    if (path === '/api/sync/status') return route.fulfill({ json: { status: 'completed', imported: 1, skipped: 0 } });
    if (path === '/api/training/calendar') return route.fulfill({ json: [] });

    return route.fulfill({ status: 200, json: [] });
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

async function openApp(page: Page, path: string) {
  await page.goto(path);
  await page.locator('main').waitFor({ state: 'visible', timeout: 20_000 });
}

test('Dzisiaj pokazuje jedną decyzję i status synchronizacji', async ({ page }) => {
  await openApp(page, '/');
  const main = page.locator('main:visible');
  await expect(main.getByRole('heading', { name: 'Dzisiaj' }).first()).toBeVisible();
  await expect(main.getByText(/ENDURANCE/i).first()).toBeVisible();
});

test('Historia prowadzi do lekkiego szczegółu aktywności', async ({ page }) => {
  await openApp(page, '/activities');
  await expect(page.locator('main:visible').getByText('Jazda kontrolna V2').first()).toBeVisible();
  await openApp(page, `/activities/${activityId}`);
  await expect(page.locator('main:visible').getByText('Jazda kontrolna V2').first()).toBeVisible();
});

test('Analiza otwiera podstawowy widok', async ({ page }) => {
  await openApp(page, '/analytics');
  await expect(page.locator('main:visible').getByRole('heading', { name: 'Analiza' }).first()).toBeVisible();
});

test('Plan otwiera kalendarz', async ({ page }) => {
  await openApp(page, '/training');
  await expect(page.locator('main:visible').getByText(/Plan|Trening/i).first()).toBeVisible();
});

test('Pełny widok pogody pozostaje dostępny', async ({ page }) => {
  await openApp(page, '/weather');
  await expect(page.locator('main:visible').getByText(/Pogoda|Studio pogody/i).first()).toBeVisible();
});
