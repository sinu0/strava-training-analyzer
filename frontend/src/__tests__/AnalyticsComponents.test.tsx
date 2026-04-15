import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';

import MmpTrendChart from '../components/analytics/MmpTrendChart';
import RaceReadinessCard from '../components/analytics/RaceReadinessCard';
import TrainingPhasesChart from '../components/analytics/TrainingPhasesChart';
import WPrimeBalanceChart from '../components/analytics/WPrimeBalanceChart';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

vi.mock('../hooks/usePowerAnalysis', () => ({
  useWeeklyMmp: () => ({
    data: [
      { weekLabel: 'W1', weekStart: '2025-01-06', bestEfforts: { '5s': 800, '1min': 400, '5min': 300, '20min': 260 } },
      { weekLabel: 'W2', weekStart: '2025-01-13', bestEfforts: { '5s': 820, '1min': 410, '5min': 310, '20min': 265 } },
    ],
    isLoading: false,
  }),
  useWPrimeBalance: () => ({
    data: {
      wPrime: 15000,
      criticalPower: 200,
      minBalance: 3750,
      avgBalance: 10000,
      secondsBelowFiftyPct: 120,
      secondsBelowTwentyFivePct: 30,
      depletionEvents: 2,
      balanceOverTime: Array.from({ length: 100 }, (_, i) => 15000 - i * 50),
    },
    isLoading: false,
  }),
}));

vi.mock('../hooks/useTrainingTrends', () => ({
  useTrainingPhases: () => ({
    data: {
      phases: [
        { weekLabel: 'W1', weekStart: '2025-01-06', phase: 'BASE', avgCtl: 60, avgAtl: 45, avgTsb: 15, totalTss: 350, avgIntensityFactor: 0.62, totalDurationMin: 600 },
        { weekLabel: 'W2', weekStart: '2025-01-13', phase: 'BUILD', avgCtl: 65, avgAtl: 55, avgTsb: 10, totalTss: 420, avgIntensityFactor: 0.72, totalDurationMin: 540 },
      ],
      currentPhase: 'BUILD',
      recommendation: 'Kontynuuj zwiększanie intensywności',
      periodizationScore: 72,
    },
    isLoading: false,
  }),
  useRaceReadiness: () => ({
    data: null,
    isLoading: false,
  }),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('MmpTrendChart', () => {
  it('renders chart title and duration toggles', () => {
    wrap(<MmpTrendChart from="2025-01-01" to="2025-01-31" />);
    expect(screen.getByText('Trend mocy maksymalnej (MMP)')).toBeDefined();
    expect(screen.getByText('5s')).toBeDefined();
    expect(screen.getByText('20min')).toBeDefined();
  });
});

describe('WPrimeBalanceChart', () => {
  it('renders stats chips', () => {
    wrap(<WPrimeBalanceChart activityId="abc-123" />);
    expect(screen.getByText("W' Balance")).toBeDefined();
    expect(screen.getByText('CP: 200 W')).toBeDefined();
    expect(screen.getByText('Wyczerpania: 2')).toBeDefined();
  });
});

describe('TrainingPhasesChart', () => {
  it('renders current phase and score', () => {
    wrap(<TrainingPhasesChart from="2025-01-01" to="2025-01-31" />);
    expect(screen.getByText('Fazy treningowe')).toBeDefined();
    expect(screen.getAllByText(/Budowanie/).length).toBeGreaterThan(0);
    expect(screen.getByText('Ocena periodyzacji: 72/100')).toBeDefined();
  });
});

describe('RaceReadinessCard', () => {
  it('renders date input and title', () => {
    wrap(<RaceReadinessCard />);
    expect(screen.getByText('Gotowość na wyścig')).toBeDefined();
    expect(screen.getByLabelText('Data wyścigu')).toBeDefined();
  });
});
