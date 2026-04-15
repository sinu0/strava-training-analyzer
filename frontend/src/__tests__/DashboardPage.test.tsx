import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeAll } from 'vitest';

import DashboardPage from '../pages/DashboardPage';
import theme from '../theme/theme';

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('../hooks/useAnalytics', () => ({
  useWeeklySummaries: () => ({
    data: [
      {
        weekStart: '2024-06-03',
        activityCount: 5,
        totalDistanceM: 150000,
        totalTimeSec: 18000,
        totalElevationM: 1200,
        totalTss: 350,
      },
    ],
    isLoading: false,
  }),
  usePmc: () => ({
    data: [
      { date: '2024-06-01', ctl: 55.0, atl: 70.0, tsb: -15.0, ctlDelta: 1.2, atlDelta: -0.8, tsbDelta: 2.0 },
      { date: '2024-06-02', ctl: 56.0, atl: 68.0, tsb: -12.0, ctlDelta: 1.0, atlDelta: -2.0, tsbDelta: 3.0 },
    ],
    isLoading: false,
  }),
  useRecentActivities: () => ({
    data: [
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
    ],
    isLoading: false,
  }),
  useWeatherForecast: () => ({
    data: {
      current: {
        temperature: 22,
        windSpeed: 10,
        precipitation: 0,
        weatherCode: 1,
        weatherDescription: 'Przeważnie bezchmurnie',
        outdoorScore: 85,
        warnings: [],
      },
      hourly: [
        { time: '2024-06-02T10:00', temperature: 23, windSpeed: 8, precipitation: 0, weatherCode: 1, weatherDescription: 'Bezchmurnie' },
        { time: '2024-06-02T12:00', temperature: 25, windSpeed: 10, precipitation: 0, weatherCode: 1, weatherDescription: 'Bezchmurnie' },
      ],
      daily: [
        { date: '2024-06-03', tempMin: 14, tempMax: 26, precipitationSum: 0, windSpeedMax: 12, weatherCode: 1, weatherDescription: 'Bezchmurnie' },
      ],
    },
    isLoading: false,
  }),
  useFtpProgress: () => ({
    data: {
      currentFtp: 280,
      trend: 'up',
      changePercent: 3.5,
      history: [
        { date: '2024-04-01', value: 270 },
        { date: '2024-06-01', value: 280 },
      ],
    },
    isLoading: false,
  }),
  useReadiness: () => ({
    data: {
      score: 72,
      level: 'wysoka',
      tsb: 8,
      ctl: 55,
      atl: 47,
      description: 'Organizm wypoczęty, dobry dzień na intensywny trening',
    },
    isLoading: false,
  }),
  useZoneDistribution: () => ({
    data: {
      zoneType: 'power',
      zones: { Z1: 10, Z2: 40, Z3: 25, Z4: 15, Z5: 8, Z6: 2 },
      totalSeconds: 36000,
    },
    isLoading: false,
  }),
  useWeatherLocations: () => ({
    data: [
      { id: '1', name: 'Kraków', latitude: 50.06, longitude: 19.94, active: true },
    ],
    isLoading: false,
  }),
  useWeatherGradient: () => ({
    data: {
      locationName: 'Kraków',
      current: {
        temperature: 22,
        windSpeed: 10,
        precipitation: 0,
        weatherCode: 1,
        weatherDescription: 'Przeważnie bezchmurnie',
        outdoorScore: 85,
        warnings: [],
      },
      days: [],
    },
    isLoading: false,
  }),
  useAddWeatherLocation: () => ({ mutate: vi.fn() }),
  useDeleteWeatherLocation: () => ({ mutate: vi.fn() }),
  useActivateWeatherLocation: () => ({ mutate: vi.fn() }),
  useRefreshWeatherCache: () => ({ mutate: vi.fn() }),
  usePowerCurve: () => ({
    data: {
      efforts: { 5: 900, 30: 550, 60: 420, 300: 310, 1200: 275, 1800: 260, 3600: 240, 7200: 210 },
    },
    isLoading: false,
  }),
  useProfile: () => ({
    data: { id: '1', name: 'Test', weightKg: 75, ftpWatts: 280, stravaConnected: true },
    isLoading: false,
  }),
  useWeeklyOptimalLoad: () => ({
    data: [
      {
        weekStart: '2024-06-03',
        activityCount: 5,
        actualTss: 350,
        ctl: 55,
        optimalMin: 280,
        optimalTarget: 340,
        optimalMax: 380,
        dangerThreshold: 450,
        status: 'OPTIMAL',
      },
    ],
    isLoading: false,
  }),
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

describe('DashboardPage', () => {
  it('renders all dashboard cards', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Gotowość na dziś')).toBeDefined();
    expect(screen.getByText('Trening dziś')).toBeDefined();
    expect(screen.getByText('Analiza obciążeń')).toBeDefined();
    expect(screen.getByText('Aktywności i AI')).toBeDefined();
    expect(screen.getByText('Szybkie przejścia')).toBeDefined();
  });

  it('renders recent activity name', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Morning Ride')).toBeDefined();
  });
});
