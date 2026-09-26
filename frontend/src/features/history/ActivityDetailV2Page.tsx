import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import {
  Box,
  Button,
  Grid,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import ActivityMetricGrid from '@/components/activity/ActivityMetricGrid';
import ActivityRoutePreview from '@/components/activity/ActivityRoutePreview';
import LapsTab from '@/components/activity/LapsTab';
import ActivityStreamsChart from '@/components/ActivityStreamsChart';
import MatchedRideCard from '@/components/matched-rides/MatchedRideCard';
import ActivitySegmentsPanel from '@/components/segments/ActivitySegmentsPanel';
import { getLocale } from '@/i18n';
import { EmptyState, ErrorState, LoadingState, Metric, Page, StatusPill, Surface, Widget } from '@/ui';

import { historyMessages } from './messages';
import { useActivityLaps, useActivityStreams, useV2Activity } from './useHistory';

type DetailTab = 'overview' | 'analysis' | 'laps' | 'segments';

function metric(value?: number | null, suffix = '') {
  return value == null ? '—' : `${Math.round(value * 10) / 10}${suffix}`;
}

export default function ActivityDetailV2Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = historyMessages.useT();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const tab: DetailTab = requestedTab === 'analysis' || requestedTab === 'laps' || requestedTab === 'segments' ? requestedTab : 'overview';
  const activity = useV2Activity(id);
  const streams = useActivityStreams(id, tab === 'analysis' || tab === 'laps');
  const laps = useActivityLaps(id, tab === 'laps');

  if (activity.isLoading) return <LoadingState message={t('detail.loadingSummary')} />;
  if (activity.isError || !activity.data) return <ErrorState title={t('detail.notFoundTitle')} message={t('detail.notFoundMessage')} />;

  const data = activity.data;
  const streamData = streams.data;
  const lapData = laps.data ?? [];
  const changeTab = (next: DetailTab) => {
    const updated = new URLSearchParams(params);
    if (next === 'overview') updated.delete('tab'); else updated.set('tab', next);
    setParams(updated);
  };

  const powerLabel = data.deviceWatts === true ? t('detail.powerMeasured')
    : data.deviceWatts === false ? t('detail.powerEstimated') : t('detail.powerUnknown');

  return (
    <Page
      title={data.name}
      subtitle={`${new Date(data.startedAt).toLocaleString(getLocale())} · ${data.sportType}`}
      maxWidth={1200}
      breadcrumbs={[{ label: t('detail.history'), href: '/activities' }, { label: data.name }]}
      actions={<Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/activities')}>{t('detail.history')}</Button>}
    >
      <Surface padding="none" variant="accent">
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2}>
            {[
              { label: t('detail.distance'), value: data.distanceM != null ? `${(data.distanceM / 1000).toFixed(1)} km` : '—', isPower: false },
              { label: t('detail.time'), value: data.movingTimeSec != null ? `${Math.round(data.movingTimeSec / 60)} min` : '—', isPower: false },
              { label: powerLabel, value: metric(data.avgPowerW, ' W'), isPower: true },
              { label: t('detail.heartRate'), value: metric(data.avgHeartrate, ' bpm'), isPower: false },
              { label: t('detail.elevationGain'), value: metric(data.elevationGainM, ' m'), isPower: false },
              { label: t('detail.cadence'), value: metric(data.avgCadence, ' rpm'), isPower: false },
            ].map(({ label, value, isPower }) => (
              <Grid
                key={label}
                size={{
                  xs: 6,
                  sm: 4,
                  md: 2
                }}>
                <Metric label={label} value={value} tone={isPower ? 'primary' : undefined} />
              </Grid>
            ))}
          </Grid>
        </Box>
        <Tabs value={tab} onChange={(_, value: DetailTab) => changeTab(value)} variant="fullWidth" aria-label={t('detail.sectionsAriaLabel')}>
          <Tab value="overview" label={t('detail.tabOverview')} />
          <Tab value="analysis" label={t('detail.tabAnalysis')} />
          <Tab value="laps" label={t('detail.tabLaps')} />
          <Tab value="segments" label={t('detail.tabSegments')} />
        </Tabs>
      </Surface>
      <Box sx={{ mt: 2.5 }}>
        {tab === 'overview' && (
          <Grid container spacing={2}>
            <Grid size={12}>
              <Surface padding="none">
                <ActivityRoutePreview
                  activityName={data.name}
                  summaryPolyline={data.summaryPolyline}
                  height={380}
                  priority
                />
              </Surface>
            </Grid>
            <Grid size={12}><MatchedRideCard activityId={data.id} /></Grid>
            <Grid
              size={{
                xs: 12,
                md: 7
              }}>
              <Widget title={t('detail.summaryTitle')} icon={<NotesOutlinedIcon />}>
                <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                  {data.description || t('detail.noDescription')}
                </Typography>
              </Widget>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 5
              }}>
              <Widget title={t('detail.metricsTitle')} icon={<InsightsOutlinedIcon />}>
                <ActivityMetricGrid metrics={data.metrics} />
              </Widget>
            </Grid>
          </Grid>
        )}

        {tab === 'analysis' && (
          <Widget
            title={t('detail.sessionTitle')}
            icon={<ShowChartOutlinedIcon />}
            action={streamData != null && streamData.returnedPoints > 0 ? <StatusPill size="sm" label={t('detail.pointsRatio', { returned: streamData.returnedPoints, original: streamData.originalPoints })} /> : undefined}
          >
            {streams.isLoading ? <LoadingState message={t('detail.loadingStreams')} /> : null}
            {streams.isError ? <ErrorState message={t('detail.streamsError')} onRetry={() => void streams.refetch()} /> : null}
            {streamData != null && streamData.returnedPoints > 0 ? (
              <>
                <ActivityStreamsChart
                  timeStream={streamData.time ?? null}
                  powerStream={streamData.power ?? null}
                  heartrateStream={streamData.heartrate ?? null}
                  cadenceStream={streamData.cadence ?? null}
                  altitudeStream={streamData.altitude ?? null}
                />
              </>
            ) : streamData ? <EmptyState title={t('detail.noStreamsTitle')} description={t('detail.noStreamsDescription')} /> : null}
          </Widget>
        )}

        {tab === 'laps' && (
          <Surface padding="none">
            {laps.isLoading ? <LoadingState message={t('detail.loadingLaps')} /> : null}
            {laps.isError ? <ErrorState message={t('detail.lapsError')} onRetry={() => void laps.refetch()} /> : null}
            {lapData.length > 0 ? (
              <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
                <LapsTab
                  laps={lapData}
                  sportType={data.sportType}
                  altitudeStream={streamData?.altitude}
                  powerStream={streamData?.power}
                  heartrateStream={streamData?.heartrate}
                  velocityStream={streamData?.velocity}
                  timeStream={streamData?.time}
                />
              </Box>
            ) : laps.data ? <EmptyState title={t('detail.noLapsTitle')} /> : null}
          </Surface>
        )}
        {tab === 'segments' && <ActivitySegmentsPanel activityId={data.id} />}
      </Box>
    </Page>
  );
}
