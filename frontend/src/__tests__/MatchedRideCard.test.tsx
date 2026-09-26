import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MatchedRideCard from '@/components/matched-rides/MatchedRideCard';
import { I18nProvider } from '@/i18n';
import theme from '@/theme/theme';

const { useMatchedRideMock } = vi.hoisted(() => ({
  useMatchedRideMock: vi.fn(),
}));

vi.mock('@/hooks/useMatchedRides', () => ({
  useMatchedRide: useMatchedRideMock,
}));

describe('MatchedRideCard', () => {
  beforeEach(() => {
    useMatchedRideMock.mockReturnValue({
      data: {
        routeGroupId: 'group-1',
        routeFamilyId: 'family-1',
        rideCount: 14,
        currentRank: 1,
        similarityPercent: 95,
        currentSpeedKmh: 26.7,
        changeFromPreviousKmh: 1.5,
        changeFromAverageKmh: 0.9,
        changeFromRecordKmh: 0,
        changeFromPreviousBestKmh: 1.5,
        newRecord: true,
        directionVariant: 'SAME',
        trend: [{ activityId: 'a', activityName: 'Ride', startedAt: '2026-01-01', averageSpeedKmh: 25 }],
      },
      isLoading: false,
      isError: false,
    });
  });

  it('shows record wording and route similarity', () => {
    render(<ThemeProvider theme={theme}><MemoryRouter><MatchedRideCard activityId="activity-1" /></MemoryRouter></ThemeProvider>);
    expect(screen.getByText('14 przejazdów na tej trasie · ten wynik: 1.')).toBeDefined();
    expect(screen.getByText('trasa podobna w 95%')).toBeDefined();
    expect(screen.getByText(/Nowy rekord — \+1,5 km\/h/)).toBeDefined();
  });

  it('ignores a malformed or partial response instead of crashing the activity page', () => {
    useMatchedRideMock.mockReturnValue({ data: [], isLoading: false, isError: false });

    expect(() => render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <MatchedRideCard activityId="activity-1" />
        </MemoryRouter>
      </ThemeProvider>,
    )).not.toThrow();

    expect(screen.queryByText('Dopasowane przejazdy')).toBeNull();
  });

  afterEach(() => window.localStorage.clear());

  it('renders English text when the language is switched', async () => {
    window.localStorage.setItem('strava-analizator.language', 'en');
    render(
      <I18nProvider>
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <MatchedRideCard activityId="activity-1" />
          </MemoryRouter>
        </ThemeProvider>
      </I18nProvider>,
    );
    expect(await screen.findByText('Matched rides')).toBeDefined();
    expect(screen.getByText('route 95% similar')).toBeDefined();
  });
});
