import { Box, Paper, Typography, Stack, Chip, Alert } from '@mui/material';

import { UI_COLORS } from '../../utils/colors';

import type { RoutePreview } from '../../types/route';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}min`;
}

function formatCoverage(distance: number | null | undefined, totalDistance: number): string {
  if (!distance || totalDistance <= 0) {
    return '—';
  }
  return `${Math.round((distance / totalDistance) * 100)}%`;
}

function formatRoutingProfile(profile: string): string {
  switch (profile) {
    case 'safety':
      return 'Spokojniej / ścieżki';
    case 'shortest':
      return 'Najkrócej';
    case 'gravel':
      return 'Szuter';
    case 'trekking':
      return 'Uniwersalnie';
    case 'hillclimb':
      return 'Więcej przewyższeń';
    case 'saved-route':
      return 'Zapisana trasa';
    default:
      return profile;
  }
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}

export interface RouteStatsProps {
  totalDistance: number;
  totalGain: number;
  estimatedTimeSec: number;
  estimatedTss: number;
  routePreview: RoutePreview | null;
  routeProviderLabel: string | null;
  generationInfo: { sourceName: string } | null;
  showWeather: boolean;
  weatherStopCount: number;
  isRouting: boolean;
}

export default function RouteStats({
  totalDistance,
  totalGain,
  estimatedTimeSec,
  estimatedTss,
  routePreview,
  routeProviderLabel,
  generationInfo,
  showWeather,
  weatherStopCount,
  isRouting,
}: RouteStatsProps) {
  return (
    <Paper sx={{ p: 2, backgroundColor: UI_COLORS.backgroundDefault, border: `1px solid ${UI_COLORS.divider}` }}>
      <Typography variant="subtitle2" gutterBottom>
        Statystyki
      </Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <StatBox label="Dystans" value={`${(totalDistance / 1000).toFixed(1)} km`} />
        <StatBox label="Przewyższenie" value={`${Math.round(totalGain)} m`} />
        <StatBox label="Czas (est.)" value={formatDuration(estimatedTimeSec)} />
        <StatBox label="TSS (est.)" value={estimatedTss > 0 ? estimatedTss.toString() : '—'} />
      </Stack>
      {routePreview ? (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
          {routeProviderLabel ? (
            <Chip size="small" label={`Routing: ${routeProviderLabel}`} variant="outlined" />
          ) : null}
          {routePreview.profile ? (
            <Chip
              size="small"
              label={`Profil: ${formatRoutingProfile(routePreview.profile)}`}
              variant="outlined"
            />
          ) : null}
          <Chip
            size="small"
            label={`Asfalt ${formatCoverage(routePreview.pavedDistanceM, totalDistance)}`}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Szuter ${formatCoverage(routePreview.unpavedDistanceM, totalDistance)}`}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Infrastruktura rowerowa ${formatCoverage(routePreview.cyclewayDistanceM, totalDistance)}`}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Spokojne odcinki ${formatCoverage(routePreview.quietDistanceM, totalDistance)}`}
            variant="outlined"
          />
          {generationInfo ? (
            <Chip
              size="small"
              label={`Inspiracja: ${generationInfo.sourceName}`}
              variant="outlined"
            />
          ) : null}
        </Stack>
      ) : null}
      {!!showWeather && weatherStopCount > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Dymki pogodowe pokazują bieżące warunki dla kluczowych punktów trasy.
        </Typography>
      )}
      {routePreview?.notices?.map((notice) => (
        <Alert key={notice} severity="warning" sx={{ mt: 1 }}>
          {notice}
        </Alert>
      ))}
      {!!isRouting && (
        <Alert severity="info" sx={{ mt: 1 }} icon={false}>
          Obliczanie trasy…
        </Alert>
      )}
    </Paper>
  );
}
