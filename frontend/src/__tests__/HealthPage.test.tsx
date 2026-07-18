import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

vi.mock('../hooks/useHealth', () => ({
  useHealthOverview: vi.fn(),
  useHealthTimeline: vi.fn(),
  useRecoveryStatus: vi.fn(),
}));

// Must import after mock
import * as useHealthModule from '../hooks/useHealth';
import HealthPage from '../pages/HealthPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderPage() {
  return render(
    <QueryClientProvider client={qc}>
      <HealthPage />
    </QueryClientProvider>
  );
}

describe('HealthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when data is loading', () => {
    vi.mocked(useHealthModule.useHealthOverview).mockReturnValue({
      data: undefined, isLoading: true, error: null,
    } as any);
    vi.mocked(useHealthModule.useHealthTimeline).mockReturnValue({
      data: undefined, isLoading: true, error: null,
    } as any);
    vi.mocked(useHealthModule.useRecoveryStatus).mockReturnValue({
      data: undefined, isLoading: true, error: null,
    } as any);

    renderPage();
    expect(screen.getByRole('progressbar')).toBeDefined();
  });

  it('renders page title and sections with data', () => {
    const overview = {
      latest: {
        date: '2024-03-15',
        restingHrBpm: 52,
        hrvRmssd: 45.5,
        bodyBattery: 75,
        sleepScore: 82,
        stressAvg: 35,
        sleepDurationSeconds: 28800,
        steps: 10500,
        activeCalories: 450,
        deepSleepSeconds: 7200,
        lightSleepSeconds: 14400,
        remSleepSeconds: 5400,
        awakeSleepSeconds: 1800,
      },
      hrvTrend: { current: 45.5, periodAvg: 42.0, sevenDayAvg: 44.0, direction: 'rosnący' },
      sleepTrend: { latestScore: 82, avgScore: 78.5, avgDurationSeconds: 27000 },
      stressTrend: { current: 35, avg: 38.0 },
      restingHrTrend: { current: 52, avg: 53.5, direction: 'malejący' },
    };

    const recovery = { score: 75, level: 'dobra regeneracja', description: 'Dobry poziom.', alerts: [] };

    vi.mocked(useHealthModule.useHealthOverview).mockReturnValue({
      data: overview, isLoading: false, error: null,
    } as any);
    vi.mocked(useHealthModule.useHealthTimeline).mockReturnValue({
      data: [], isLoading: false, error: null,
    } as any);
    vi.mocked(useHealthModule.useRecoveryStatus).mockReturnValue({
      data: recovery, isLoading: false, error: null,
    } as any);

    renderPage();
    expect(screen.getByText(/Zdrowie/)).toBeDefined();
    expect(screen.getByText('Regeneracja dziś')).toBeDefined();
    expect(screen.getByText('dobra regeneracja')).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Serce' })).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Sen' })).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Energia' })).toBeDefined();
    expect(screen.getByText('Tętno spoczynkowe')).toBeDefined();
  });

  it('renders alerts when recovery has warnings', () => {
    const overview = {
      latest: null,
      hrvTrend: { current: null, periodAvg: null, sevenDayAvg: null, direction: 'brak danych' },
      sleepTrend: { latestScore: null, avgScore: null, avgDurationSeconds: null },
      stressTrend: { current: null, avg: null },
      restingHrTrend: { current: null, avg: null, direction: 'stabilny' },
    };

    const recovery = {
      score: 30,
      level: 'duże zmęczenie',
      description: 'Wysoki poziom zmęczenia.',
      alerts: ['HRV poniżej 80% średniej', 'Wysoki stres'],
    };

    vi.mocked(useHealthModule.useHealthOverview).mockReturnValue({
      data: overview, isLoading: false, error: null,
    } as any);
    vi.mocked(useHealthModule.useHealthTimeline).mockReturnValue({
      data: [], isLoading: false, error: null,
    } as any);
    vi.mocked(useHealthModule.useRecoveryStatus).mockReturnValue({
      data: recovery, isLoading: false, error: null,
    } as any);

    renderPage();
    expect(screen.getByText('HRV poniżej 80% średniej')).toBeDefined();
    expect(screen.getByText('Wysoki stres')).toBeDefined();
  });

  it('renders unknown recovery without presenting a zero score', () => {
    const overview = {
      latest: null,
      hrvTrend: { current: null, periodAvg: null, sevenDayAvg: null, direction: 'brak danych' },
      sleepTrend: { latestScore: null, avgScore: null, avgDurationSeconds: null },
      stressTrend: { current: null, avg: null },
      restingHrTrend: { current: null, avg: null, direction: 'brak danych' },
    };
    vi.mocked(useHealthModule.useHealthOverview).mockReturnValue({ data: overview, isLoading: false } as any);
    vi.mocked(useHealthModule.useHealthTimeline).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(useHealthModule.useRecoveryStatus).mockReturnValue({
      data: { score: null, availability: 'UNKNOWN', level: 'brak danych', description: 'Brak danych zdrowotnych.', alerts: [] },
      isLoading: false,
    } as any);

    renderPage();

    expect(screen.getByText('Brak danych do oceny')).toBeDefined();
    expect(screen.queryByText('0')).toBeNull();
  });
});
