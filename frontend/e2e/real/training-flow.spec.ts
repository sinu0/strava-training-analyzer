import { expect, test } from '@playwright/test';

test('real API: context, two daily sessions, execution and durable feedback', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // This configuration always targets the isolated Compose project, never port 80.
  const active = await request.get('/api/v2/workouts/executions/active');
  expect(active.status()).toBe(204);
  await page.goto('/training?tab=context');
  await page.getByLabel('Cel', { exact: true }).click();
  await page.getByRole('option', { name: 'Regularność' }).click();
  for (const day of ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']) {
    await page.getByLabel(`${day} (min)`, { exact: true }).fill('60');
  }
  const saved = page.waitForResponse(response => response.url().endsWith('/v2/training/context') && response.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Zapisz kontekst', exact: true }).click();
  expect((await saved).status()).toBe(200);
  await expect(page.getByText('Zapisano kontekst treningowy.')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Poniedziałek (min)', { exact: true })).toHaveValue('60');
  const context = await (await request.get('/api/v2/training/context')).json();
  const today = await (await request.get('/api/v2/today')).json();
  expect(today.asOf).toBe(context.asOf);
  expect(today.confidence.level).toBe('LOW');
  expect(today.recommendation.targetTss).toBeUndefined();
  const suffix = Date.now();
  const plans = [];
  for (const name of ['Poranek', 'Wieczór']) {
    const response = await request.post('/api/training/plans', { data: {
      date: context.asOf, plannedType: 'ENDURANCE', plannedDurationMin: 10,
      plannedDescription: `${name}-${suffix}`, plannedTss: 10,
      scaledSteps: [{ type: 'steady', durationSec: 600, powerPctFtpLow: 55, powerPctFtpHigh: 70 }],
    } });
    expect(response.ok()).toBeTruthy();
    plans.push(await response.json());
  }
  const calendar = await (await request.get(`/api/training/calendar?from=${context.asOf}&to=${context.asOf}`)).json();
  expect(calendar[0].sessions.map((session: { planned: { id: string } }) => session.planned.id)).toEqual(expect.arrayContaining(plans.map(plan => plan.id)));
  await page.goto(`/training/workouts/${plans[0].id}`);
  await page.getByRole('button', { name: 'Rozpocznij na tym urządzeniu' }).click();
  await expect(page.getByRole('button', { name: 'Pauza', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Pauza', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Wznów', exact: true })).toBeVisible();
  const execution = await (await request.get('/api/v2/workouts/executions/active')).json();
  const complete = await request.post(`/api/v2/workouts/executions/${execution.id}/complete`, { data: { idempotencyKey: `complete-${suffix}` } });
  expect(complete.ok()).toBeTruthy();
  await page.goto(`/workout/${execution.id}`);
  await expect(page.getByText('RPE: nie podano')).toBeVisible();
  const slider = page.getByRole('slider');
  await slider.focus();
  await slider.press('Home');
  for (let index = 0; index < 7; index++) await slider.press('ArrowRight');
  await expect(page.getByText('RPE: 8/10')).toBeVisible();
  const feedbackSaved = page.waitForResponse(response => response.url().endsWith(`/executions/${execution.id}/feedback`) && response.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Zapisz podsumowanie' }).click();
  expect((await feedbackSaved).ok()).toBeTruthy();
  const review = await (await request.get(`/api/v2/training/weekly-review?from=${context.asOf}`)).json();
  expect(review.averageRpe).toBe(8);
  expect(review.completedSessions).toBeGreaterThanOrEqual(1);
  await page.goto('/training?tab=review');
  await expect(page.getByText(/Przegląd tygodnia ·/)).toBeVisible();
  expect(errors).toEqual([]);
});
