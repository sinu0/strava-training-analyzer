import { expect, test, type Page } from '../fixtures';

const START = Date.now();

function execution(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exec-e2e', scheduledWorkoutId: 'plan-e2e', workoutNameSnapshot: '3 × 5 min próg',
    stepsSnapshot: [
      { type: 'warmup', name: 'Rozgrzewka', durationSec: 600, powerPctFtpLow: 50, powerPctFtpHigh: 70, cadenceRpmLow: 85, cadenceRpmHigh: 95 },
      { type: 'steady', name: 'Próg', durationSec: 300, powerPctFtpLow: 95, powerPctFtpHigh: 100 },
      { type: 'recovery', name: 'Odpoczynek', durationSec: 180, powerPctFtpLow: 50, powerPctFtpHigh: 55 },
      { type: 'steady', name: 'Próg', durationSec: 300, powerPctFtpLow: 95, powerPctFtpHigh: 100 },
      { type: 'cooldown', name: 'Schłodzenie', durationSec: 420, powerPctFtpLow: 40, powerPctFtpHigh: 60 },
    ],
    ftpWatts: 250, lthrBpm: null, maxHrBpm: null, restingHrBpm: null,
    startedAt: new Date(START).toISOString(), finishedAt: null, status: 'RUNNING',
    currentStepIndex: 0, workoutElapsedMs: 240_000, stepElapsedMs: 240_000, runningSince: new Date(START).toISOString(),
    intensityAdjustmentPct: 0, skippedStepIndexes: [], repeatedStepIndexes: [], rpe: null, feeling: null, notes: null,
    activityId: null, activityMatchStatus: 'PENDING', complianceStatus: 'UNKNOWN', complianceScore: null,
    complianceAlgorithmVersion: 'v1', deliveryMethod: 'ON_DEVICE', stateVersion: 1, updatedAt: new Date(START).toISOString(),
    ...overrides,
  };
}

async function mockWorkoutApi(page: Page) {
  const calls: Array<{ path: string; body: unknown }> = [];
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const body = route.request().postDataJSON?.() ?? null;
    calls.push({ path: url.pathname, body });
    if (url.pathname.endsWith('/executions/active') || url.pathname.endsWith('/executions/exec-e2e')) return route.fulfill({ json: execution() });
    if (url.pathname.endsWith('/events') || url.pathname.endsWith('/complete') || url.pathname.endsWith('/abort')) return route.fulfill({ status: 204, body: '' });
    return route.fulfill({ json: {} });
  });
  return calls;
}

async function connectSimulatedDevices(page: Page) {
  await page.getByRole('button', { name: 'Urządzenia' }).click();
  const sheet = page.getByRole('presentation');
  await expect(sheet.getByText(/Tryb demo/)).toBeVisible();
  const connectButtons = sheet.getByRole('button', { name: 'Połącz' });
  await connectButtons.first().click();
  await connectButtons.first().click();
  await expect(sheet.getByRole('button', { name: 'Rozłącz' })).toHaveCount(2);
  await page.getByRole('button', { name: 'Zamknij panel urządzeń' }).click();
}

test.describe('Tryb trenażera', () => {
  test('łączy symulowany Suito i pasek, trzyma ERG i reaguje na sterowanie', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.addInitScript(() => localStorage.setItem('strava-analizator.color-mode', 'dark'));
    const calls = await mockWorkoutApi(page);
    await page.goto('/workout/exec-e2e?devices=sim');
    await expect(page.getByRole('heading', { level: 1, name: 'Rozgrzewka' })).toBeVisible();

    await connectSimulatedDevices(page);
    const live = page.getByRole('region', { name: 'Dane na żywo' });
    await expect(live.getByText(/cel \d+ W/)).toBeVisible();
    await expect(page.getByText(/^ERG \d+ W$/)).toBeVisible({ timeout: 10_000 });
    // Cadence and heart rate stream from the simulated devices (NP only appears after 30 s).
    await expect(live.getByText(/^\d{2,3}$/)).toHaveCount(3, { timeout: 10_000 });

    const before = Number((await page.getByText(/^ERG \d+ W$/).textContent())?.match(/\d+/)?.[0]);
    await page.getByRole('button', { name: 'Intensywność +5%' }).click();
    await expect.poll(async () => Number((await page.getByText(/^ERG \d+ W$/).textContent())?.match(/\d+/)?.[0])).toBeGreaterThan(before);

    await page.getByRole('button', { name: 'Pauza' }).click();
    await expect(page.getByRole('button', { name: 'Wznów' })).toBeVisible();
    await expect(page.getByText(/^ERG \d+ W$/)).toHaveCount(0);
    expect(calls.some((call) => call.path.endsWith('/events') && (call.body as { type?: string })?.type === 'PAUSE')).toBe(true);

    await page.getByRole('button', { name: 'Wznów' }).click();
    await page.getByRole('button', { name: 'Pomiń' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Próg' })).toBeVisible();

    await page.evaluate(() => (window as unknown as { __trainerSim: { drop: (kind: string, ms: number) => void } }).__trainerSim.drop('trainer', 3_000));
    await expect(page.getByText(/Trenażer: utracono/)).toBeVisible();
    await expect(page.getByText(/Trenażer: utracono/)).toHaveCount(0, { timeout: 10_000 });

    await page.screenshot({ path: '../artifacts/trainer-cockpit/cockpit-desktop-dark.png' });
  });

  test('układ mobilny bez poziomego przewijania', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockWorkoutApi(page);
    await page.goto('/workout/exec-e2e?devices=sim');
    await expect(page.getByRole('heading', { level: 1, name: 'Rozgrzewka' })).toBeVisible();
    await connectSimulatedDevices(page);
    await page.waitForTimeout(3_000);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
    await page.screenshot({ path: '../artifacts/trainer-cockpit/cockpit-mobile.png', fullPage: true });
  });
});
