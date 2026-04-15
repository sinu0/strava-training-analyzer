import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';

import OptimalLoadChart from '../components/OptimalLoadChart';
import theme from '../theme/theme';

import type { WeeklyOptimalLoad } from '../types/analytics';

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

const mockOptimalData: WeeklyOptimalLoad[] = [
  {
    weekStart: '2024-03-18',
    activityCount: 4,
    actualTss: 350,
    ctl: 50,
    optimalMin: 280,
    optimalTarget: 350,
    optimalMax: 455,
    dangerThreshold: 525,
    status: 'OPTIMAL',
  },
  {
    weekStart: '2024-03-25',
    activityCount: 6,
    actualTss: 580,
    ctl: 52,
    optimalMin: 291,
    optimalTarget: 364,
    optimalMax: 473,
    dangerThreshold: 546,
    status: 'DANGER',
  },
  {
    weekStart: '2024-04-01',
    activityCount: 2,
    actualTss: 120,
    ctl: 48,
    optimalMin: 269,
    optimalTarget: 336,
    optimalMax: 437,
    dangerThreshold: 504,
    status: 'INSUFFICIENT',
  },
];

describe('OptimalLoadChart', () => {
  it('renders chart with data', () => {
    const { container } = renderWithTheme(<OptimalLoadChart data={mockOptimalData} />);
    expect(container.querySelector('.recharts-wrapper')).toBeDefined();
  });

  it('shows empty state when no data', () => {
    renderWithTheme(<OptimalLoadChart data={[]} />);
    expect(screen.getByText(/brak/i)).toBeDefined();
  });

  it('renders legend labels in Polish', () => {
    renderWithTheme(<OptimalLoadChart data={mockOptimalData} />);
    expect(screen.getByText('Optymalny')).toBeDefined();
    expect(screen.getByText('Tydzień w toku')).toBeDefined();
  });
});
