import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ActivityHeroSection from '@/components/activity/ActivityHeroSection';
import theme from '@/theme/theme';
import type { ActivityDetail } from '@/types/activity';

vi.mock('@/components/ActivityMediaCarousel', () => ({
  default: () => <div data-testid="activity-media-carousel">Media</div>,
}));

const activity: ActivityDetail = {
  id: 'activity-1',
  externalId: 'ext-1',
  source: 'strava',
  sportType: 'Ride',
  name: 'Morning Ride',
  description: 'Mocny trening z długim tempem.',
  startedAt: '2024-06-01T08:00:00Z',
  elapsedTimeSec: 3900,
  movingTimeSec: 3600,
  distanceM: 40000,
  elevationGainM: 500,
  elevationLossM: 500,
  avgSpeedMs: 8.5,
  maxSpeedMs: 14,
  avgHeartrate: 145,
  maxHeartrate: 178,
  avgPowerW: 220,
  maxPowerW: 410,
  avgCadence: 88,
  maxCadence: 106,
  calories: 800,
  avgTempC: 19,
  summaryPolyline: null,
  photoUrls: ['https://example.com/photo.jpg'],
  powerStream: null,
  heartrateStream: null,
  cadenceStream: null,
  altitudeStream: null,
  timeStream: null,
  latStream: null,
  lngStream: null,
  distanceStream: null,
  velocityStream: null,
  laps: null,
  metrics: {},
  createdAt: '2024-06-01T08:00:00Z',
  updatedAt: '2024-06-01T08:00:00Z',
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('ActivityHeroSection', () => {
  it('reveals advanced stats on demand instead of showing everything at once', () => {
    renderWithTheme(<ActivityHeroSection activity={activity} geoJson={null} />);

    expect(screen.getByText('Morning Ride')).toBeDefined();
    expect(screen.getByText('Pokaż wszystkie statystyki')).toBeDefined();
    expect(screen.queryByText('Kadencja')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Pokaż wszystkie statystyki' }));

    expect(screen.getByRole('button', { name: 'Ukryj szczegóły' })).toBeDefined();
    expect(screen.getByText('Kadencja')).toBeDefined();
  });
});
