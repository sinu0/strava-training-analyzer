import { test, expect } from '@playwright/test';

// E2E: Profile gallery lightbox
// Runs with: npm run test:e2e -- e2e/tests/profile-gallery.spec.ts

test.describe('Profile gallery', () => {
  test.beforeEach(async ({ page }) => {
    // proxy console logs to node test output for debugging
    page.on('console', (msg) => {
      // eslint-disable-next-line no-console
      console.log('PAGE LOG:', msg.text());
    });
    page.on('pageerror', (err) => {
      // eslint-disable-next-line no-console
      console.log('PAGE ERROR:', err.message, err.stack);
    });
    page.on('requestfailed', (req) => {
      // eslint-disable-next-line no-console
      const failure = req.failure();
      console.log('REQUEST FAILED:', req.url(), failure && failure.errorText ? failure.errorText : JSON.stringify(failure));
    });

    // Also capture window.onerror and unhandledrejection in the page context
    await page.addInitScript(() => {
      window.addEventListener('error', (e) => {
        try {
          // @ts-ignore
          console.error('window.onerror', e && e.error && e.error.stack ? e.error.stack : e.message || e);
        } catch (err) {
          // ignore
        }
      });
      window.addEventListener('unhandledrejection', (e) => {
        try {
          // @ts-ignore
          console.error('unhandledrejection', e && e.reason && e.reason.stack ? e.reason.stack : e.reason || e);
        } catch (err) {
          // ignore
        }
      });
    });

    // Mock profile API so the profile page renders predictably
    await page.route('**/api/profile', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u1',
          name: 'Test User',
          ftpWatts: null,
          lthrBpm: null,
          maxHrBpm: null,
          restingHrBpm: null,
          weightKg: null,
          dateOfBirth: null,
          stravaConnected: false,
          stravaAthleteId: null,
          currentZones: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    // Mock recent activities endpoint (ProfileGallery uses /api/activities?page=0&size=200)
    await page.route('**/api/activities**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'a1',
              name: 'Morning Ride',
              startedAt: '2025-06-01T08:00:00Z',
              photoUrls: ['https://placekitten.com/800/400', 'https://placekitten.com/801/401'],
            },
          ],
          page: 0,
          size: 200,
          totalItems: 1,
        }),
      });
    });

    // Go to profile page
    await page.goto('http://localhost:5173/profile');
    // Wait for gallery header
    await page.waitForSelector('text=Galeria zdjęć', { timeout: 10000 });
  });

  test('opens lightbox when clicking a gallery thumbnail after hover', async ({ page }) => {
    const thumbnail = page.getByTestId('profile-photo-0');
    await expect(thumbnail).toBeVisible({ timeout: 5000 });
    await thumbnail.hover();
    await thumbnail.click();

    // capture a screenshot and page html for debugging when element not visible
    try {
      await expect(page.locator('text=Otwórz aktywność')).toBeVisible({ timeout: 5000 });
    } catch (e) {
      await page.screenshot({ path: `./playwright-debug-profile-gallery-${Date.now()}.png`, fullPage: true });
      const html = await page.content();
      // eslint-disable-next-line no-console
      console.log('PAGE HTML SNIPPET:', html.slice(0, 8000));
      throw e;
    }
  });

});
