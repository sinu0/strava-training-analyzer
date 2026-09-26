import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/i18n';
import theme from '@/theme/theme';

import AnalysisPage from '../AnalysisPage';

vi.mock('../useV2Analytics', () => ({
  usePeriodComparison: () => ({
    data: {
      period1: { from: '2026-01-01', to: '2026-03-25', activityCount: 10, totalDistanceM: 100_000, totalTimeSec: 36_000, totalElevationM: 1200 },
      period2: { from: '2025-10-09', to: '2025-12-31', activityCount: 8, totalDistanceM: 80_000, totalTimeSec: 28_000, totalElevationM: 900 },
      availability: 'AVAILABLE',
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useLoadAnalytics: () => ({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() }),
  usePowerAnalytics: () => ({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() }),
}));

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function renderPage() {
  return render(
    <I18nProvider>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/analysis']}>
          <AnalysisPage />
        </MemoryRouter>
      </ThemeProvider>
    </I18nProvider>,
  );
}

describe('AnalysisPage', () => {
  afterEach(() => window.localStorage.clear());

  it('renders the Polish page by default', () => {
    renderPage();
    expect(screen.getByText('Laboratorium wydolności')).toBeDefined();
    expect(screen.getByText('Wybrany okres')).toBeDefined();
  });

  it('renders English text when the language is switched', async () => {
    window.localStorage.setItem('strava-analizator.language', 'en');
    renderPage();
    expect(await screen.findByText('Performance lab')).toBeDefined();
    expect(screen.getByText('Selected period')).toBeDefined();
  });
});
