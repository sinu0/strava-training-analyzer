import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MmpTrendChart from '../components/analytics/MmpTrendChart';

const { useWeeklyMmpMock } = vi.hoisted(() => ({
  useWeeklyMmpMock: vi.fn(),
}));

vi.mock('../hooks/usePowerAnalysis', () => ({
  useWeeklyMmp: (...args: unknown[]) => useWeeklyMmpMock(...args),
}));

function renderChart() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MmpTrendChart from="2025-01-01" to="2025-01-31" />
    </QueryClientProvider>,
  );
}

describe('MmpTrendChart states', () => {
  beforeEach(() => {
    useWeeklyMmpMock.mockReset();
  });

  it('renders an empty state when there is no MMP data', () => {
    useWeeklyMmpMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    renderChart();

    expect(screen.getByText('Brak danych MMP dla wybranego zakresu.')).toBeDefined();
  });

  it('renders an error state when the query fails', () => {
    useWeeklyMmpMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error('Request failed with status code 500'),
    });

    renderChart();

    expect(screen.getByText('Nie udało się załadować trendu MMP.')).toBeDefined();
    expect(screen.getByText('Request failed with status code 500')).toBeDefined();
  });
});
