import TableRowsIcon from '@mui/icons-material/TableRows';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ActivityFeedView, { type ActivityFeedViewMode } from '@/components/activities/ActivityFeedView';
import ActivityListView from '@/components/activities/ActivityListView';
import PageContainer from '@/components/common/PageContainer';
import PullToRefreshPanel from '@/components/common/PullToRefreshPanel';
import TabsNav from '@/components/common/TabsNav';
import { useActivities, useInfiniteActivities } from '@/hooks/useActivities';
import { useActivityFilters } from '@/hooks/useActivityFilters';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { MetricKey, MaxValues } from '@/types/metrics';

const FEED_VIEW_MODE_STORAGE_KEY = 'feed-view-mode';
const FEED_METRIC_KEY_STORAGE_KEY = 'feed-metric-key';

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const handleActivityClick = useCallback(
    (id: string) => {
      navigate(`/activities/${id}`);
    },
    [navigate],
  );
  const [tab, setTab] = useState(0);
  const [feedSelected, setFeedSelected] = useState<{ year: number; month?: number } | undefined>();
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useLocalStorage<ActivityFeedViewMode>(
    FEED_VIEW_MODE_STORAGE_KEY,
    'feed',
  );
  const [metricKey, setMetricKey] = useLocalStorage<MetricKey>(
    FEED_METRIC_KEY_STORAGE_KEY,
    'distance',
  );
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollRafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleScroll = () => {
      if (isProgrammaticScrollRef.current || scrollRafRef.current) {
        return;
      }

      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = undefined;
        const cards = feedContainerRef.current?.querySelectorAll('[data-activity-year]');
        if (!cards) {
          return;
        }

        for (const card of Array.from(cards)) {
          const rect = card.getBoundingClientRect();
          if (rect.bottom <= 80) {
            continue;
          }

          const year = Number(card.getAttribute('data-activity-year'));
          const month = Number(card.getAttribute('data-activity-month'));
          if (!year) {
            return;
          }

          setFeedSelected((previous) =>
            previous?.year === year && previous?.month === month
              ? previous
              : { year, month: month || undefined },
          );
          return;
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const {
    data: infiniteData,
    isLoading: feedLoading,
    error: feedError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchFeed,
  } = useInfiniteActivities(undefined);

  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const fetchNextPageRef = useRef(fetchNextPage);

  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
  }, [hasNextPage]);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);

  const findFeedCard = useCallback((selection: { year: number; month?: number }) => {
    const selector = selection.month
      ? `[data-activity-year="${selection.year}"][data-activity-month="${selection.month}"]`
      : `[data-activity-year="${selection.year}"]`;
    return feedContainerRef.current?.querySelector(selector) as HTMLElement | null;
  }, []);

  const scrollToFeedCard = useCallback((card: HTMLElement) => {
    isProgrammaticScrollRef.current = true;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 1200);
  }, []);

  const handleSidebarNavigate = useCallback(
    async (selection: { year: number; month?: number }) => {
      setFeedSelected(selection);

      const tryScroll = () => {
        const card = findFeedCard(selection);
        if (!card) {
          return false;
        }

        scrollToFeedCard(card);
        return true;
      };

      if (tryScroll()) {
        return;
      }

      let attempts = 0;
      while (attempts < 40 && hasNextPageRef.current) {
        attempts += 1;
        if (!isFetchingNextPageRef.current) {
          await fetchNextPageRef.current();
        }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
        if (tryScroll()) {
          return;
        }
      }
    },
    [findFeedCard, scrollToFeedCard],
  );

  const feedActivities = useMemo(
    () => infiniteData?.pages.flatMap((page) => page.items) ?? [],
    [infiniteData],
  );

  const maxValues = useMemo<MaxValues>(
    () => ({
      distance: Math.max(1, ...feedActivities.map((activity) => activity.distanceM || 0)),
      time: Math.max(1, ...feedActivities.map((activity) => activity.movingTimeSec || 0)),
      power: Math.max(1, ...feedActivities.map((activity) => activity.avgPowerW || 0)),
      hr: Math.max(1, ...feedActivities.map((activity) => activity.avgHeartrate || 0)),
      minDistance:
        Math.min(...feedActivities.filter((activity) => activity.distanceM).map((activity) => activity.distanceM || 0)) || 0,
      minTime:
        Math.min(...feedActivities.filter((activity) => activity.movingTimeSec).map((activity) => activity.movingTimeSec || 0)) || 0,
      minPower:
        Math.min(...feedActivities.filter((activity) => activity.avgPowerW).map((activity) => activity.avgPowerW || 0)) || 0,
      minHr:
        Math.min(...feedActivities.filter((activity) => activity.avgHeartrate).map((activity) => activity.avgHeartrate || 0)) || 0,
    }),
    [feedActivities],
  );

  const sidebarYM = viewMode === 'calendar' ? { year: calYear, month: calMonth } : feedSelected;

  const unifiedSidebarNavigate = useCallback(
    (selection: { year: number; month?: number }) => {
      if (viewMode === 'calendar') {
        setCalYear(selection.year);
        setCalMonth(selection.month ?? 1);
        return;
      }

      void handleSidebarNavigate(selection);
    },
    [handleSidebarNavigate, viewMode],
  );

  useEffect(() => {
    if (!sentinelEl) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '400px', threshold: 0 },
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, sentinelEl]);

  const activityFilters = useActivityFilters();
  const deferredListFilters = useDeferredValue(activityFilters.listFilters);
  const isListFilterPending =
    activityFilters.isPending || deferredListFilters !== activityFilters.listFilters;
  const {
    data: listData,
    isLoading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useActivities(deferredListFilters);

  return (
    <PageContainer
      title="Aktywności"
      subtitle="Feed, lista i heatmapa korzystają z tego samego układu, więc łatwiej przełączać się między szybką oceną a szczegółami."
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Aktywności' },
      ]}
    >
      <PullToRefreshPanel
        onRefresh={async () => {
          await queryClient.refetchQueries();
        }}
      >
        <TabsNav
          tabs={[
            { label: 'Feed', value: 0, icon: <ViewStreamIcon fontSize="small" /> },
            { label: 'Lista', value: 1, icon: <TableRowsIcon fontSize="small" /> },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 0 && (
          <ActivityFeedView
            activities={feedActivities}
            feedContainerRef={feedContainerRef}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={feedLoading}
            maxValues={maxValues}
            metricKey={metricKey}
            onActivityClick={handleActivityClick}
            onCalendarMonthChange={(year, month) => {
              setCalYear(year);
              setCalMonth(month);
            }}
            onMetricKeyChange={setMetricKey}
            onRetry={() => {
              void refetchFeed();
            }}
            onSidebarNavigate={unifiedSidebarNavigate}
            onViewModeChange={setViewMode}
            selectedCalendarMonth={{ year: calYear, month: calMonth }}
            setSentinelEl={setSentinelEl}
            sidebarSelection={sidebarYM}
            viewMode={viewMode}
            error={feedError}
          />
        )}

        {tab === 1 && (
          <ActivityListView
            data={listData}
            error={listError}
            filters={activityFilters}
            isFilterPending={isListFilterPending}
            isLoading={listLoading}
            onActivityClick={handleActivityClick}
            onRetry={() => {
              void refetchList();
            }}
          />
        )}
      </PullToRefreshPanel>
    </PageContainer>
  );
}
