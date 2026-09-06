import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './real',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:18081',
    viewport: { width: 390, height: 844 },
    timezoneId: 'Europe/Warsaw',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium-real-api', use: { browserName: 'chromium' } }],
});
