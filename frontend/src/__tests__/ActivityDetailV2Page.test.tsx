import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import ActivityDetailV2Page from '@/features/history/ActivityDetailV2Page';
import theme from '@/theme/theme';

vi.mock('@/components/activity/ActivityRoutePreview', () => ({
  default: () => <div data-testid="activity-route-preview" />,
}));

vi.mock('@/features/history/useHistory', () => ({
  useV2Activity: () => ({
    data: {
      id: 'activity-1',
      externalId: 'strava-1',
      source: 'strava',
      sportType: 'cycling',
      name: 'Morning Ride',
      startedAt: '2026-08-21T08:00:00Z',
      movingTimeSec: 3600,
      distanceM: 40_000,
      metrics: [
        { name: 'training_stress_score', numericValue: 62.1 },
        { name: 'normalized_power', numericValue: 189.4 },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useActivityStreams: () => ({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() }),
  useActivityLaps: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));

describe('ActivityDetailV2Page', () => {
  it('renders localized metric metadata instead of raw database names', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/activities/activity-1']}>
          <Routes>
            <Route path="/activities/:id" element={<ActivityDetailV2Page />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByText('Obciążenie treningowe')).toBeDefined();
    expect(screen.getByText('62 pkt')).toBeDefined();
    expect(screen.getByText('Moc znormalizowana')).toBeDefined();
    expect(screen.getByText('189 W')).toBeDefined();
    expect(screen.queryByText(/training_stress_score/i)).toBeNull();
  });
});
