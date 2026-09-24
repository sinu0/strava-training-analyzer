import { expect, test } from '../fixtures';

// This e2e test suite checks basic map interactions on the Route Planner page
// Run with: npm run test:e2e (requires Playwright to be installed and dev server running)

test.describe('Route planner map interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/routes?showWeather=1');
    // wait for map to initialize
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
  });

  test('clicking on route polyline inserts a waypoint and allows dragging', async ({ page }) => {
    // Preconditions: there may be no waypoints - create a simple two-point route by clicking map twice
    const map = page.locator('.leaflet-container');
    // Click two distinct points to create a base route
    await map.click({ position: { x: 200, y: 200 } });
    await map.click({ position: { x: 400, y: 200 } });

    // Wait for waypoint markers to appear (numbered markers have class route-waypoint-marker)
    await page.waitForSelector('.route-waypoint-marker', { timeout: 5000 });
    const markers = await page.$$('.route-waypoint-marker');
    expect(markers.length).toBeGreaterThanOrEqual(2);

    // Click on polyline roughly between the two markers to insert a midpoint
    // polyline is rendered within the map; clicking center area
    await map.click({ position: { x: 300, y: 200 } });

    // Now expect at least 3 markers
    const markersAfter = await page.$$('.route-waypoint-marker');
    expect(markersAfter.length).toBeGreaterThanOrEqual(3);

    // Drag the middle marker by mouse move; find the middle marker (label '2')
    const middle = markersAfter[1];
    const box = await middle.boundingBox();
    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 50, startY + 30, { steps: 10 });
      await page.mouse.up();
      // After drag, ensure map updated — polyline should still exist and route stats update
      await page.waitForSelector('text=Dystans', { timeout: 5000 });
    }
  });

  test('toggle weather bubbles shows and hides markers', async ({ page }) => {
    // ensure there is a route defined
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 220, y: 220 } });
    await map.click({ position: { x: 460, y: 220 } });
    // Wait for waypoint markers to render before toggling weather
    await page.waitForSelector('.route-waypoint-marker', { timeout: 5000 });
    const weatherSwitch = page.getByRole('switch', { name: 'Pokaż dymki pogodowe na trasie' });
    const indicator = page.getByTestId('route-weather-indicator');
    const bubbles = page.locator('.route-weather-bubble');

    await expect(weatherSwitch).toBeChecked();
    await expect(indicator).toBeAttached();
    await expect.poll(() => bubbles.count()).toBeGreaterThan(0);

    await weatherSwitch.click();
    await expect(weatherSwitch).not.toBeChecked();
    await expect(indicator).toHaveCount(0);
    await expect(bubbles).toHaveCount(0);

    await weatherSwitch.click();
    await expect(weatherSwitch).toBeChecked();
    await expect(indicator).toBeAttached();
    await expect.poll(() => bubbles.count()).toBeGreaterThan(0);
  });
});
