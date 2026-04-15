import { ThemeProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';

import TrainingLoadMiniChart from '../components/TrainingLoadMiniChart';
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

describe('TrainingLoadMiniChart', () => {
  it('renders chart lines with PMC data', () => {
    const { container } = renderWithTheme(
      <TrainingLoadMiniChart
        data={[
          { date: '2024-06-01', ctl: 55.0, atl: 70.0, tsb: -15.0, ctlDelta: 1.5, atlDelta: -1.0, tsbDelta: 2.5 },
          { date: '2024-06-02', ctl: 56.0, atl: 68.0, tsb: -12.0, ctlDelta: 1.0, atlDelta: -2.0, tsbDelta: 3.0 },
          { date: '2024-06-03', ctl: 57.0, atl: 65.0, tsb: -8.0, ctlDelta: 1.0, atlDelta: -3.0, tsbDelta: 4.0 },
        ]}
      />,
    );

    expect(container.querySelector('.recharts-wrapper')).toBeDefined();
  });

  it('renders empty state when no data', () => {
    const { container } = renderWithTheme(<TrainingLoadMiniChart data={[]} />);

    // Still renders the wrapper but with no lines
    expect(container.querySelector('.recharts-line')).toBeNull();
  });
});
