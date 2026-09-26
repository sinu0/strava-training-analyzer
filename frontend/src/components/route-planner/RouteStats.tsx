import { Box, Typography, Stack, Chip, Alert } from '@mui/material';

import { Surface } from '@/ui';

import { routePlannerControlsMessages } from './messages';
import { getAppThemeTokens } from '../../theme/theme';


import type { RoutePreview } from '../../types/route';

type Translator = ReturnType<typeof routePlannerControlsMessages.useT>;

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

function formatRoutingProfile(profile: string, t: Translator): string {
  switch (profile) {
    case 'safety':
      return t('routingProfile.safety');
    case 'shortest':
      return t('routingProfile.shortest');
    case 'gravel':
      return t('routingProfile.gravel');
    case 'trekking':
      return t('routingProfile.trekking');
    case 'hillclimb':
      return t('routingProfile.hillclimb');
    case 'saved-route':
      return t('routingProfile.savedRoute');
    default:
      return profile;
  }
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{
        color: "text.secondary"
      }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: (theme) => getAppThemeTokens(theme).type.weight.label }}>
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
  const t = routePlannerControlsMessages.useT();
  return (
    <Surface>
      <Typography variant="subtitle2" gutterBottom>
        {t('stats.title')}
      </Typography>
      <Stack direction="row" spacing={2} sx={{
        flexWrap: "wrap"
      }}>
        <StatBox label={t('stats.distance')} value={`${(totalDistance / 1000).toFixed(1)} km`} />
        <StatBox label={t('stats.elevationGain')} value={`${Math.round(totalGain)} m`} />
        <StatBox label={t('stats.estimatedTime')} value={formatDuration(estimatedTimeSec)} />
        <StatBox label={t('stats.estimatedTss')} value={estimatedTss > 0 ? estimatedTss.toString() : '—'} />
      </Stack>
      {routePreview ? (
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{
            flexWrap: "wrap",
            mt: 1.5
          }}>
          {routeProviderLabel ? (
            <Chip size="small" label={t('stats.routingChip', { label: routeProviderLabel })} variant="outlined" />
          ) : null}
          {routePreview.profile ? (
            <Chip
              size="small"
              label={t('stats.profileChip', { label: formatRoutingProfile(routePreview.profile, t) })}
              variant="outlined"
            />
          ) : null}
          <Chip
            size="small"
            label={t('stats.pavedChip', { value: formatCoverage(routePreview.pavedDistanceM, totalDistance) })}
            variant="outlined"
          />
          <Chip
            size="small"
            label={t('stats.unpavedChip', { value: formatCoverage(routePreview.unpavedDistanceM, totalDistance) })}
            variant="outlined"
          />
          <Chip
            size="small"
            label={t('stats.cyclewayChip', { value: formatCoverage(routePreview.cyclewayDistanceM, totalDistance) })}
            variant="outlined"
          />
          <Chip
            size="small"
            label={t('stats.quietChip', { value: formatCoverage(routePreview.quietDistanceM, totalDistance) })}
            variant="outlined"
          />
          {generationInfo ? (
            <Chip
              size="small"
              label={t('stats.inspirationChip', { name: generationInfo.sourceName })}
              variant="outlined"
            />
          ) : null}
        </Stack>
      ) : null}
      {!!showWeather && weatherStopCount > 0 && (
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            mt: 1,
            display: 'block'
          }}>
          {t('stats.weatherHint')}
        </Typography>
      )}
      {routePreview?.notices?.map((notice) => (
        <Alert key={notice} severity="warning" sx={{ mt: 1 }}>
          {notice}
        </Alert>
      ))}
      {!!isRouting && (
        <Alert severity="info" sx={{ mt: 1 }} icon={false}>
          {t('stats.calculating')}
        </Alert>
      )}
    </Surface>
  );
}
