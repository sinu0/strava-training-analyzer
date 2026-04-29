import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeAll } from 'vitest';

import AnalyticsPage from '../pages/AnalyticsPage';
import theme from '../theme/theme';

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('../hooks/useAnalytics', () => ({
  usePmc: () => ({
    data: [
      { date: '2024-06-01', ctl: 55, atl: 70, tsb: -15 },
      { date: '2024-06-02', ctl: 56, atl: 68, tsb: -12 },
    ],
    isLoading: false,
  }),
  usePowerCurve: () => ({
    data: { efforts: { 1: 800, 5: 700, 60: 350, 300: 280, 1200: 250 } },
    isLoading: false,
  }),
  useZoneDistribution: () => ({
    data: { zoneType: 'power', zones: { Z1: 600, Z2: 1200, Z3: 900, Z4: 300, Z5: 120 }, totalSeconds: 3120 },
    isLoading: false,
  }),
  useWeeklySummaries: () => ({
    data: [
      { weekStart: '2024-06-03', activityCount: 5, totalDistanceM: 150000, totalTimeSec: 18000, totalElevationM: 1200, totalTss: 350 },
    ],
    isLoading: false,
  }),
  useTrends: () => ({
    data: [
      { date: '2024-06-01', metricName: 'ftp', value: 260 },
      { date: '2024-06-15', metricName: 'ftp', value: 265 },
    ],
    isLoading: false,
  }),
  useComparePeriods: () => ({ data: undefined, isLoading: false }),
  useWeeklyOptimalLoad: () => ({ data: [], isLoading: false }),
  useDailyOptimalLoad: () => ({ data: [], isLoading: false }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('AnalyticsPage', () => {
  it('renders tabs and PMC chart by default', () => {
    renderWithProviders(<AnalyticsPage />);

    expect(screen.getByRole('heading', { name: 'Analityka' })).toBeDefined();
    expect(screen.getByRole('img', { name: 'Analityka hero' })).toBeDefined();
    expect(screen.getAllByText('PMC').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Krzywa mocy')).toBeDefined();
    expect(screen.getByText('Obciążenie')).toBeDefined();
    expect(screen.getByText('Trendy')).toBeDefined();
    expect(screen.queryByRole('tab', { name: 'Strefy' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Porównanie' })).toBeNull();
    // Default tab shows PMC section
    expect(screen.getByText('CTL / ATL / TSB')).toBeDefined();
  });
});
