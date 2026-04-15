import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import ActivityDetailPage from '@/pages/ActivityDetailPage';
import theme from '@/theme/theme';
import type { ActivityDetail } from '@/types/activity';

const activity: ActivityDetail = {
  id: 'activity-1',
  externalId: 'ext-1',
  source: 'strava',
  sportType: 'Ride',
  name: 'Morning Ride',
  description: 'Mocny trening z długim tempem.',
  startedAt: '2024-06-01T08:00:00Z',
  elapsedTimeSec: 3900,
  movingTimeSec: 3600,
  distanceM: 40000,
  elevationGainM: 500,
  elevationLossM: 500,
  avgSpeedMs: 8.5,
  maxSpeedMs: 14,
  avgHeartrate: 145,
  maxHeartrate: 178,
  avgPowerW: 220,
  maxPowerW: 410,
  avgCadence: 88,
  maxCadence: 106,
  calories: 800,
  avgTempC: 19,
  summaryPolyline: null,
  photoUrls: null,
  powerStream: null,
  heartrateStream: null,
  cadenceStream: null,
  altitudeStream: null,
  timeStream: null,
  latStream: null,
  lngStream: null,
  distanceStream: null,
  velocityStream: null,
  laps: null,
  metrics: {},
  createdAt: '2024-06-01T08:00:00Z',
  updatedAt: '2024-06-01T08:00:00Z',
};

vi.mock('@/hooks/useActivities', () => ({
  useActivity: () => ({ data: activity, isLoading: false, error: null }),
  useActivityMap: () => ({ data: null, isLoading: false, error: null }),
  useRecalculateActivityMetrics: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/components/activity/OverviewTab', () => ({
  default: () => <div>Zakładka przegląd</div>,
}));

vi.mock('@/components/activity/AnalysisTab', () => ({
  default: () => <div>Zakładka analiza</div>,
}));

vi.mock('@/components/activity/AdvancedStatsTab', () => ({
  default: () => <div>Zakładka zaawansowane</div>,
}));

vi.mock('@/components/AiCoachSection', () => ({
  default: () => <div>Zakładka AI</div>,
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/activities/activity-1']}>
          <Routes>
            <Route path="/activities/:id" element={<ActivityDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('ActivityDetailPage', () => {
  it('renders the refreshed page shell with page title and primary actions', () => {
    renderPage();

    expect(screen.getByText('Szczegóły aktywności')).toBeDefined();
    expect(screen.getAllByText('Morning Ride').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Przelicz metryki' })).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Przegląd' })).toBeDefined();
  });
});
