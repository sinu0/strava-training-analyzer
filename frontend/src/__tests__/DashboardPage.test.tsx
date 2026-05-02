import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

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
      hourly: [],
      daily: [],
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
      healthSignals: {
        sourceDate: '2024-06-02',
        sleepScore: 82,
        bodyBattery: 68,
        restingHrBpm: 50,
        restingHrDelta: -1,
        scoreAdjustment: 6,
      },
      checkIn: {
        date: '2024-06-02',
        sleepQuality: 4,
        legFreshness: 4,
        motivation: 5,
        soreness: 2,
        scoreAdjustment: 10,
        updatedAt: '2024-06-02T06:30:00Z',
      },
    },
    isLoading: false,
  }),
  useSaveReadinessCheckIn: () => ({
    mutate: vi.fn(),
    isPending: false,
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
  useProgressionLevels: () => ({
    data: [
      {
        system: 'THRESHOLD',
        label: 'Próg',
        level: 6,
        currentLoad: 82,
        previousLoad: 55,
        targetLoad: 70,
        trend: 'UP',
        description: 'Próg rośnie stabilnie.',
        nextRecommendation: 'Broń jednego akcentu progowego.',
      },
    ],
    isLoading: false,
  }),
  useBlockHealth: () => ({
    data: {
      status: 'STABLE_PRODUCTIVE',
      label: 'Blok stabilny',
      description: 'Tydzień dowozi główny bodziec bez chaosu.',
      objectiveLabel: 'Budowa progu',
      programGoal: 'BUILD_PEAK',
      goalExecutionStatus: 'ON_TARGET',
      goalExecutionScore: 84,
      adjustmentDays: 1,
      missedStimulusDays: 0,
      overloadDays: 0,
      keySignals: ['Bodziec celu: 1/1', 'Korekty w 14 dniach: 1'],
      nextFocus: 'Broń progu i nie dokładaj losowej intensywności.',
    },
    isLoading: false,
  }),
}));
vi.mock('../hooks/useGamification', () => ({
  useAchievements: () => ({ data: [], isLoading: false }),
}));

vi.mock('../hooks/useAi', () => ({
  useAiStatus: () => ({
    data: { enabled: true, activeProvider: 'provider', activeModel: 'model', modelAvailable: true, availableProviders: ['provider'], availablePredictionTypes: ['TRAINING_COACH_SUMMARY'] },
  }),
  useTodayAiTips: () => ({ data: [], isLoading: false }),
  useLatestAiPrediction: () => ({
    data: {
      id: 'coach-1',
      predictionType: 'TRAINING_COACH_SUMMARY',
      modelId: 'model',
      providerName: 'provider',
      summary: 'Broń progu i pilnuj świeżości.',
      detail: 'detail',
      confidence: 0.82,
      createdAt: '2026-04-07T08:00:00Z',
      structuredData: {
        weekReview: 'Tydzień trzyma priorytet progowy.',
        blockReview: 'Blok nadal buduje próg.',
        keyWins: ['Próg rośnie.'],
        keyRisks: ['Weekend może wymusić auto-swap.'],
        nextFocus: 'Obroń jeden akcent progowy w 3-5 dni.',
      },
    },
  }),
  useAiPredict: () => ({ mutate: vi.fn(), isPending: false }),
  useAiNote: () => ({ data: null, isLoading: false }),
  useGenerateAiNote: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useDailyDecision', () => ({
  useDailyDecision: () => ({
    data: {
      decision: 'RIDE',
      workout: {
        type: 'ENDURANCE',
        durationMin: 90,
        targetTss: 75,
        difficulty: 'MODERATE',
        intensityDescription: 'Full workout as planned',
        description: '90min ENDURANCE ride',
        indoor: false,
      },
      confidence: { score: 0.82, label: 'VERY_HIGH', description: 'All signals agree' },
      risk: 'LOW',
      reasons: [
        { priority: 'SAFETY', signal: 'TSB', message: 'Good TSB', evidence: 'TSB=5' },
        { priority: 'PLAN', signal: 'SCHEDULE', message: 'Endurance planned', evidence: 'type=ENDURANCE' },
      ],
      alternatives: [
        {
          label: 'Shorter version',
          type: 'MODIFY',
          workout: {
            type: 'ENDURANCE',
            durationMin: 45,
            targetTss: 35,
            difficulty: 'EASY',
            intensityDescription: 'Half duration',
            description: 'Compact 45min session',
            indoor: false,
          },
          rationale: 'Time-efficient',
        },
      ],
    },
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

describe('DashboardPage v2', () => {
  it('renders the decision page with correct title', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getAllByText('Decyzja').length).toBeGreaterThan(0);
  });

  it('renders the decision hero card', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Decyzja na dziś')).toBeDefined();
    expect(screen.getByText('Jedź!')).toBeDefined();
  });

  it('renders the three-column layout with sticky side widgets', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Pogoda')).toBeDefined();
    expect(screen.getByText('Gotowość')).toBeDefined();
    expect(screen.getAllByText('Blok').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Postęp').length).toBeGreaterThan(0);
  });

  it('renders illustration artwork in widget cards', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByTestId('dashboard-widget-art-weather')).toBeDefined();
    expect(screen.getByTestId('dashboard-widget-art-readiness')).toBeDefined();
    expect(screen.getByTestId('dashboard-widget-art-block')).toBeDefined();
    expect(screen.getByTestId('dashboard-widget-art-progress')).toBeDefined();
  });

  it('renders the latest activity section', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Ostatni trening')).toBeDefined();
    expect(screen.getAllByText('Morning Ride').length).toBeGreaterThan(0);
  });

  it('renders PMC load chips', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('CTL')).toBeDefined();
    expect(screen.getByText('ATL')).toBeDefined();
    expect(screen.getAllByText('TSB').length).toBeGreaterThan(0);
  });

  it('renders coach AI summary panel', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Coach AI — podsumowanie')).toBeDefined();
  });

  it('renders quick navigation buttons', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Aktywności')).toBeDefined();
    expect(screen.getByText('Analityka')).toBeDefined();
  });

  it('renders the Daily Decision reasoning panel', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Dlaczego ta decyzja?')).toBeDefined();
  });

  it('renders the Daily Decision alternatives panel', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Alternatywy (1)')).toBeDefined();
  });
});
