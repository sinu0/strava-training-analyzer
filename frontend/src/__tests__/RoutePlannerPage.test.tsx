import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

import RoutePlannerPage from '@/pages/RoutePlannerPage';

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
  generateRouteAlternativesFromHistoryMock: vi.fn().mockResolvedValue([
    {
      waypoints: [
        [50.06, 19.94],
        [50.08, 19.99],
        [50.06, 19.94],
      ],
      preview: {
        polyline: [
          [50.06, 19.94],
          [50.07, 19.97],
          [50.08, 19.99],
          [50.06, 19.94],
        ],
        distanceM: 38000,
        elevationGainM: 420,
        estimatedTimeSec: 5100,
        estimatedTss: 98,
        provider: 'BRouter',
        profile: 'safety#1',
        pavedDistanceM: 25000,
        unpavedDistanceM: 3000,
        cyclewayDistanceM: 9000,
        quietDistanceM: 21000,
        notices: [],
      },
      sourceName: 'Weekend Loop',
      sourceType: 'planned-route',
      strategy: 'Wariant dłuższej pętli na bazie historii',
      style: 'balanced',
      seed: 123,
    },
    {
      waypoints: [
        [50.06, 19.94],
        [50.09, 20.01],
        [50.06, 19.94],
      ],
      preview: {
        polyline: [
          [50.06, 19.94],
          [50.075, 19.98],
          [50.09, 20.01],
          [50.06, 19.94],
        ],
        distanceM: 45000,
        elevationGainM: 650,
        estimatedTimeSec: 5600,
        estimatedTss: 118,
        provider: 'BRouter',
        profile: 'hillclimb#0',
        pavedDistanceM: 21000,
        unpavedDistanceM: 5000,
        cyclewayDistanceM: 6000,
        quietDistanceM: 17000,
        notices: [],
      },
      sourceName: 'Climb Builder',
      sourceType: 'activity',
      strategy: 'Wariant trudniejszy',
      style: 'harder',
      seed: 124,
    },
  ]),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

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

vi.mock('@/components/route-planner/RouteMap', () => ({
  default: ({
    onAddWaypoint,
    generatedAlternatives,
    selectedAlternativeIndex,
    onCycleAlternative,
    onSelectAlternative,
  }: {
    onAddWaypoint: (latlng: [number, number]) => void;
    generatedAlternatives: Array<{ sourceName: string }>;
    selectedAlternativeIndex: number;
    onCycleAlternative: (direction: -1 | 1) => void;
    onSelectAlternative: (index: number) => void;
  }) => (
    <div>
      <div data-testid="route-map" onClick={() => onAddWaypoint([50.06, 19.94])}>
        MapMock
      </div>
      {generatedAlternatives.length > 0 && (
        <div>
          <div>{generatedAlternatives[selectedAlternativeIndex]?.sourceName}</div>
          <button aria-label="Poprzednia propozycja" onClick={() => onCycleAlternative(-1)} />
          <button aria-label="Następna propozycja" onClick={() => onCycleAlternative(1)} />
          {generatedAlternatives.map((alternative, index) => (
            <button
              key={alternative.sourceName}
              aria-label={`Pokaż propozycję ${index + 1}`}
              onClick={() => onSelectAlternative(index)}
            >
              Propozycja {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  ),
}));

vi.mock('@/components/route-planner/RouteElevationChart', () => ({
  default: () => <div data-testid="elevation-profile">ElevationMock</div>,
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <RoutePlannerPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RoutePlannerPage', () => {
  beforeEach(() => {
    fetchRouteMock.mockClear();
    generateRouteAlternativesFromHistoryMock.mockClear();
  });

  it('renders main layout elements', () => {
    renderPage();
    expect(screen.getByText('Planowanie trasy')).toBeDefined();
    expect(screen.getByTestId('route-map')).toBeDefined();
    expect(screen.getByTestId('elevation-profile')).toBeDefined();
    expect(screen.getByLabelText('Nazwa trasy')).toBeDefined();
    expect(screen.getByText('Pokaż dymki pogodowe na trasie')).toBeDefined();
  });

  it('disables save button when no name or waypoints', () => {
    renderPage();
    const saveBtn = screen.getByText('Zapisz');
    expect(saveBtn.closest('button')?.disabled).toBe(true);
  });

  it('shows empty routes message', () => {
    renderPage();
    expect(screen.getByText('Brak zapisanych tras')).toBeDefined();
  });

  it('enables undo after adding a waypoint via map click', async () => {
    renderPage();
    const map = screen.getByTestId('route-map');
    fireEvent.click(map);
    const undoBtn = screen.getByText('Cofnij');
    expect(undoBtn.closest('button')?.disabled).toBe(false);
  });

  it('requests route preview from backend with default preferences after adding two points', async () => {
    renderPage();
    const map = screen.getByTestId('route-map');

    fireEvent.click(map);
    fireEvent.click(map);

    await waitFor(() => {
      expect(fetchRouteMock).toHaveBeenCalledWith(
        [
          [50.06, 19.94],
          [50.06, 19.94],
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

  it('requests generated route alternatives from backend with default generator settings', async () => {
    renderPage();

    fireEvent.click(screen.getByText('Generuj 3 warianty'));

    await waitFor(() => {
      expect(generateRouteAlternativesFromHistoryMock).toHaveBeenCalledWith({
        startPoint: null,
        targetDistanceKm: 40,
        style: 'balanced',
        variationLevel: 35,
        seed: expect.any(Number),
        routePlanningPreferences: {
          trafficPreference: 'quieter',
          surfacePreference: 'asphalt',
          distancePreference: 'balanced',
          climbPreference: 'balanced',
        },
      });
    });
  });

  it('renders generated alternatives after backend response', async () => {
    renderPage();

    fireEvent.click(screen.getByText('Generuj 3 warianty'));

    expect(await screen.findByText('Weekend Loop')).toBeDefined();
    expect(screen.getByLabelText('Poprzednia propozycja')).toBeDefined();
    expect(screen.getByLabelText('Następna propozycja')).toBeDefined();
    expect(screen.getByLabelText('Pokaż propozycję 1')).toBeDefined();
    expect(screen.getByLabelText('Pokaż propozycję 2')).toBeDefined();

    fireEvent.click(screen.getByLabelText('Następna propozycja'));

    expect(await screen.findByText('Climb Builder')).toBeDefined();
  });
});
