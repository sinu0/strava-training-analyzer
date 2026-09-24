import { expect, test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await use(page);

    expect(pageErrors, `Nieobsłużone błędy strony: ${pageErrors.join(' | ')}`).toEqual([]);
  },
});

export { expect };
export type { Page } from '@playwright/test';
