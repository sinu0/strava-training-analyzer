import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import RouteHeatmap, { toRelativeLayerPoint, chainSegments } from '../components/RouteHeatmap';
import theme from '../theme/theme';

import type { ActivityHeatmapData } from '../types/activity';

vi.mock('leaflet', () => ({}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="heatmap-map">{children}</div>,
  TileLayer: ({ url }: { url: string }) => <div data-testid="heatmap-tile" data-url={url} />,
  useMap: () => ({ fitBounds: vi.fn() }),
}));

const useRouteHeatmapMock = vi.fn();
vi.mock('../hooks/useActivities', () => ({
  useRouteHeatmap: () => useRouteHeatmapMock(),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockData: ActivityHeatmapData = {
  routeCount: 7,
  segments: [
    // A simple chain of 3 segments: A→B→C→D
    { lat1: 50.06000, lon1: 19.94000, lat2: 50.06100, lon2: 19.94100, count: 3 },
    { lat1: 50.06100, lon1: 19.94100, lat2: 50.06200, lon2: 19.94200, count: 3 },
    { lat1: 50.06200, lon1: 19.94200, lat2: 50.06300, lon2: 19.94300, count: 5 },
    // An isolated segment
    { lat1: 50.07000, lon1: 19.95000, lat2: 50.07100, lon2: 19.95100, count: 2 },
  ],
  bounds: { north: 50.1, south: 49.9, east: 20.0, west: 19.8 },
  totalDistanceKm: 312.7,
  maxCount: 10,
  status: 'ready',
};

describe('RouteHeatmap', () => {
  beforeEach(() => {
    useRouteHeatmapMock.mockReset();
  });

  it('renders loading skeleton while fetching data', () => {
    useRouteHeatmapMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderWithTheme(<RouteHeatmap />);
    expect(screen.getByTestId('heatmap-loading')).toBeDefined();
  });

  it('renders empty state when there are no routes', () => {
    useRouteHeatmapMock.mockReturnValue({
      data: { segments: [], routeCount: 0, bounds: null, totalDistanceKm: 0, maxCount: 0 },
      isLoading: false,
      isError: false,
    });
    renderWithTheme(<RouteHeatmap />);
    expect(screen.getByTestId('heatmap-empty')).toBeDefined();
    expect(screen.getByText(/Brak tras/i)).toBeDefined();
  });

  it('renders map container when segments are provided', () => {
    useRouteHeatmapMock.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });
    renderWithTheme(<RouteHeatmap />);
    expect(screen.getByTestId('route-heatmap')).toBeDefined();
    expect(screen.getByTestId('heatmap-map')).toBeDefined();
    const tiles = screen.getAllByTestId('heatmap-tile');
    expect(tiles[0]?.getAttribute('data-url')).toContain('openstreetmap.org');
    expect(tiles[1]?.getAttribute('data-url')).toContain('/api/activities/heatmap/tile');
  });

  it('renders stats overlay with activity count and total distance', () => {
    useRouteHeatmapMock.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });
    renderWithTheme(<RouteHeatmap />);
    expect(screen.getByTestId('heatmap-stats')).toBeDefined();
    expect(screen.getByText(/7/)).toBeDefined();
    expect(screen.getByText(/313|312/)).toBeDefined();
    // maxCount from data (10) should be shown
    expect(screen.getByText(/10×/)).toBeDefined();
  });

  it('computes relative layer points correctly', () => {
    expect(toRelativeLayerPoint({ x: 325, y: 210 }, { x: 120, y: 45 })).toEqual({ x: 205, y: 165 });
  });
});

describe('chainSegments', () => {
  it('returns single chain for linear sequence', () => {
    const segments = [
      { lat1: 50.06000, lon1: 19.94000, lat2: 50.06100, lon2: 19.94100, count: 3 },
      { lat1: 50.06100, lon1: 19.94100, lat2: 50.06200, lon2: 19.94200, count: 3 },
      { lat1: 50.06200, lon1: 19.94200, lat2: 50.06300, lon2: 19.94300, count: 5 },
    ];
    const chains = chainSegments(segments);
    expect(chains).toHaveLength(1);
    expect(chains[0]!.path).toHaveLength(4);
  });

  it('returns isolated segment as chain of 2 points', () => {
    const segments = [
      { lat1: 50.07000, lon1: 19.95000, lat2: 50.07100, lon2: 19.95100, count: 2 },
    ];
    const chains = chainSegments(segments);
    expect(chains).toHaveLength(1);
    expect(chains[0]!.path).toHaveLength(2);
  });

  it('assigns max count to chain', () => {
    const segments = [
      { lat1: 50.06000, lon1: 19.94000, lat2: 50.06100, lon2: 19.94100, count: 3 },
      { lat1: 50.06100, lon1: 19.94100, lat2: 50.06200, lon2: 19.94200, count: 3 },
      { lat1: 50.06200, lon1: 19.94200, lat2: 50.06300, lon2: 19.94300, count: 5 },
    ];
    const chains = chainSegments(segments);
    expect(chains[0]!.count).toBe(5);
  });
});
