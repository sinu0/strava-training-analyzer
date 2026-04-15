import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import OverviewTab from '../components/activity/OverviewTab';
import theme from '../theme/theme';

import type { ActivityDetail } from '../types/activity';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const baseActivity: ActivityDetail = {
  id: '1',
  externalId: '100',
  source: 'strava',
  sportType: 'cycling',
  name: 'Test Ride',
  description: null,
  startedAt: '2024-06-01T08:00:00Z',
  elapsedTimeSec: 3600,
  movingTimeSec: 3600,
  distanceM: 40000,
  elevationGainM: 500,
  elevationLossM: 400,
  avgSpeedMs: 11.1,
  maxSpeedMs: 15.0,
  avgHeartrate: 145,
  maxHeartrate: 175,
  avgPowerW: 200,
  maxPowerW: 450,
  avgCadence: 90,
  maxCadence: 110,
  calories: 900,
  avgTempC: 20,
  summaryPolyline: null,
  photoUrls: null,
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

describe('OverviewTab', () => {
  it('shows empty state when no metrics', () => {
    renderWithTheme(<OverviewTab activity={baseActivity} />);
    expect(screen.getByText('Brak danych do wyświetlenia w zakładce Przegląd.')).toBeDefined();
  });

  it('renders numeric metrics as MetricCards', () => {
    const activity = {
      ...baseActivity,
      metrics: { hrTss: 75.5, tss: 80 } as Record<string, unknown>,
    };
    renderWithTheme(<OverviewTab activity={activity} />);
    expect(screen.getByText('75.5')).toBeDefined();
  });

  it('does NOT render peak_efforts as [object Object]', () => {
    const peakEfforts = {
      power: { '1s': 450, '5s': 420, '30s': 380, '1min': 350 },
      heartrate: { '1s': 178, '5s': 175, '30s': 170 },
    };
    const activity = {
      ...baseActivity,
      metrics: { peak_efforts: peakEfforts } as Record<string, unknown>,
    };
    renderWithTheme(<OverviewTab activity={activity} />);
    expect(screen.queryByText('[object Object]')).toBeNull();
  });

  it('renders peak_efforts power values in a table', () => {
    const peakEfforts = {
      power: { '1s': 450, '5s': 420, '30s': 380, '1min': 350 },
    };
    const activity = {
      ...baseActivity,
      metrics: { peak_efforts: peakEfforts } as Record<string, unknown>,
    };
    renderWithTheme(<OverviewTab activity={activity} />);
    expect(screen.getByText('450')).toBeDefined();
    expect(screen.getByText('420')).toBeDefined();
  });

  it('renders peak_efforts heartrate values', () => {
    const peakEfforts = {
      heartrate: { '1s': 178, '5s': 175 },
    };
    const activity = {
      ...baseActivity,
      metrics: { peak_efforts: peakEfforts } as Record<string, unknown>,
    };
    renderWithTheme(<OverviewTab activity={activity} />);
    expect(screen.getByText('178')).toBeDefined();
  });

  it('does NOT render w_prime_balance or grade_adjusted_pace as [object Object]', () => {
    const activity = {
      ...baseActivity,
      metrics: {
        w_prime_balance: { wPrime: 15000, minWBal: 8000, avgWBal: 12000, depletionEvents: 2 },
        grade_adjusted_pace: { gap_avg_speed_ms: 3.5, gap_pace_min_per_km: 4.76 },
      } as Record<string, unknown>,
    };
    renderWithTheme(<OverviewTab activity={activity} />);
    expect(screen.queryByText('[object Object]')).toBeNull();
  });
});
