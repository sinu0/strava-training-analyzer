import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import ActivityFeedCard from '../components/ActivityFeedCard';
import theme from '../theme/theme';

import type { ActivitySummary } from '../types/activity';
import type { MaxValues } from '../types/metrics';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: ({ url }: { url: string }) => <div data-testid="tile-layer" data-url={url} />,
  Polyline: () => <div data-testid="polyline" />,
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const maxValues: MaxValues = {
  distance: 40000,
  time: 3600,
  power: 220,
  hr: 145,
  minDistance: 0,
  minTime: 0,
  minPower: 0,
  minHr: 0,
};

const baseActivity: ActivitySummary = {
  id: '123',
  externalId: '456',
  sportType: 'cycling',
  name: 'Morning Ride',
  startedAt: '2024-06-01T08:00:00Z',
  movingTimeSec: 3600,
  distanceM: 40000,
  elevationGainM: 500,
  avgHeartrate: 145,
  avgPowerW: 220,
  avgSpeedMs: 8.5,
  calories: 800,
  summaryPolyline: null,
  photoUrls: null,
};

describe('ActivityFeedCard', () => {
  it('renders a photo preview when the activity has photos but no map', () => {
    renderWithTheme(
      <ActivityFeedCard
        activity={{ ...baseActivity, photoUrls: ['https://example.com/photo-1.jpg'] }}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: 'Morning Ride' })).toBeDefined();
    expect(screen.getByText('Zdjęcia 1')).toBeDefined();
    expect(screen.queryByTestId('map-container')).toBeNull();
  });

  it('renders map preview, media badges and the selected metric bubble when map and photos exist', () => {
    renderWithTheme(
      <ActivityFeedCard
        activity={{
          ...baseActivity,
          summaryPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
          photoUrls: ['https://example.com/photo-1.jpg', 'https://example.com/photo-2.jpg'],
        }}
        onClick={vi.fn()}
        metricKey="distance"
        maxValues={maxValues}
      />,
    );

    const preview = screen.getByTestId('activity-preview');
    const chip = screen.getByTestId('activity-sport-chip');
    const bubble = screen.getByTestId('metric-bubble');
    const tileLayer = screen.getByTestId('tile-layer');

    expect(screen.getByTestId('map-container')).toBeDefined();
    expect(screen.getByText('Mapa')).toBeDefined();
    expect(screen.getByText('Zdjęcia 2')).toBeDefined();
    expect(screen.getByText('cycling')).toBeDefined();
    expect(screen.getByText('40km')).toBeDefined();
    expect(tileLayer.getAttribute('data-url')).toContain('openstreetmap.org');
    expect(Number.parseFloat(window.getComputedStyle(preview).width)).toBeGreaterThanOrEqual(270);
    expect(Number.parseFloat(window.getComputedStyle(preview).height)).toBeGreaterThanOrEqual(150);
    expect(Number.parseFloat(window.getComputedStyle(bubble).width)).toBeGreaterThanOrEqual(69);
    expect(Number.parseInt(window.getComputedStyle(chip).zIndex, 10)).toBeGreaterThanOrEqual(10);
  });
});
