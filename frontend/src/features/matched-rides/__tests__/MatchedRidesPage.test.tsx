import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/i18n';
import theme from '@/theme/theme';

import MatchedRidesPage from '../MatchedRidesPage';

vi.mock('@/hooks/useMatchedRides', () => ({
  useMatchedRideGroup: () => ({
    data: {
      routeGroupId: 'group-1',
      routeFamilyId: 'family-1',
      algorithmVersion: 2,
      directionKey: 'same',
      rideCount: 3,
      bestSpeedKmh: 27,
      averageSpeedKmh: 25,
      slowestSpeedKmh: 22,
      rides: [
        { activityId: 'a', activityName: 'Ride A', startedAt: '2026-01-01', averageSpeedKmh: 22, similarityPercent: 90 },
        { activityId: 'b', activityName: 'Ride B', startedAt: '2026-01-08', averageSpeedKmh: 25, similarityPercent: 92 },
        { activityId: 'c', activityName: 'Ride C', startedAt: '2026-01-15', averageSpeedKmh: 27, similarityPercent: 95 },
      ],
    },
    isLoading: false,
    isError: false,
  }),
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
        <MemoryRouter initialEntries={['/matched-rides/group-1']}>
          <Routes>
            <Route path="/matched-rides/:routeGroupId" element={<MatchedRidesPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </I18nProvider>,
  );
}

describe('MatchedRidesPage', () => {
  afterEach(() => window.localStorage.clear());

  it('renders the Polish page by default', () => {
    renderPage();
    expect(screen.getByText('Progres na tej trasie')).toBeDefined();
  });

  it('renders English text when the language is switched', async () => {
    window.localStorage.setItem('strava-analizator.language', 'en');
    renderPage();
    expect(await screen.findByText('Progress on this route')).toBeDefined();
    expect(screen.getByText('Best')).toBeDefined();
  });
});
