import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActivityCalendar from '@/components/ActivityCalendar';
import theme from '@/theme/theme';
import type { ActivitySummaryPage } from '@/types/activity';
import type { WeeklySummary } from '@/types/analytics';

const mockUseActivities = vi.fn();
const mockUseWeeklySummaries = vi.fn();

vi.mock('@/hooks/useActivities', () => ({
  useActivities: (...args: unknown[]) => mockUseActivities(...args),
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useWeeklySummaries: (...args: unknown[]) => mockUseWeeklySummaries(...args),
}));

vi.mock('@/components/ActivityTimelineChart', () => ({
  default: () => <div data-testid="activity-timeline-chart" />,
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('ActivityCalendar', () => {
  beforeEach(() => {
    const data: ActivitySummaryPage = {
      items: [
        {
          id: 'a1',
          externalId: 'ext-1',
          sportType: 'cycling',
          name: 'Długa jazda',
          startedAt: '2024-06-01T08:00:00Z',
          movingTimeSec: 7200,
          distanceM: 40000,
          elevationGainM: 600,
          avgHeartrate: 145,
          avgPowerW: 230,
          avgSpeedMs: 8.2,
          calories: 900,
        },
        {
          id: 'a2',
          externalId: 'ext-2',
          sportType: 'running',
          name: 'Rozbieganie',
          startedAt: '2024-06-02T08:00:00Z',
          movingTimeSec: 2700,
          distanceM: 10000,
          elevationGainM: 80,
          avgHeartrate: 150,
          avgPowerW: null,
          avgSpeedMs: 3.7,
          calories: 520,
        },
      ],
      total: 2,
      page: 0,
      size: 20,
      totalPages: 1,
    };
    const summaries: WeeklySummary[] = [
      {
        weekStart: '2024-05-27',
        activityCount: 2,
        totalDistanceM: 50000,
        totalTimeSec: 9900,
        totalElevationM: 680,
        totalTss: 120,
      },
    ];

    mockUseActivities.mockReturnValue({ data, isLoading: false });
    mockUseWeeklySummaries.mockReturnValue({ data: summaries });
  });

  it('renders a loading state while month activities are loading', () => {
    mockUseActivities.mockReturnValue({ data: undefined, isLoading: true });

    renderWithTheme(
      <ActivityCalendar
        year={2024}
        month={6}
        metricKey="distance"
        onMonthChange={() => {}}
        onActivityClick={() => {}}
      />,
    );

    expect(screen.getByText('Ładowanie kalendarza aktywności…')).toBeDefined();
  });

  it('shows weekly summary data and opens an activity when a bubble is clicked', () => {
    const onActivityClick = vi.fn();

    renderWithTheme(
      <ActivityCalendar
        year={2024}
        month={6}
        metricKey="distance"
        onMonthChange={() => {}}
        onActivityClick={onActivityClick}
      />,
    );

    fireEvent.click(screen.getByText('40km'));

    expect(onActivityClick).toHaveBeenCalledWith('a1');
    expect(screen.getByText('2:45')).toBeDefined();
    expect(screen.getByText('120 TSS')).toBeDefined();
  });
});
