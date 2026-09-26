import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Box, Button, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useMatchedRideGroup } from '@/hooks/useMatchedRides';
import { getLocale } from '@/i18n';
import { getAppThemeTokens } from '@/theme/theme';
import { ErrorState, LoadingState, Metric, Page, Surface } from '@/ui';

import { speedChartDomain } from './chartScale';
import { matchedRidesPageMessages } from './messages';

function duration(seconds?: number | null) { if (seconds == null) return '—'; const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); return `${h}:${String(m).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function signed(value?: number | null) { return value == null ? '—' : `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString(getLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/h`; }

export default function MatchedRidesPage() {
  const { routeGroupId } = useParams<{ routeGroupId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const tokens = getAppThemeTokens(theme);
  const t = matchedRidesPageMessages.useT();
  const query = useMatchedRideGroup(routeGroupId);
  if (query.isLoading) return <LoadingState message={t('loading')} />;
  if (query.isError || !query.data) return <ErrorState title={t('notFoundTitle')} message={t('notFoundMessage')} />;
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
    <Page title={t('pageTitle')} subtitle={t('pageSubtitle', { count: data.rideCount, version: data.algorithmVersion })} maxWidth={1200}
      actions={<Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(-1)}>{t('back')}</Button>}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}><Surface padding="sm"><Metric label={t('metricBest')} value={data.bestSpeedKmh != null ? `${data.bestSpeedKmh.toFixed(1)} km/h` : '—'} tone="primary" /></Surface></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><Surface padding="sm"><Metric label={t('metricAverage')} value={data.averageSpeedKmh != null ? `${data.averageSpeedKmh.toFixed(1)} km/h` : '—'} /></Surface></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><Surface padding="sm"><Metric label={t('metricSlowest')} value={data.slowestSpeedKmh != null ? `${data.slowestSpeedKmh.toFixed(1)} km/h` : '—'} /></Surface></Grid>
      </Grid>
      {!!current && (
      <Surface padding="sm" variant="accent" sx={{ mb: 2 }}>
        <Typography variant="h6">{current.activityName}</Typography>
        {isRecord && priorBest != null
          ? <Typography
          sx={{
            color: "success.main",
            fontWeight: 800
          }}>{t('newRecord', { change: signed(current.averageSpeedKmh! - priorBest) })}</Typography>
          : <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 0.5 }}>
            <Typography>{t('vsPrevious', { change: signed(versusPrevious) })}</Typography>
            <Typography>{t('vsAverage', { change: signed(versusAverage) })}</Typography>
            <Typography>{t('vsRecord', { change: signed(versusRecord) })}</Typography>
          </Stack>}
      </Surface>
    )}
      <Surface padding="sm" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{t('progressTitle')}</Typography>
        <Box sx={{ height: 340 }} aria-label={t('chartAriaLabel')}>
          <ResponsiveContainer><LineChart data={data.rides}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="startedAt" tickFormatter={value => new Date(String(value)).toLocaleDateString(getLocale())} /><YAxis unit=" km/h" domain={chartDomain} allowDataOverflow /><Tooltip labelFormatter={value => new Date(String(value)).toLocaleString(getLocale())} />
            <Line dataKey="averageSpeedKmh" name={t('seriesRide')} stroke={tokens.chart.secondary} strokeWidth={1.5} /><Line dataKey="smoothedSpeedKmh" name={t('seriesSmoothedTrend')} stroke={tokens.chart.primary} strokeWidth={4} dot={false} /></LineChart></ResponsiveContainer>
        </Box>
      </Surface>
      <Surface padding="none">
        <TableContainer><Table size="small" aria-label={t('tableAriaLabel')}><TableHead><TableRow><TableCell>{t('colDate')}</TableCell><TableCell>{t('colActivity')}</TableCell><TableCell align="right">{t('colSpeed')}</TableCell><TableCell align="right">{t('colMovingTime')}</TableCell><TableCell align="right">{t('colPower')}</TableCell><TableCell align="right">{t('colHeartRate')}</TableCell><TableCell align="right">{t('colRelativeEffort')}</TableCell><TableCell align="right">{t('colMatch')}</TableCell></TableRow></TableHead>
          <TableBody>{[...data.rides].reverse().map(ride => <TableRow hover key={ride.activityId} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/activities/${ride.activityId}`)}><TableCell>{new Date(ride.startedAt).toLocaleDateString(getLocale())}</TableCell><TableCell><Button onClick={() => navigate(`/activities/${ride.activityId}`)}>{ride.activityName}</Button></TableCell><TableCell align="right">{ride.averageSpeedKmh?.toFixed(1) ?? '—'} km/h</TableCell><TableCell align="right">{duration(ride.movingTimeSec)}</TableCell><TableCell align="right">{ride.averagePowerW ?? '—'} W</TableCell><TableCell align="right">{ride.averageHeartrate ?? '—'} bpm</TableCell><TableCell align="right">{ride.relativeEffort ?? '—'}</TableCell><TableCell align="right">{ride.similarityPercent.toFixed(0)}%</TableCell></TableRow>)}</TableBody>
        </Table></TableContainer>
      </Surface>
      <Stack
        direction="row"
        sx={{
          justifyContent: "flex-end",
          mt: 1
        }}><Typography variant="caption" sx={{
        color: "text.secondary"
      }}>{t('reverseDirectionNote')}</Typography></Stack>
    </Page>
  );
}
