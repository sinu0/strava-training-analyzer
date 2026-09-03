import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import { speedChartDomain } from '@/features/matched-rides/chartScale';
import { useMatchedRide } from '@/hooks/useMatchedRides';
import { getAppThemeTokens } from '@/theme/theme';

interface MatchedRideCardProps { activityId: string }

function signed(value?: number | null) { return value == null ? '—' : `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/h`; }

export default function MatchedRideCard({ activityId }: MatchedRideCardProps) {
  const query = useMatchedRide(activityId);
  const navigate = useNavigate();
  const theme = useTheme();
  const tokens = getAppThemeTokens(theme);
  if (query.isLoading) return <LoadingState message="Sprawdzanie podobnych tras…" />;
  if (query.isError) return <ErrorState message="Nie udało się sprawdzić dopasowanych przejazdów." onRetry={() => void query.refetch()} />;
  const data = query.data;
  if (!data || data.rideCount < 2) return null;
  const chartDomain = speedChartDomain(data.trend.map(point => point.averageSpeedKmh));
  return (
    <PerformanceSurface sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ md: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Typography variant="h6">Dopasowane przejazdy</Typography>
            <Chip size="small" label={`trasa podobna w ${data.similarityPercent.toFixed(0)}%`} />
            {data.directionVariant === 'REVERSE' && <Chip size="small" variant="outlined" label="przeciwny kierunek" />}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{data.rideCount} przejazdów na tej trasie · ten wynik: {data.currentRank}.</Typography>
          {data.newRecord && data.changeFromPreviousBestKmh != null
            ? <Typography color="success.main" sx={{ mt: 1, fontWeight: 800 }}>Nowy rekord — {signed(data.changeFromPreviousBestKmh)} względem poprzedniego najlepszego wyniku</Typography>
            : null}
        </Box>
        <Box sx={{ width: { xs: '100%', md: 220 }, height: 76 }} aria-label="Miniwykres trendu dopasowanych przejazdów">
          <ResponsiveContainer><LineChart data={data.trend}><YAxis hide domain={chartDomain} allowDataOverflow /><Line dataKey="averageSpeedKmh" stroke={tokens.chart.secondary} strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>
        </Box>
      </Stack>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6, sm: 3 }}><MetricReadout label="Ta jazda" value={data.currentSpeedKmh != null ? `${data.currentSpeedKmh.toFixed(1)} km/h` : '—'} tone="primary" /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><MetricReadout label="vs poprzednia" value={signed(data.changeFromPreviousKmh)} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><MetricReadout label="vs średnia" value={signed(data.changeFromAverageKmh)} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><MetricReadout label="vs rekord" value={signed(data.changeFromRecordKmh)} /></Grid>
      </Grid>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate(`/matched-rides/${data.routeGroupId}`)}>Zobacz dopasowane przejazdy</Button>
      </Stack>
    </PerformanceSurface>
  );
}
