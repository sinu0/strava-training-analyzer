import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import ActivityRoutePreview from '@/components/activity/ActivityRoutePreview';
import ActivityStreamsChart from '@/components/ActivityStreamsChart';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';

import { useActivityLaps, useActivityStreams, useV2Activity } from './useHistory';

type DetailTab = 'overview' | 'analysis' | 'laps';

function metric(value?: number | null, suffix = '') {
  return value == null ? '—' : `${Math.round(value * 10) / 10}${suffix}`;
}

export default function ActivityDetailV2Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const tab: DetailTab = requestedTab === 'analysis' || requestedTab === 'laps' ? requestedTab : 'overview';
  const activity = useV2Activity(id);
  const streams = useActivityStreams(id, tab === 'analysis');
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
    <PageContainer
      title={data.name}
      subtitle={`${new Date(data.startedAt).toLocaleString('pl-PL')} · ${data.sportType}`}
      maxWidth={1200}
      breadcrumbs={[{ label: 'Historia', href: '/activities' }, { label: data.name }]}
      actions={<Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/activities')}>Historia</Button>}
    >
      <PerformanceSurface accent>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2}>
            {[
              { label: 'Dystans', value: data.distanceM != null ? `${(data.distanceM / 1000).toFixed(1)} km` : '—' },
              { label: 'Czas', value: data.movingTimeSec != null ? `${Math.round(data.movingTimeSec / 60)} min` : '—' },
              { label: 'Moc', value: metric(data.avgPowerW, ' W') },
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
                <MetricReadout label={label} value={value} tone={label === 'Moc' ? 'primary' : undefined} />
              </Grid>
            ))}
          </Grid>
        </Box>
        <Tabs value={tab} onChange={(_, value: DetailTab) => changeTab(value)} variant="fullWidth" aria-label="Sekcje aktywności">
          <Tab value="overview" label="Przegląd" />
          <Tab value="analysis" label="Analiza" />
          <Tab value="laps" label="Okrążenia" />
        </Tabs>
      </PerformanceSurface>
      <Box sx={{ mt: 2.5 }}>
        {tab === 'overview' && (
          <Grid container spacing={2}>
            <Grid size={12}>
              <PerformanceSurface>
                <ActivityRoutePreview
                  activityName={data.name}
                  summaryPolyline={data.summaryPolyline}
                  height={380}
                  priority
                />
              </PerformanceSurface>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 7
              }}>
              <PerformanceSurface sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={750}>Podsumowanie</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}>
                  {data.description || 'Brak opisu aktywności.'}
                </Typography>
              </PerformanceSurface>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 5
              }}>
              <PerformanceSurface sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={750}>Metryki i jakość</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                  {data.metrics.length > 0 ? data.metrics.filter(item => item.numericValue != null).slice(0, 8).map(item => (
                    <Chip key={item.name} label={`${item.name}: ${metric(item.numericValue)}`} variant="outlined" />
                  )) : <Typography variant="body2" color="text.secondary">Brak policzonych metryk.</Typography>}
                </Stack>
              </PerformanceSurface>
            </Grid>
          </Grid>
        )}

        {tab === 'analysis' && (
          <PerformanceSurface sx={{ p: { xs: 1.5, md: 2.5 } }}>
            {streams.isLoading ? <LoadingState message="Ładowanie zredukowanych strumieni…" /> : null}
            {streams.isError ? <ErrorState message="Nie udało się pobrać strumieni." onRetry={() => void streams.refetch()} /> : null}
            {streamData != null && streamData.returnedPoints > 0 ? (
              <>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={750}>Przebieg sesji</Typography>
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
          </PerformanceSurface>
        )}

        {tab === 'laps' && (
          <PerformanceSurface>
            {laps.isLoading ? <LoadingState message="Ładowanie okrążeń…" /> : null}
            {laps.isError ? <ErrorState message="Nie udało się pobrać okrążeń." onRetry={() => void laps.refetch()} /> : null}
            {lapData.length > 0 ? (
              <Table size="small">
                <TableHead><TableRow><TableCell>#</TableCell><TableCell>Nazwa</TableCell><TableCell align="right">Czas</TableCell><TableCell align="right">Moc</TableCell><TableCell align="right">Tętno</TableCell></TableRow></TableHead>
                <TableBody>{lapData.map(lap => (
                  <TableRow key={`${lap.lapIndex}-${lap.startIndex}`}>
                    <TableCell>{lap.lapIndex + 1}</TableCell><TableCell>{lap.name || 'Okrążenie'}</TableCell><TableCell align="right">{Math.round(lap.movingTimeSec / 60)} min</TableCell><TableCell align="right">{metric(lap.avgPowerW, ' W')}</TableCell><TableCell align="right">{metric(lap.avgHeartrate, ' bpm')}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            ) : laps.data ? <EmptyState title="Brak okrążeń" /> : null}
          </PerformanceSurface>
        )}
      </Box>
    </PageContainer>
  );
}
