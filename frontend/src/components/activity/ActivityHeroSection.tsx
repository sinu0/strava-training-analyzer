import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Chip, Collapse, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import ActivityMediaCarousel from '@/components/ActivityMediaCarousel';
import type { ActivityDetail, GeoJsonFeature } from '@/types/activity';
import { formatDistance, formatDuration, formatPace } from '@/utils/formatters';
import { extractActivityRoutePositions } from '@/utils/map';

interface ActivityHeroSectionProps {
  activity: ActivityDetail;
  geoJson: GeoJsonFeature | null;
}

interface StatRow {
  label: string;
  avg: string;
  max?: string;
}

function formatSpeed(ms: number, sportType: string): string {
  const isRunning = sportType.toLowerCase().includes('run') || sportType.toLowerCase().includes('bieg');
  return isRunning ? formatPace(ms) : `${(ms * 3.6).toFixed(1)} km/h`;
}

function formatStartedAt(value: string): string {
  return new Date(value).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function hasPositiveNumber(value?: number | null): value is number {
  return typeof value === 'number' && value > 0;
}

function StatsTable({ rows }: { rows: StatRow[] }) {
  return (
    <Table size="small" sx={{ '& td': { border: 'none', px: 0, py: 0.9 } }}>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{row.label}</TableCell>
            <TableCell sx={{ color: 'text.primary', fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {row.avg}
            </TableCell>
            <TableCell sx={{ color: 'text.secondary', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {row.max ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function KeyMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        minWidth: 132,
        flex: 1,
        p: 1.5,
        borderRadius: 2.5,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  );
}

const surfaceSx = {
  bgcolor: 'background.paper',
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: (theme: { tokens?: { cardShadow?: string } }) => theme.tokens?.cardShadow ?? 'none',
} as const;

export default function ActivityHeroSection({ activity, geoJson }: ActivityHeroSectionProps) {
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  const routePositions = extractActivityRoutePositions({
    geoJson,
    latStream: activity.latStream,
    lngStream: activity.lngStream,
    summaryPolyline: activity.summaryPolyline,
  });

  const hasMedia = (activity.photoUrls?.length ?? 0) > 0 || routePositions.length >= 2;

  const keyMetrics = useMemo(() => {
    const metrics: Array<{ label: string; value: string }> = [];

    if (hasPositiveNumber(activity.distanceM)) {
      metrics.push({ label: 'Dystans', value: formatDistance(activity.distanceM) });
    }
    if (hasPositiveNumber(activity.movingTimeSec)) {
      metrics.push({ label: 'Czas ruchu', value: formatDuration(activity.movingTimeSec) });
    }
    if (hasPositiveNumber(activity.elevationGainM)) {
      metrics.push({ label: 'Przewyższenie', value: `${Math.round(activity.elevationGainM)} m` });
    }
    if (hasPositiveNumber(activity.avgPowerW)) {
      metrics.push({ label: 'Moc', value: `${Math.round(activity.avgPowerW)} W` });
    }
    if (hasPositiveNumber(activity.avgHeartrate)) {
      metrics.push({ label: 'Tętno', value: `${Math.round(activity.avgHeartrate)} bpm` });
    }
    if (hasPositiveNumber(activity.calories)) {
      metrics.push({ label: 'Kalorie', value: `${activity.calories} kcal` });
    }

    return metrics.slice(0, 6);
  }, [activity]);

  const statRows = useMemo(() => {
    const rows: StatRow[] = [];

    if (hasPositiveNumber(activity.avgSpeedMs)) {
      rows.push({
        label: 'Prędkość',
        avg: formatSpeed(activity.avgSpeedMs, activity.sportType),
        max: hasPositiveNumber(activity.maxSpeedMs) ? formatSpeed(activity.maxSpeedMs, activity.sportType) : undefined,
      });
    }

    if (hasPositiveNumber(activity.avgPowerW)) {
      rows.push({
        label: 'Moc',
        avg: `${Math.round(activity.avgPowerW)} W`,
        max: hasPositiveNumber(activity.maxPowerW) ? `${Math.round(activity.maxPowerW)} W` : undefined,
      });
    }

    if (hasPositiveNumber(activity.avgHeartrate)) {
      rows.push({
        label: 'Tętno',
        avg: `${Math.round(activity.avgHeartrate)} bpm`,
        max: hasPositiveNumber(activity.maxHeartrate) ? `${Math.round(activity.maxHeartrate)} bpm` : undefined,
      });
    }

    if (hasPositiveNumber(activity.avgCadence)) {
      rows.push({
        label: 'Kadencja',
        avg: `${Math.round(activity.avgCadence)} rpm`,
        max: hasPositiveNumber(activity.maxCadence) ? `${Math.round(activity.maxCadence)} rpm` : undefined,
      });
    }

    return rows;
  }, [activity]);

  const primaryRows = statRows.slice(0, 3);
  const advancedRows = statRows.slice(3);

  return (
    <Stack spacing={2.5} sx={{ mb: 3 }}>
      <Box sx={{ ...surfaceSx, p: { xs: 2, md: 3 } }}>
        <Stack spacing={1.75}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Chip label={activity.sportType} color="primary" variant="outlined" />
            <Typography variant="body2" color="text.secondary">
              {formatStartedAt(activity.startedAt)}
            </Typography>
          </Stack>

          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {activity.name}
            </Typography>
            {activity.description ? (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 840 }}>
                {activity.description}
              </Typography>
            ) : null}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap">
            {keyMetrics.map((metric) => (
              <KeyMetric key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </Stack>
        </Stack>
      </Box>

      {hasMedia ? (
        <Box sx={{ ...surfaceSx, p: 1.25 }}>
          <ActivityMediaCarousel
            activityName={activity.name}
            geoJson={geoJson}
            photoUrls={activity.photoUrls}
            latStream={activity.latStream}
            lngStream={activity.lngStream}
            summaryPolyline={activity.summaryPolyline}
            activitySummary={{
              movingTimeSec: activity.movingTimeSec,
              distanceM: activity.distanceM,
              avgPowerW: activity.avgPowerW,
              avgHeartrate: activity.avgHeartrate,
            }}
          />
        </Box>
      ) : null}

      {primaryRows.length ? (
        <Box sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Najważniejsze metryki
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Najpierw liczby, które naprawdę pomagają ocenić jednostkę.
              </Typography>
            </Box>
            {advancedRows.length ? (
              <Button
                variant="text"
                color="primary"
                endIcon={showAdvancedStats ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowAdvancedStats((current) => !current)}
              >
                {showAdvancedStats ? 'Ukryj szczegóły' : 'Pokaż wszystkie statystyki'}
              </Button>
            ) : null}
          </Stack>

          <StatsTable rows={primaryRows} />

          {advancedRows.length ? (
            <Collapse in={showAdvancedStats} unmountOnExit>
              <Box sx={{ pt: 1 }}>
                <StatsTable rows={advancedRows} />
              </Box>
            </Collapse>
          ) : null}

          {activity.elapsedTimeSec !== activity.movingTimeSec ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, textAlign: 'right' }}>
              Czas całkowity: {formatDuration(activity.elapsedTimeSec)}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Stack>
  );
}
