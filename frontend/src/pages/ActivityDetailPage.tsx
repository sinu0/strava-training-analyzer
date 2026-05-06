import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SyncIcon from '@mui/icons-material/Sync';
import { Button, CircularProgress, Stack } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ActivityHeroSection from '@/components/activity/ActivityHeroSection';
import ActivityScoreTab from '@/components/activity/ActivityScoreTab';
import ActivityTabs from '@/components/activity/ActivityTabs';
import AdvancedStatsTab from '@/components/activity/AdvancedStatsTab';
import AnalysisTab from '@/components/activity/AnalysisTab';
import type { BrushRange, SelectionStats } from '@/components/activity/InteractiveStreamsChart';
import LapsTab from '@/components/activity/LapsTab';
import OverviewTab from '@/components/activity/OverviewTab';
import AiCoachSection from '@/components/AiCoachSection';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import PullToRefreshPanel from '@/components/common/PullToRefreshPanel';
import SwipeableContent from '@/components/common/SwipeableContent';
import { useActivity, useActivityMap, useRecalculateActivityMetrics } from '@/hooks/useActivities';

export default function ActivityDetailPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: activity, isLoading, error } = useActivity(id);
  const { data: geoJson } = useActivityMap(id);
  const recalculate = useRecalculateActivityMetrics(id);
  const [tabIndex, setTabIndex] = useState(0);

  // Lifted map interaction state so charts and map can communicate across tabs
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [selection, setSelection] = useState<BrushRange | null>(null);

  const handleHoverIndex = useCallback((i: number | null) => setHoverIndex(i), []);
  const handleSelectionChange = useCallback(
    (range: BrushRange | null, _stats?: SelectionStats | null) => setSelection(range),
    [],
  );

  if (isLoading) {
    return <LoadingState message="Ładowanie aktywności..." />;
  }

  if (error || !activity) {
    return (
      <ErrorState
        title="Nie znaleziono aktywności"
        message="Nie udało się wczytać szczegółów wybranej aktywności."
      />
    );
  }

  const hasLaps = !!activity.laps && activity.laps.length > 0;
  const tabCount = hasLaps ? 6 : 5;

  const renderTabContent = () => {
    if (tabIndex === 0) return <OverviewTab activity={activity} />;
    if (tabIndex === 1) return activity.trainingEffect ? <ActivityScoreTab effect={activity.trainingEffect} /> : null;
    if (tabIndex === 2) return (
      <AnalysisTab
        activity={activity}
        geoJson={geoJson ?? null}
        hoverIndex={hoverIndex}
        selection={selection}
        onHoverIndex={handleHoverIndex}
        onSelectionChange={handleSelectionChange}
      />
    );

    const lapsIdx = hasLaps ? 3 : -1;
    const advancedIdx = hasLaps ? 4 : 3;
    const aiIdx = hasLaps ? 5 : 4;

    if (hasLaps && tabIndex === lapsIdx) return (
      <LapsTab
        laps={activity.laps!}
        sportType={activity.sportType}
        altitudeStream={activity.altitudeStream}
        powerStream={activity.powerStream}
        heartrateStream={activity.heartrateStream}
        velocityStream={activity.velocityStream}
        timeStream={activity.timeStream}
        onHoverIndex={handleHoverIndex}
        onSelectRange={(r) => setSelection(r)}
      />
    );
    if (tabIndex === advancedIdx) return <AdvancedStatsTab activity={activity} />;
    if (tabIndex === aiIdx) return <AiCoachSection activityId={activity.id} />;
    return null;
  };

  return (
    <PageContainer
      title="Szczegóły aktywności"
      subtitle="Przegląd aktywności, analiza streamów i AI są zebrane w jednym, mobilnym układzie."
      maxWidth={1200}
      breadcrumbs={[
        { label: 'Aktywności', href: '/activities' },
        { label: activity.name },
      ]}
      actions={
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate('/activities')}>
            Aktywności
          </Button>
          <Button
            variant="outlined"
            startIcon={recalculate.isPending ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />}
            disabled={recalculate.isPending}
            onClick={() => recalculate.mutate()}
          >
            Przelicz metryki
          </Button>
        </Stack>
      }
    >
      <PullToRefreshPanel
        onRefresh={async () => {
          await queryClient.refetchQueries();
        }}
      >
        <ActivityHeroSection activity={activity} geoJson={geoJson ?? null} />

        <ActivityTabs value={tabIndex} onChange={setTabIndex} hasLaps={hasLaps} />

        <SwipeableContent
          onSwipeLeft={() => setTabIndex((current) => Math.min(current + 1, tabCount - 1))}
          onSwipeRight={() => setTabIndex((current) => Math.max(current - 1, 0))}
        >
          {renderTabContent()}
        </SwipeableContent>
      </PullToRefreshPanel>
    </PageContainer>
  );
}
