import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Box, Button, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import { useMatchedRideGroup } from '@/hooks/useMatchedRides';
import { getAppThemeTokens } from '@/theme/theme';

import { speedChartDomain } from './chartScale';

function duration(seconds?: number | null) { if (seconds == null) return '—'; const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); return `${h}:${String(m).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function signed(value?: number | null) { return value == null ? '—' : `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/h`; }

export default function MatchedRidesPage() {
  const { routeGroupId } = useParams<{ routeGroupId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const tokens = getAppThemeTokens(theme);
  const query = useMatchedRideGroup(routeGroupId);
  if (query.isLoading) return <LoadingState message="Ładowanie dopasowanych przejazdów…" />;
  if (query.isError || !query.data) return <ErrorState title="Nie znaleziono grupy tras" message="Nie udało się wczytać dopasowanych przejazdów." />;
  const data = query.data;
  const current = data.rides[data.rides.length - 1];
  const previous = data.rides[data.rides.length - 2];
  const priorBest = data.rides.slice(0, -1).reduce<number | null>((best, ride) => ride.averageSpeedKmh == null ? best : Math.max(best ?? ride.averageSpeedKmh, ride.averageSpeedKmh), null);
  const isRecord = current?.averageSpeedKmh != null && (priorBest == null || current.averageSpeedKmh > priorBest);
  const versusPrevious = current?.averageSpeedKmh != null && previous?.averageSpeedKmh != null ? current.averageSpeedKmh - previous.averageSpeedKmh : null;
  const versusAverage = current?.averageSpeedKmh != null && data.averageSpeedKmh != null ? current.averageSpeedKmh - data.averageSpeedKmh : null;
  const versusRecord = current?.averageSpeedKmh != null && data.bestSpeedKmh != null ? current.averageSpeedKmh - data.bestSpeedKmh : null;
  const chartDomain = speedChartDomain(data.rides.map(ride => ride.averageSpeedKmh));
  return (
    <PageContainer title="Dopasowane przejazdy" subtitle={`${data.rideCount} przejazdów · algorytm v${data.algorithmVersion}`} maxWidth={1200}
      actions={<Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(-1)}>Wróć</Button>}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}><PerformanceSurface sx={{ p: 2 }}><MetricReadout label="Najlepszy" value={data.bestSpeedKmh != null ? `${data.bestSpeedKmh.toFixed(1)} km/h` : '—'} tone="primary" /></PerformanceSurface></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><PerformanceSurface sx={{ p: 2 }}><MetricReadout label="Średni" value={data.averageSpeedKmh != null ? `${data.averageSpeedKmh.toFixed(1)} km/h` : '—'} /></PerformanceSurface></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><PerformanceSurface sx={{ p: 2 }}><MetricReadout label="Najwolniejszy" value={data.slowestSpeedKmh != null ? `${data.slowestSpeedKmh.toFixed(1)} km/h` : '—'} /></PerformanceSurface></Grid>
      </Grid>
      {!!current && (
      <PerformanceSurface accent sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">{current.activityName}</Typography>
        {isRecord && priorBest != null
          ? <Typography color="success.main" sx={{ fontWeight: 800 }}>Nowy rekord — {signed(current.averageSpeedKmh! - priorBest)} względem poprzedniego najlepszego wyniku</Typography>
          : <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 0.5 }}>
            <Typography>{signed(versusPrevious)} względem poprzedniej jazdy</Typography>
            <Typography>{signed(versusAverage)} względem średniej</Typography>
            <Typography>{signed(versusRecord)} względem rekordu</Typography>
          </Stack>}
      </PerformanceSurface>
    )}
      <PerformanceSurface sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Progres na tej trasie</Typography>
        <Box sx={{ height: 340 }} aria-label="Wykres wszystkich przejazdów i wygładzonego trendu">
          <ResponsiveContainer><LineChart data={data.rides}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="startedAt" tickFormatter={value => new Date(String(value)).toLocaleDateString('pl-PL')} /><YAxis unit=" km/h" domain={chartDomain} allowDataOverflow /><Tooltip labelFormatter={value => new Date(String(value)).toLocaleString('pl-PL')} />
            <Line dataKey="averageSpeedKmh" name="Przejazd" stroke={tokens.chart.secondary} strokeWidth={1.5} /><Line dataKey="smoothedSpeedKmh" name="Wygładzony trend" stroke={tokens.chart.primary} strokeWidth={4} dot={false} /></LineChart></ResponsiveContainer>
        </Box>
      </PerformanceSurface>
      <PerformanceSurface>
        <TableContainer><Table size="small" aria-label="Dopasowane przejazdy"><TableHead><TableRow><TableCell>Data</TableCell><TableCell>Aktywność</TableCell><TableCell align="right">Prędkość</TableCell><TableCell align="right">Czas ruchu</TableCell><TableCell align="right">Moc</TableCell><TableCell align="right">Tętno</TableCell><TableCell align="right">Względny wysiłek</TableCell><TableCell align="right">Dopasowanie</TableCell></TableRow></TableHead>
          <TableBody>{[...data.rides].reverse().map(ride => <TableRow hover key={ride.activityId} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/activities/${ride.activityId}`)}><TableCell>{new Date(ride.startedAt).toLocaleDateString('pl-PL')}</TableCell><TableCell><Button onClick={() => navigate(`/activities/${ride.activityId}`)}>{ride.activityName}</Button></TableCell><TableCell align="right">{ride.averageSpeedKmh?.toFixed(1) ?? '—'} km/h</TableCell><TableCell align="right">{duration(ride.movingTimeSec)}</TableCell><TableCell align="right">{ride.averagePowerW ?? '—'} W</TableCell><TableCell align="right">{ride.averageHeartrate ?? '—'} bpm</TableCell><TableCell align="right">{ride.relativeEffort ?? '—'}</TableCell><TableCell align="right">{ride.similarityPercent.toFixed(0)}%</TableCell></TableRow>)}</TableBody>
        </Table></TableContainer>
      </PerformanceSurface>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}><Typography variant="caption" color="text.secondary">Przeciwny kierunek jest przechowywany jako osobna grupa w tej samej rodzinie tras.</Typography></Stack>
    </PageContainer>
  );
}
