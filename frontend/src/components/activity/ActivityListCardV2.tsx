import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';

import { activityMessages } from '@/components/activity/messages';
import { getLocale } from '@/i18n';
import type { ActivitySummary } from '@/types/activity';
import { StatusPill, Surface } from '@/ui';

import ActivityRoutePreview from './ActivityRoutePreview';

interface ActivityListCardV2Props {
  activity: ActivitySummary;
  onOpen: (id: string) => void;
  priority?: boolean;
}

function durationLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Stack
      direction="row"
      spacing={0.8}
      sx={{
        alignItems: "center",
        minWidth: 96
      }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', '& svg': { fontSize: 18 } }}>{icon}</Box>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 760, lineHeight: 1.2 }}>{value}</Typography>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontSize: '0.68rem'
          }}>{label}</Typography>
      </Box>
    </Stack>
  );
}

export default function ActivityListCardV2({ activity, onOpen, priority = false }: ActivityListCardV2Props) {
  const t = activityMessages.useT();
  const decimal = new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const date = new Date(activity.startedAt);
  const dateLabel = date.toLocaleDateString(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });

  return (
    <Surface
      component="article"
      padding="none"
      interactive
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(300px, 36%) minmax(0, 1fr)' },
        cursor: 'default',
      }}
    >
      <ActivityRoutePreview
        activityName={activity.name}
        summaryPolyline={activity.summaryPolyline}
        height={250}
        priority={priority}
      />

      <Box sx={{ p: { xs: 2, sm: 2.5 }, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "flex-start",
            justifyContent: "space-between"
          }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={0.8}
              useFlexGap
              sx={{
                alignItems: "center",
                flexWrap: "wrap"
              }}>
              <DirectionsBikeOutlinedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.4,
                  letterSpacing: '0.08em'
                }}>
                {dateLabel} · {timeLabel}
              </Typography>
            </Stack>
            <Typography variant="h5" component="h2" sx={{ mt: 0.6, fontWeight: 820, letterSpacing: '-0.02em' }}>
              {activity.name}
            </Typography>
          </Box>
          {activity.trainingScore != null ? (
            <StatusPill size="sm" tone="primary" variant="solid" label={`Score ${activity.trainingScore}`} />
          ) : null}
        </Stack>

        <Stack
          direction="row"
          spacing={2.2}
          useFlexGap
          sx={{
            flexWrap: "wrap",
            mt: 2.2
          }}>
          <Stat icon={<StraightenOutlinedIcon />} value={`${decimal.format(activity.distanceM / 1000)} km`} label={t('listCard.distance')} />
          <Stat icon={<TimerOutlinedIcon />} value={durationLabel(activity.movingTimeSec)} label={t('listCard.movingTime')} />
          {activity.avgPowerW != null ? <Stat icon={<BoltOutlinedIcon />} value={`${activity.avgPowerW} W`} label={t('listCard.avgPower')} /> : null}
          {activity.avgHeartrate != null ? <Stat icon={<FavoriteBorderOutlinedIcon />} value={`${activity.avgHeartrate} bpm`} label={t('listCard.avgHeartRate')} /> : null}
          {activity.avgSpeedMs != null ? <Stat icon={<SpeedOutlinedIcon />} value={`${decimal.format(activity.avgSpeedMs * 3.6)} km/h`} label={t('listCard.avgSpeed')} /> : null}
          {activity.elevationGainM != null ? <Stat icon={<LandscapeOutlinedIcon />} value={`${Math.round(activity.elevationGainM)} m`} label={t('listCard.elevationGain')} /> : null}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            mt: 'auto',
            pt: 2.2
          }}>
          {activity.primaryBenefit ? <StatusPill size="sm" variant="outline" tone="neutral" label={activity.primaryBenefit} /> : null}
          {(activity.segmentCount ?? 0) > 0 ? (
            <StatusPill
              size="sm"
              variant="outline"
              tone="neutral"
              label={`${t('listCard.segmentsCount', { count: activity.segmentCount ?? 0 })} · ${t('listCard.newRecordsCount', { count: activity.newRecordCount ?? 0 })}`}
            />
          ) : null}
          <Box sx={{ flex: 1 }} />
          <Button endIcon={<ArrowForwardRoundedIcon />} onClick={() => onOpen(activity.id)}>
            {t('listCard.openAnalysis')}
          </Button>
        </Stack>
      </Box>
    </Surface>
  );
}
