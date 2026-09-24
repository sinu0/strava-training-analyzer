import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  Chip,
  Grid,
  Stack,
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
import { EmptyState, ErrorState, LoadingState, Metric, Page, Surface } from '@/ui';

import { useActivityLaps, useActivityStreams, useV2Activity } from './useHistory';

type DetailTab = 'overview' | 'analysis' | 'laps' | 'segments';

function metric(value?: number | null, suffix = '') {
  return value == null ? '—' : `${Math.round(value * 10) / 10}${suffix}`;
}

export default function ActivityDetailV2Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const tab: DetailTab = requestedTab === 'analysis' || requestedTab === 'laps' || requestedTab === 'segments' ? requestedTab : 'overview';
  const activity = useV2Activity(id);
  const streams = useActivityStreams(id, tab === 'analysis' || tab === 'laps');
  const laps = useActivityLaps(id, tab === 'laps');

  if (activity.isLoading) return <LoadingState message="Ładowanie podsumowania aktywności…" />;
  if (activity.isError || !activity.data) return <ErrorState title="Nie znaleziono aktywności" message="Nie udało się wczytać podsumowania." />;

  const data = activity.data;
  const streamData = streams.data;
  const lapData = laps.data ?? [];
  const changeTab = (next: DetailTab) => {
    const updated = new URLSearchParams(params);
    if (next === 'overview') updated.delete('tab'); else updated.set('tab', next);
    setParams(updated);
  };

  return (
    <Page
      title={data.name}
      subtitle={`${new Date(data.startedAt).toLocaleString('pl-PL')} · ${data.sportType}`}
      maxWidth={1200}
      breadcrumbs={[{ label: 'Historia', href: '/activities' }, { label: data.name }]}
      actions={<Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/activities')}>Historia</Button>}
    >
      <Surface padding="none" variant="accent">
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2}>
            {[
              { label: 'Dystans', value: data.distanceM != null ? `${(data.distanceM / 1000).toFixed(1)} km` : '—' },
              { label: 'Czas', value: data.movingTimeSec != null ? `${Math.round(data.movingTimeSec / 60)} min` : '—' },
              { label: data.deviceWatts === true ? 'Moc · pomiar' : data.deviceWatts === false ? 'Moc · estymacja' : 'Moc · nieznane źródło', value: metric(data.avgPowerW, ' W') },
              { label: 'Tętno', value: metric(data.avgHeartrate, ' bpm') },
              { label: 'Przewyższenie', value: metric(data.elevationGainM, ' m') },
              { label: 'Kadencja', value: metric(data.avgCadence, ' rpm') },
            ].map(({ label, value }) => (
              <Grid
                key={label}
                size={{
                  xs: 6,
                  sm: 4,
                  md: 2
                }}>
                <Metric label={label} value={value} tone={label === 'Moc' ? 'primary' : undefined} />
              </Grid>
            ))}
          </Grid>
        </Box>
        <Tabs value={tab} onChange={(_, value: DetailTab) => changeTab(value)} variant="fullWidth" aria-label="Sekcje aktywności">
          <Tab value="overview" label="Przegląd" />
          <Tab value="analysis" label="Analiza" />
          <Tab value="laps" label="Okrążenia" />
          <Tab value="segments" label="Segmenty" />
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
              <Surface>
                <Typography variant="h6">Podsumowanie</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    mt: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}>
                  {data.description || 'Brak opisu aktywności.'}
                </Typography>
              </Surface>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 5
              }}>
              <Surface>
                <Typography variant="h6">Metryki i jakość</Typography>
                <ActivityMetricGrid metrics={data.metrics} />
              </Surface>
            </Grid>
          </Grid>
        )}

        {tab === 'analysis' && (
          <Surface>
            {streams.isLoading ? <LoadingState message="Ładowanie zredukowanych strumieni…" /> : null}
            {streams.isError ? <ErrorState message="Nie udało się pobrać strumieni." onRetry={() => void streams.refetch()} /> : null}
            {streamData != null && streamData.returnedPoints > 0 ? (
              <>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    mb: 2
                  }}>
                  <Typography variant="h6">Przebieg sesji</Typography>
                  <Chip size="small" label={`${streamData.returnedPoints}/${streamData.originalPoints} punktów`} />
                </Stack>
                <ActivityStreamsChart
                  timeStream={streamData.time ?? null}
                  powerStream={streamData.power ?? null}
                  heartrateStream={streamData.heartrate ?? null}
                  cadenceStream={streamData.cadence ?? null}
                  altitudeStream={streamData.altitude ?? null}
                />
              </>
            ) : streamData ? <EmptyState title="Brak strumieni" description="Aktywność nie zawiera danych czasowych do analizy." /> : null}
          </Surface>
        )}

        {tab === 'laps' && (
          <Surface padding="none">
            {laps.isLoading ? <LoadingState message="Ładowanie okrążeń…" /> : null}
            {laps.isError ? <ErrorState message="Nie udało się pobrać okrążeń." onRetry={() => void laps.refetch()} /> : null}
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
            ) : laps.data ? <EmptyState title="Brak okrążeń" /> : null}
          </Surface>
        )}
        {tab === 'segments' && <ActivitySegmentsPanel activityId={data.id} />}
      </Box>
    </Page>
  );
}
