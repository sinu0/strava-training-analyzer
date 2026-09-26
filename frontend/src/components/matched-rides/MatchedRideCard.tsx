import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

import { speedChartDomain } from '@/features/matched-rides/chartScale';
import { useMatchedRide } from '@/hooks/useMatchedRides';
import { getLocale } from '@/i18n';
import { getAppThemeTokens } from '@/theme/theme';
import type { MatchedRideSummary } from '@/types/matchedRides';
import { ErrorState, LoadingState, Metric, Surface } from '@/ui';

interface MatchedRideCardProps { activityId: string }

function signed(value?: number | null) { return value == null ? '—' : `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString(getLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/h`; }

function isRenderableSummary(data: unknown): data is MatchedRideSummary {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return false;
  const candidate = data as Partial<MatchedRideSummary>;
  return typeof candidate.routeGroupId === 'string'
    && typeof candidate.rideCount === 'number'
    && Number.isFinite(candidate.rideCount)
    && typeof candidate.currentRank === 'number'
    && Number.isFinite(candidate.currentRank)
    && typeof candidate.similarityPercent === 'number'
    && Number.isFinite(candidate.similarityPercent)
    && Array.isArray(candidate.trend);
}

export default function MatchedRideCard({ activityId }: MatchedRideCardProps) {
  const query = useMatchedRide(activityId);
  const navigate = useNavigate();
  const theme = useTheme();
  const tokens = getAppThemeTokens(theme);
  if (query.isLoading) return <LoadingState message="Sprawdzanie podobnych tras…" />;
  if (query.isError) return <ErrorState message="Nie udało się sprawdzić dopasowanych przejazdów." onRetry={() => void query.refetch()} />;
  const data = query.data;
  if (!isRenderableSummary(data) || data.rideCount < 2) return null;
  const chartDomain = speedChartDomain(data.trend.map(point => point.averageSpeedKmh));
  return (
    <Surface>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{
        alignItems: { md: 'center' }
      }}>
        <Box sx={{ flex: 1 }}>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              alignItems: "center",
              flexWrap: "wrap"
            }}>
            <Typography variant="h6">Dopasowane przejazdy</Typography>
            <Chip size="small" label={`trasa podobna w ${data.similarityPercent.toFixed(0)}%`} />
            {data.directionVariant === 'REVERSE' && <Chip size="small" variant="outlined" label="przeciwny kierunek" />}
          </Stack>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mt: 0.5
            }}>{data.rideCount} przejazdów na tej trasie · ten wynik: {data.currentRank}.</Typography>
          {data.newRecord && data.changeFromPreviousBestKmh != null
            ? <Typography
            sx={{
              color: "success.main",
              mt: 1,
              fontWeight: 800
            }}>Nowy rekord — {signed(data.changeFromPreviousBestKmh)} względem poprzedniego najlepszego wyniku</Typography>
            : null}
        </Box>
        <Box sx={{ width: { xs: '100%', md: 220 }, height: 76 }} aria-label="Miniwykres trendu dopasowanych przejazdów">
          <ResponsiveContainer><LineChart data={data.trend}><YAxis hide domain={chartDomain} allowDataOverflow /><Line dataKey="averageSpeedKmh" stroke={tokens.chart.secondary} strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>
        </Box>
      </Stack>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6, sm: 3 }}><Metric label="Ta jazda" value={data.currentSpeedKmh != null ? `${data.currentSpeedKmh.toFixed(1)} km/h` : '—'} tone="primary" /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><Metric label="vs poprzednia" value={signed(data.changeFromPreviousKmh)} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><Metric label="vs średnia" value={signed(data.changeFromAverageKmh)} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><Metric label="vs rekord" value={signed(data.changeFromRecordKmh)} /></Grid>
      </Grid>
      <Stack
        direction="row"
        sx={{
          justifyContent: "flex-end",
          mt: 2
        }}>
        <Button endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate(`/matched-rides/${data.routeGroupId}`)}>Zobacz dopasowane przejazdy</Button>
      </Stack>
    </Surface>
  );
}
