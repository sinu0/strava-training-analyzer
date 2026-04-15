import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRoutePlannerState } from '@/pages/route-planner/useRoutePlannerState';

import type { ReactNode } from 'react';

const { fetchRouteMock, generateRouteAlternativesFromHistoryMock } = vi.hoisted(() => ({
  fetchRouteMock: vi.fn().mockResolvedValue({
    polyline: [],
    distanceM: 0,
    elevationGainM: 0,
    estimatedTimeSec: 0,
    estimatedTss: 0,
    provider: 'MANUAL',
    profile: 'manual',
    pavedDistanceM: 0,
    unpavedDistanceM: 0,
    cyclewayDistanceM: 0,
    quietDistanceM: 0,
    notices: [],
  }),
  generateRouteAlternativesFromHistoryMock: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/hooks/useRoutePlanner', () => ({
  useRoutes: () => ({ data: [], isLoading: false }),
  useCreateRoute: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteRoute: () => ({ mutate: vi.fn() }),
  useExportGpx: () => ({ mutate: vi.fn() }),
  useRouteWeather: () => [],
  generateRouteAlternativesFromHistory: generateRouteAlternativesFromHistoryMock,
  fetchRoute: fetchRouteMock,
  fetchElevation: vi.fn().mockResolvedValue([]),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('useRoutePlannerState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchRouteMock.mockClear();
    generateRouteAlternativesFromHistoryMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('recalculates the preview with default preferences after adding two waypoints', async () => {
    const { result } = renderHook(() => useRoutePlannerState(), {
      wrapper: Wrapper,
    });

    expect(result.current.generatorDistanceKm).toBe(40);
    expect(result.current.generatorVariationLevel).toBe(35);
    expect(result.current.showWeather).toBe(false);

    act(() => {
      result.current.handleAddWaypoint([50.06, 19.94]);
    });

    act(() => {
      result.current.handleAddWaypoint([50.07, 19.95]);
    });

    await act(async () => {
      vi.advanceTimersByTime(220);
      await Promise.resolve();
    });

    expect(fetchRouteMock).toHaveBeenCalledWith(
      [
        [50.06, 19.94],
        [50.07, 19.95],
      ],
      {
        trafficPreference: 'quieter',
        surfacePreference: 'asphalt',
        distancePreference: 'balanced',
        climbPreference: 'balanced',
      },
    );
  });
});
