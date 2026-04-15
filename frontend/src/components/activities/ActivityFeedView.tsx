import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Box, Button, CircularProgress, Drawer, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';

import ActivityCalendar from '@/components/ActivityCalendar';
import ActivityFeedCard from '@/components/ActivityFeedCard';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import RouteHeatmap from '@/components/RouteHeatmap';
import YearMonthSidebar from '@/components/YearMonthSidebar';
import type { ActivitySummary } from '@/types/activity';
import type { MaxValues, MetricKey } from '@/types/metrics';
import { getApiErrorMessage } from '@/utils/errorHandling';

import type { RefObject } from 'react';

export type ActivityFeedViewMode = 'feed' | 'calendar' | 'heatmap';

interface ActivityFeedViewProps {
  activities: ActivitySummary[];
  error: unknown;
  feedContainerRef: RefObject<HTMLDivElement | null>;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  maxValues: MaxValues;
  metricKey: MetricKey;
  onActivityClick: (id: string) => void;
  onCalendarMonthChange: (year: number, month: number) => void;
  onMetricKeyChange: (value: MetricKey) => void;
  onRetry: () => void;
  onSidebarNavigate: (selection: { year: number; month?: number }) => void;
  onViewModeChange: (value: ActivityFeedViewMode) => void;
  selectedCalendarMonth: { year: number; month: number };
  setSentinelEl: (node: HTMLDivElement | null) => void;
  sidebarSelection?: { year: number; month?: number };
  viewMode: ActivityFeedViewMode;
}

function ActivityFeedToolbar({
  metricKey,
  onMetricKeyChange,
  onViewModeChange,
  viewMode,
}: Pick<ActivityFeedViewProps, 'metricKey' | 'onMetricKeyChange' | 'onViewModeChange' | 'viewMode'>) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        size="small"
        onChange={(_, value: ActivityFeedViewMode | null) => {
          if (value) {
            onViewModeChange(value);
          }
        }}
        sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: '0.78rem' } }}
      >
        <ToggleButton value="feed">
          <ViewListIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          Feed
        </ToggleButton>
        <ToggleButton value="calendar">
          <CalendarMonthIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          Kalendarz
        </ToggleButton>
        <ToggleButton value="heatmap">
          <MapOutlinedIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          Heatmapa
        </ToggleButton>
      </ToggleButtonGroup>

      {viewMode !== 'heatmap' && (
        <ToggleButtonGroup
          value={metricKey}
          exclusive
          size="small"
          onChange={(_, value: MetricKey | null) => {
            if (value) {
              onMetricKeyChange(value);
            }
          }}
          sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: '0.78rem' } }}
        >
          <ToggleButton value="distance">Dystans</ToggleButton>
          <ToggleButton value="time">Czas</ToggleButton>
          <ToggleButton value="power">Moc</ToggleButton>
          <ToggleButton value="hr">Tętno</ToggleButton>
        </ToggleButtonGroup>
      )}
    </Box>
  );
}

function FeedContent({
  activities,
  error,
  feedContainerRef,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  maxValues,
  metricKey,
  onActivityClick,
  onRetry,
  setSentinelEl,
}: Pick<
  ActivityFeedViewProps,
  | 'activities'
  | 'error'
  | 'feedContainerRef'
  | 'hasNextPage'
  | 'isFetchingNextPage'
  | 'isLoading'
  | 'maxValues'
  | 'metricKey'
  | 'onActivityClick'
  | 'onRetry'
  | 'setSentinelEl'
>) {
  if (isLoading) {
    return <LoadingState message="Ładowanie feedu aktywności…" />;
  }

  if (error) {
    return (
      <ErrorState
        message={getApiErrorMessage(error, 'Nie udało się załadować feedu aktywności.')}
        onRetry={onRetry}
      />
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        title="Brak aktywności"
        description="Zaimportuj aktywności ze Stravy, aby zobaczyć feed."
        illustration="/illustrations/empty-activities.png"
      />
    );
  }

  return (
    <>
      <Stack spacing={1.5} ref={feedContainerRef}>
        {activities.map((activity) => {
          const startedAt = new Date(activity.startedAt);
          return (
            <div
              key={activity.id}
              data-activity-year={startedAt.getFullYear()}
              data-activity-month={startedAt.getMonth() + 1}
            >
              <ActivityFeedCard
                activity={activity}
                metricKey={metricKey}
                maxValues={maxValues}
                onClick={onActivityClick}
              />
            </div>
          );
        })}
      </Stack>
      <div ref={setSentinelEl} style={{ height: 1 }} />
      {!!isFetchingNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {!hasNextPage && activities.length > 0 && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="caption" color="text.disabled">
            Wszystkie {activities.length} aktywności załadowane
          </Typography>
        </Box>
      )}
    </>
  );
}

export default function ActivityFeedView({
  activities,
  error,
  feedContainerRef,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  maxValues,
  metricKey,
  onActivityClick,
  onCalendarMonthChange,
  onMetricKeyChange,
  onRetry,
  onSidebarNavigate,
  onViewModeChange,
  selectedCalendarMonth,
  setSentinelEl,
  sidebarSelection,
  viewMode,
}: ActivityFeedViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ActivityFeedToolbar
          metricKey={metricKey}
          onMetricKeyChange={onMetricKeyChange}
          onViewModeChange={onViewModeChange}
          viewMode={viewMode}
        />

        {viewMode === 'feed' && isMobile ? (
          <Box sx={{ mb: 2 }}>
            <Button startIcon={<FilterAltIcon />} variant="outlined" onClick={() => setSidebarOpen(true)}>
              Oś czasu
            </Button>
          </Box>
        ) : null}

        {viewMode === 'heatmap' ? (
          <Box sx={{ height: 'calc(100vh - 200px)', minHeight: 500, borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 0.5, pb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Heatmapa tras
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Najczęściej używane odcinki są czytelniejsze dzięki legendzie intensywności i statystykom w rogu mapy.
              </Typography>
            </Box>
            <RouteHeatmap />
          </Box>
        ) : viewMode === 'feed' ? (
          <FeedContent
            activities={activities}
            error={error}
            feedContainerRef={feedContainerRef}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
            maxValues={maxValues}
            metricKey={metricKey}
            onActivityClick={onActivityClick}
            onRetry={onRetry}
            setSentinelEl={setSentinelEl}
          />
        ) : (
          <ActivityCalendar
            year={selectedCalendarMonth.year}
            month={selectedCalendarMonth.month}
            metricKey={metricKey}
            onMonthChange={onCalendarMonthChange}
            onActivityClick={onActivityClick}
          />
        )}
      </Box>

      {viewMode === 'feed' && !isMobile && (
        <YearMonthSidebar externalYM={sidebarSelection} onNavigate={onSidebarNavigate} />
      )}

      {viewMode === 'feed' && isMobile ? (
        <Drawer
          anchor="right"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          PaperProps={{ sx: { width: 280, p: 1 } }}
        >
          <YearMonthSidebar
            externalYM={sidebarSelection}
            onNavigate={(selection) => {
              onSidebarNavigate(selection);
              setSidebarOpen(false);
            }}
          />
        </Drawer>
      ) : null}
    </Box>
  );
}
