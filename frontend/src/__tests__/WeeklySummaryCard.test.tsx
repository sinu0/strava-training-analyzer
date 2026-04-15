import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import WeeklySummaryCard from '../components/WeeklySummaryCard';
import theme from '../theme/theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>,
  );
}

describe('WeeklySummaryCard', () => {
  it('renders formatted values for a weekly summary', () => {
    renderWithTheme(
      <WeeklySummaryCard
        summary={{
          weekStart: '2024-06-03',
          activityCount: 5,
          totalDistanceM: 150000,
          totalTimeSec: 18000,
          totalElevationM: 1200,
          totalTss: 350,
        }}
      />,
    );

    expect(screen.getByText('Dystans')).toBeDefined();
    expect(screen.getByText('Czas')).toBeDefined();
    expect(screen.getByText('TSS')).toBeDefined();
    expect(screen.getByText('Wzniesienie')).toBeDefined();
    expect(screen.getByText('350')).toBeDefined();
    expect(screen.getByText('1200 m')).toBeDefined();
  });

  it('renders dashes when no summary provided', () => {
    renderWithTheme(<WeeklySummaryCard summary={undefined} />);

    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBe(4);
  });
});
