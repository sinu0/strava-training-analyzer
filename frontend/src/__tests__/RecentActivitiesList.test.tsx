import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import RecentActivitiesList from '../components/RecentActivitiesList';
import theme from '../theme/theme';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>,
  );
}

describe('RecentActivitiesList', () => {
  it('renders activity names and key stats', () => {
    renderWithProviders(
      <RecentActivitiesList
        activities={[
          {
            id: '1',
            externalId: '100',
            sportType: 'cycling',
            name: 'Morning Ride',
            startedAt: '2024-06-02T08:00:00Z',
            movingTimeSec: 3600,
            distanceM: 40000,
            elevationGainM: 500,
            avgHeartrate: 145,
            avgPowerW: 220,
            avgSpeedMs: 8.5,
            calories: 800,
          },
          {
            id: '2',
            externalId: '101',
            sportType: 'running',
            name: 'Evening Run',
            startedAt: '2024-06-01T18:00:00Z',
            movingTimeSec: 1800,
            distanceM: 5000,
            elevationGainM: 50,
            avgHeartrate: 160,
            avgPowerW: null,
            avgSpeedMs: 2.8,
            calories: 400,
          },
        ]}
      />,
    );

    expect(screen.getByText('Morning Ride')).toBeDefined();
    expect(screen.getByText('Evening Run')).toBeDefined();
  });

  it('renders empty message when no activities', () => {
    renderWithProviders(<RecentActivitiesList activities={[]} />);

    expect(screen.getByText('Brak aktywności.')).toBeDefined();
  });
});
