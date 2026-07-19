import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import HistoryPage from '@/features/history/HistoryPage';
import { useHistoryActivities } from '@/features/history/useHistory';
import theme from '@/theme/theme';

vi.mock('@/components/ActivityMap', () => ({
  default: () => <div data-testid="history-preview-map" />,
}));

vi.mock('@/features/history/useHistory', () => ({
  useHistoryActivities: vi.fn(),
}));

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/activities']}>
        <HistoryPage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('HistoryPage V2', () => {
  beforeEach(() => {
    vi.mocked(useHistoryActivities).mockReturnValue({
      data: {
        items: [{
          id: 'activity-1',
          externalId: 'strava-1',
          sportType: 'cycling',
          name: 'Morning Ride',
          startedAt: '2026-07-18T07:01:16Z',
          movingTimeSec: 7566,
          distanceM: 57526,
          elevationGainM: 186,
          avgHeartrate: 149,
          avgPowerW: 161,
          avgSpeedMs: 7.6,
          calories: 1467,
          summaryPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
          primaryBenefit: 'TEMPO',
          trainingScore: 54,
        }],
        total: 1,
        page: 0,
        size: 20,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useHistoryActivities>);
  });

  it('shows a Strava-like route preview and useful ride metrics in list view', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Morning Ride' })).toBeDefined();
    expect(screen.getByLabelText('Mapa trasy: Morning Ride')).toBeDefined();
    expect(await screen.findByTestId('history-preview-map')).toBeDefined();
    expect(screen.getByText('57,5 km')).toBeDefined();
    expect(screen.getByText('161 W')).toBeDefined();
    expect(screen.getByText('149 bpm')).toBeDefined();
  });
});
