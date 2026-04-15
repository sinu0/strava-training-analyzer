import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import GarminHealthCard from '../components/garmin/GarminHealthCard';

import type { GarminHealthData } from '../types/garmin';

function createFullData(overrides?: Partial<GarminHealthData>): GarminHealthData {
  return {
    date: '2024-03-15',
    restingHrBpm: 52,
    hrvRmssd: 45.5,
    sleepScore: 82,
    sleepDurationSeconds: 28800,
    deepSleepSeconds: 7200,
    lightSleepSeconds: 14400,
    remSleepSeconds: 5400,
    awakeSleepSeconds: 1800,
    bodyBattery: 75,
    stressAvg: 35,
    steps: 10500,
    activeCalories: 450,
    garminSyncedAt: '2024-03-15T06:00:00Z',
    ...overrides,
  };
}

describe('GarminHealthCard', () => {
  it('renders nothing when data is null', () => {
    const { container } = render(<GarminHealthCard data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when data is undefined', () => {
    const { container } = render(<GarminHealthCard data={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all health metrics with full data', () => {
    render(<GarminHealthCard data={createFullData()} />);
    expect(screen.getByText('52')).toBeDefined();
    expect(screen.getByText('46')).toBeDefined(); // HRV rounded from 45.5
    expect(screen.getByText('75')).toBeDefined(); // Body Battery
    expect(screen.getByText('82')).toBeDefined(); // Sleep score
    expect(screen.getByText('8h 0m')).toBeDefined(); // Sleep duration
    expect(screen.getByText('35')).toBeDefined(); // Stress
    expect(screen.getByText('Tętno spoczynkowe')).toBeDefined();
    expect(screen.getByText('HRV (RMSSD)')).toBeDefined();
    expect(screen.getByText('Body Battery')).toBeDefined();
  });

  it('displays date in header', () => {
    render(<GarminHealthCard data={createFullData()} />);
    expect(screen.getByText(/2024-03-15/)).toBeDefined();
  });

  it('renders sleep stages bar when stage data available', () => {
    render(<GarminHealthCard data={createFullData()} />);
    expect(screen.getByText('FAZY SNU')).toBeDefined();
    expect(screen.getByText(/Głęboki/)).toBeDefined();
    expect(screen.getByText(/Lekki/)).toBeDefined();
    expect(screen.getByText(/REM/)).toBeDefined();
    expect(screen.getByText(/Przebudzenia/)).toBeDefined();
  });

  it('hides sleep stages when all stages are null', () => {
    const data = createFullData({
      deepSleepSeconds: null,
      lightSleepSeconds: null,
      remSleepSeconds: null,
      awakeSleepSeconds: null,
    });
    render(<GarminHealthCard data={data} />);
    expect(screen.queryByText('FAZY SNU')).toBeNull();
  });

  it('shows dash for missing metric values', () => {
    const data = createFullData({ hrvRmssd: null, bodyBattery: null });
    render(<GarminHealthCard data={data} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('formats steps with locale', () => {
    render(<GarminHealthCard data={createFullData({ steps: 10500 })} />);
    // Polish locale uses non-breaking space as thousands separator
    expect(screen.getByText(/10.*500/)).toBeDefined();
  });
});
