import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import DailyOptimalLoadChart, {
  mapDailyOptimalLoadChartData,
} from '../components/DailyOptimalLoadChart';
import theme from '../theme/theme';

import type { DailyOptimalLoad } from '../types/analytics';

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const sampleData: DailyOptimalLoad[] = [
  {
    date: '2026-04-01',
    actualTss: null,
    projectedTss: 0,
    ctl: 58.6,
    atl: 61.7,
    tsb: -12,
    optimalMin: 0,
    optimalTarget: 0,
    optimalMax: 0,
    dangerThreshold: 0,
    status: 'FUTURE',
    future: true,
  },
  {
    date: '2026-04-02',
    actualTss: null,
    projectedTss: 136.7,
    ctl: 60.5,
    atl: 72.4,
    tsb: -3.1,
    optimalMin: 112.9,
    optimalTarget: 141.2,
    optimalMax: 183.7,
    dangerThreshold: 212.2,
    status: 'FUTURE',
    future: true,
  },
];

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('DailyOptimalLoadChart', () => {
  it('maps projected bars from projectedTss instead of optimalTarget', () => {
    const chartData = mapDailyOptimalLoadChartData(sampleData);
    const [restDay, trainingDay] = chartData;

    expect(restDay).toBeDefined();
    expect(trainingDay).toBeDefined();

    expect(restDay?.projectedTss).toBe(0);
    expect(restDay?.optimalMin).toBeUndefined();
    expect(trainingDay?.projectedTss).toBe(137);
    expect(trainingDay?.projectedTss).not.toBe(Math.round(sampleData[1]!.optimalTarget));
  });

  it('explains that projections follow the recent training rhythm', () => {
    renderWithTheme(<DailyOptimalLoadChart data={sampleData} />);

    expect(screen.getByText(/rytmu treningów/i)).toBeDefined();
    expect(screen.getByText(/rytmu trening\/odpoczynek/i)).toBeDefined();
  });
});
