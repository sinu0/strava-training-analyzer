import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';

import PMChart from '../components/PMChart';
import PowerCurveChart from '../components/PowerCurveChart';
import WeeklyVolumeChart from '../components/WeeklyVolumeChart';
import ZoneDistributionChart from '../components/ZoneDistributionChart';
import theme from '../theme/theme';

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('PMChart', () => {
  it('renders with PMC data', () => {
    const { container } = renderWithTheme(
      <PMChart
        data={[
          { date: '2024-06-01', ctl: 55, atl: 70, tsb: -15, ctlDelta: 1.2, atlDelta: -0.8, tsbDelta: 2.0 },
          { date: '2024-06-02', ctl: 56, atl: 68, tsb: -12, ctlDelta: 1.0, atlDelta: -2.0, tsbDelta: 3.0 },
        ]}
      />,
    );
    expect(container.querySelector('.recharts-wrapper')).toBeDefined();
    expect(screen.getByRole('img', { name: /Wykres obciążenia PMC.*CTL 56.*ATL 68.*forma -12/i })).toBeDefined();
  });

  it('shows empty state when no data', () => {
    renderWithTheme(<PMChart data={[]} />);
    expect(screen.getByText('Brak danych PMC dla wybranego zakresu.')).toBeDefined();
  });
});

describe('PowerCurveChart', () => {
  it('renders with power curve data', () => {
    const { container } = renderWithTheme(
      <PowerCurveChart data={{ efforts: { 1: 800, 60: 350, 300: 280 } }} />,
    );
    expect(container.querySelector('.recharts-wrapper')).toBeDefined();
    expect(screen.getByRole('img', { name: /Krzywa mocy.*3 punkty.*800 W/i })).toBeDefined();
  });

  it('shows empty state when no data', () => {
    renderWithTheme(<PowerCurveChart data={undefined} />);
    expect(screen.getByText('Brak danych krzywej mocy.')).toBeDefined();
  });
});

describe('ZoneDistributionChart', () => {
  it('renders colored bars', () => {
    const { container } = renderWithTheme(
      <ZoneDistributionChart
        data={{ zoneType: 'power', zones: { Z1: 600, Z2: 1200, Z3: 900 }, totalSeconds: 2700 }}
      />,
    );
    expect(container.querySelector('.recharts-wrapper')).toBeDefined();
  });

  it('shows empty state when no data', () => {
    renderWithTheme(<ZoneDistributionChart data={undefined} />);
    expect(screen.getByText('Brak danych stref.')).toBeDefined();
  });
});

describe('WeeklyVolumeChart', () => {
  it('renders TSS bars', () => {
    const { container } = renderWithTheme(
      <WeeklyVolumeChart
        data={[
          { weekStart: '2024-06-03', activityCount: 5, totalDistanceM: 150000, totalTimeSec: 18000, totalElevationM: 1200, totalTss: 350 },
        ]}
      />,
    );
    expect(container.querySelector('.recharts-wrapper')).toBeDefined();
  });

  it('shows empty state when no data', () => {
    renderWithTheme(<WeeklyVolumeChart data={[]} />);
    expect(screen.getByText('Brak danych tygodniowych.')).toBeDefined();
  });
});
