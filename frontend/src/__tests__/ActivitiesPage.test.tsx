import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import ActivitiesPage from '@/pages/ActivitiesPage';
import theme from '@/theme/theme';
import type { ActivitySummaryPage, ActivityTimelineEntry } from '@/types/activity';

beforeAll(() => {
  (globalThis as Record<string, unknown>).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = vi.fn();
});

const initialPage: ActivitySummaryPage = {
  items: [
    {
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
    },
    {
      id: '789',
      externalId: '012',
      sportType: 'running',
      name: 'Evening Run',
      startedAt: '2024-06-02T18:00:00Z',
      movingTimeSec: 1800,
      distanceM: 5000,
      elevationGainM: 50,
      avgHeartrate: 160,
      avgPowerW: null,
      avgSpeedMs: 2.8,
      calories: 400,
    },
  ],
  total: 3,
  page: 0,
  size: 20,
  totalPages: 2,
};

const olderPage: ActivitySummaryPage = {
  items: [
    {
      id: 'older-activity',
      externalId: 'older-external',
      sportType: 'cycling',
      name: 'March 2023 Ride',
      startedAt: '2023-03-12T09:00:00Z',
      movingTimeSec: 5400,
      distanceM: 70000,
      elevationGainM: 800,
      avgHeartrate: 152,
      avgPowerW: 235,
      avgSpeedMs: 7.9,
      calories: 1200,
    },
  ],
  total: 3,
  page: 1,
  size: 20,
  totalPages: 2,
};

const emptyPage: ActivitySummaryPage = {
  items: [],
  total: 0,
  page: 0,
  size: 20,
  totalPages: 1,
};

const timeline: ActivityTimelineEntry[] = [
  { year: 2024, month: 6, count: 2 },
  { year: 2024, month: 5, count: 3 },
  { year: 2023, month: 3, count: 1 },
];

const mockState = {
  feedPages: [initialPage, olderPage] as ActivitySummaryPage[],
  feedLoading: false,
  feedError: null as unknown,
  listData: {
    items: [...initialPage.items],
    total: 2,
    page: 0,
    size: 20,
    totalPages: 1,
  } as ActivitySummaryPage,
  listLoading: false,
  listError: null as unknown,
  timeline,
  refetchFeed: vi.fn(),
  refetchList: vi.fn(),
};

function resetMockState() {
  mockState.feedPages = [initialPage, olderPage];
  mockState.feedLoading = false;
  mockState.feedError = null;
  mockState.listData = {
    items: [...initialPage.items],
    total: 2,
    page: 0,
    size: 20,
    totalPages: 1,
  };
  mockState.listLoading = false;
  mockState.listError = null;
  mockState.timeline = timeline;
  mockState.refetchFeed = vi.fn();
  mockState.refetchList = vi.fn();
}

vi.mock('react-querybuilder', () => ({
  default: () => <div data-testid="query-builder" />,
}));

vi.mock('@react-querybuilder/material', () => ({
  QueryBuilderMaterial: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/RouteHeatmap', () => ({
  default: () => <div data-testid="route-heatmap">Route heatmap</div>,
}));

vi.mock('@/components/YearMonthSidebar', () => ({
  default: ({ onNavigate }: { onNavigate: (value: { year: number; month?: number }) => void }) => (
    <div data-testid="year-month-sidebar">
      <button type="button" onClick={() => onNavigate({ year: 2023, month: 3 })}>
        Mar 2023
      </button>
    </div>
  ),
}));

vi.mock('@/components/ActivityCalendar', () => ({
  default: () => <div data-testid="activity-calendar">Activity calendar</div>,
}));

vi.mock('@/hooks/useActivities', async () => {
  const React = await import('react');

  return {
    useActivitiesTimeline: () => ({
      data: mockState.timeline,
      isLoading: false,
    }),
    useInfiniteActivities: () => {
      const [pageCount, setPageCount] = React.useState(1);
      const pages = mockState.feedPages.slice(0, pageCount);

      return {
        data: {
          pages,
          pageParams: pages.map((_, index) => index),
        },
        isLoading: mockState.feedLoading,
        error: mockState.feedError,
        isFetchingNextPage: false,
        refetch: mockState.refetchFeed,
        fetchNextPage: async () => {
          setPageCount((current) => Math.min(current + 1, mockState.feedPages.length));
        },
        hasNextPage: pageCount < mockState.feedPages.length,
      };
    },
    useActivities: () => ({
      data: mockState.listData,
      isLoading: mockState.listLoading,
      error: mockState.listError,
      refetch: mockState.refetchList,
    }),
    useRouteHeatmap: () => ({
      data: { routes: [], routeCount: 0, bounds: null },
      isLoading: false,
      isError: false,
    }),
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('ActivitiesPage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockState();
  });

  it('renders activity rows from mock data', () => {
    renderWithProviders(<ActivitiesPage />);

    expect(screen.getByText('Morning Ride')).toBeDefined();
    expect(screen.getByText('Evening Run')).toBeDefined();
  });

  it('displays sport type chips', () => {
    renderWithProviders(<ActivitiesPage />);

    expect(screen.getByText('cycling')).toBeDefined();
    expect(screen.getByText('running')).toBeDefined();
  });

  it('shows distance and time columns', () => {
    renderWithProviders(<ActivitiesPage />);

    expect(screen.getByText('40.0 km')).toBeDefined();
    expect(screen.getByText('1h 0m')).toBeDefined();
  });

  it('renders heatmap view when selected', () => {
    renderWithProviders(<ActivitiesPage />);

    fireEvent.click(screen.getByRole('button', { name: /heatmapa/i }));

    expect(screen.getByTestId('route-heatmap')).toBeDefined();
  });

  it('persists the preferred feed view with shared localStorage serialization', async () => {
    renderWithProviders(<ActivitiesPage />);

    fireEvent.click(screen.getByRole('button', { name: /heatmapa/i }));

    await waitFor(() => {
      expect(localStorage.getItem('feed-view-mode')).toBe('"heatmap"');
    });
  });

  it('restores heatmap as preferred feed view from localStorage', () => {
    localStorage.setItem('feed-view-mode', 'heatmap');

    renderWithProviders(<ActivitiesPage />);

    expect(screen.getByTestId('route-heatmap')).toBeDefined();
  });

  it('shows a shared empty state when the feed has no activities', () => {
    mockState.feedPages = [emptyPage];

    renderWithProviders(<ActivitiesPage />);

    expect(screen.getByText('Brak aktywności')).toBeDefined();
    expect(screen.getByText('Zaimportuj aktywności ze Stravy, aby zobaczyć feed.')).toBeDefined();
  });

  it('loads older feed pages before scrolling to the selected sidebar month', async () => {
    renderWithProviders(<ActivitiesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Mar 2023' }));

    await waitFor(() => {
      expect(screen.getByText('March 2023 Ride')).toBeDefined();
    });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('shows a shared error state in the list view when loading fails', async () => {
    mockState.listError = new Error('Boom');

    renderWithProviders(<ActivitiesPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
    expect(screen.getByText('Wystąpił błąd')).toBeDefined();
    expect(screen.getByText('Nie udało się załadować listy aktywności.')).toBeDefined();
  });
});
