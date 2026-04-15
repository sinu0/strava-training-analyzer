import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import apiClient from '../api/client';
import { useComparePeriods, usePowerCurve } from '../hooks/useAnalytics';

import type { ReactNode } from 'react';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('analytics hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses backend compare parameter names and adapts the response to an array', async () => {
    const mockedGet = vi.mocked(apiClient.get);
    const compareResponse = {
      period1: {
        period: 'current',
        from: '2024-06-01',
        to: '2024-06-30',
        activityCount: 8,
        totalDistanceM: 250000,
        totalTimeSec: 24000,
        totalElevationM: 2200,
      },
      period2: {
        period: 'previous',
        from: '2024-05-01',
        to: '2024-05-31',
        activityCount: 6,
        totalDistanceM: 180000,
        totalTimeSec: 18000,
        totalElevationM: 1700,
      },
    };

    mockedGet.mockResolvedValueOnce({ data: compareResponse } as never);

    const { result } = renderHook(
      () =>
        useComparePeriods(
          { from: '2024-06-01', to: '2024-06-30' },
          { from: '2024-05-01', to: '2024-05-31' },
        ),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/analytics/compare', {
      params: {
        period1From: '2024-06-01',
        period1To: '2024-06-30',
        period2From: '2024-05-01',
        period2To: '2024-05-31',
      },
    });
    expect(result.current.data).toEqual([compareResponse.period1, compareResponse.period2]);
  });

  it('does not request power curve data when the hook is disabled', () => {
    const mockedGet = vi.mocked(apiClient.get);

    renderHook(
      () => usePowerCurve({ from: '2024-06-01', to: '2024-06-30' }, { enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('requests power curve data with the selected date range', async () => {
    const mockedGet = vi.mocked(apiClient.get);
    mockedGet.mockResolvedValueOnce({
      data: { efforts: { 5: 820, 60: 410 } },
    } as never);

    const { result } = renderHook(
      () => usePowerCurve({ from: '2024-07-01', to: '2024-07-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/analytics/power-curve', {
      params: {
        from: '2024-07-01',
        to: '2024-07-31',
      },
    });
  });
});
