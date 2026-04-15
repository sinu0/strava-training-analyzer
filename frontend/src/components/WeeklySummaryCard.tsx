import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import TerrainIcon from '@mui/icons-material/Terrain';
import TimerIcon from '@mui/icons-material/Timer';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { Grid } from '@mui/material';
import { Card, CardContent, CardActionArea, Typography, Box, Tooltip } from '@mui/material';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

import MetricTile from '@/components/common/MetricTile';
import type { WeeklyOptimalLoad, WeeklySummary } from '@/types/analytics';
import { LOAD_COLORS, alphaColor } from '@/utils/colors';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { getLoadStatusColor, getLoadStatusLabel } from '@/utils/statusColors';

interface WeeklySummaryCardProps {
  summary: WeeklySummary | undefined;
  optimalLoad?: WeeklyOptimalLoad;
}

const TssTile = memo(function TssTile({
  tss,
  optimalLoad,
}: {
  tss: number | string;
  optimalLoad?: WeeklyOptimalLoad;
}) {
  const navigate = useNavigate();
  const status = optimalLoad?.status ?? 'NO_DATA';
  const statusColor = getLoadStatusColor(status);
  const statusLabel = getLoadStatusLabel(status);
  const hasRange = optimalLoad && optimalLoad.optimalMin > 0;

  // Calculate fill fraction for the range bar
  let fillPct = 0;
  if (hasRange && typeof tss === 'number' && tss > 0) {
    const danger = optimalLoad.dangerThreshold;
    fillPct = Math.min(1, tss / danger) * 100;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={() => navigate('/analytics')} sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              TSS
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {!!hasRange && (
                <Box
                  sx={{
                    px: 0.75, py: 0.2, borderRadius: 1,
                    bgcolor: alphaColor(statusColor, 0.13),
                    border: `1px solid ${alphaColor(statusColor, 0.33)}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: statusColor, lineHeight: 1 }}>
                    {statusLabel}
                  </Typography>
                </Box>
              )}
              <WhatshotIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </Box>
          </Box>

          <Typography variant="h4" component="div">
            {tss}
          </Typography>

          {!!hasRange && (
            <Tooltip title={`Optymalny zakres: ${Math.round(optimalLoad!.optimalMin)}\u2013${Math.round(optimalLoad!.optimalMax)} TSS`}>
              <Box sx={{ mt: 1 }}>
                {/* Range bar */}
                <Box sx={{ position: 'relative', height: 6, borderRadius: 3, bgcolor: alphaColor(LOAD_COLORS.INSUFFICIENT, 0.16), overflow: 'hidden' }}>
                  {/* Optimal zone */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${Math.min(100, (optimalLoad!.optimalMin / optimalLoad!.dangerThreshold) * 100).toFixed(1)}%`,
                    width: `${Math.min(100 - (optimalLoad!.optimalMin / optimalLoad!.dangerThreshold) * 100, ((optimalLoad!.optimalMax - optimalLoad!.optimalMin) / optimalLoad!.dangerThreshold) * 100).toFixed(1)}%`,
                    height: '100%',
                    bgcolor: alphaColor(LOAD_COLORS.OPTIMAL, 0.19),
                    border: `1px solid ${alphaColor(LOAD_COLORS.OPTIMAL, 0.33)}`,
                    borderRadius: 3,
                  }} />
                  {/* Current value fill */}
                  <Box sx={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${fillPct.toFixed(1)}%`,
                    bgcolor: statusColor,
                    borderRadius: 3,
                    transition: 'width 0.5s ease',
                    opacity: 0.8,
                  }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                  <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                    cel: {Math.round(optimalLoad!.optimalMin)}–{Math.round(optimalLoad!.optimalMax)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: alphaColor(LOAD_COLORS.DANGER, 0.4) }}>
                    ⚠ {Math.round(optimalLoad!.dangerThreshold)}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
});

const WeeklySummaryCard = memo(function WeeklySummaryCard({
  summary,
  optimalLoad,
}: WeeklySummaryCardProps) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <MetricTile
          label="Dystans"
          value={summary ? formatDistance(summary.totalDistanceM) : '-'}
          icon={<DirectionsBikeIcon fontSize="small" />}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <MetricTile
          label="Czas"
          value={summary ? formatDuration(summary.totalTimeSec) : '-'}
          icon={<TimerIcon fontSize="small" />}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <TssTile
          tss={summary ? Math.round(summary.totalTss) : '-'}
          optimalLoad={optimalLoad}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <MetricTile
          label="Wzniesienie"
          value={summary ? `${Math.round(summary.totalElevationM)} m` : '-'}
          icon={<TerrainIcon fontSize="small" />}
        />
      </Grid>
    </Grid>
  );
});

export default WeeklySummaryCard;
