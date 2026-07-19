import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';

import type { ActivitySummary } from '@/types/activity';

import ActivityRoutePreview from './ActivityRoutePreview';

interface ActivityListCardV2Props {
  activity: ActivitySummary;
  onOpen: (id: string) => void;
  priority?: boolean;
}

const decimal = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function durationLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 96 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', '& svg': { fontSize: 18 } }}>{icon}</Box>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 760, lineHeight: 1.2 }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{label}</Typography>
      </Box>
    </Stack>
  );
}

export default function ActivityListCardV2({ activity, onOpen, priority = false }: ActivityListCardV2Props) {
  const date = new Date(activity.startedAt);
  const dateLabel = date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

  return (
    <Paper
      component="article"
      elevation={0}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(300px, 36%) minmax(0, 1fr)' },
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
        transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: 'rgba(255,107,53,0.38)',
          boxShadow: '0 18px 44px rgba(0,0,0,0.28)',
        },
      }}
    >
      <ActivityRoutePreview
        activityName={activity.name}
        summaryPolyline={activity.summaryPolyline}
        height={250}
        priority={priority}
      />

      <Box sx={{ p: { xs: 2, sm: 2.5 }, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.8} alignItems="center" useFlexGap flexWrap="wrap">
              <DirectionsBikeOutlinedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4, letterSpacing: '0.08em' }}>
                {dateLabel} · {timeLabel}
              </Typography>
            </Stack>
            <Typography variant="h5" component="h2" sx={{ mt: 0.6, fontWeight: 820, letterSpacing: '-0.02em' }}>
              {activity.name}
            </Typography>
          </Box>
          {activity.trainingScore != null ? (
            <Chip
              size="small"
              color="primary"
              label={`Score ${activity.trainingScore}`}
              sx={{ flexShrink: 0, fontWeight: 800 }}
            />
          ) : null}
        </Stack>

        <Stack direction="row" spacing={2.2} useFlexGap flexWrap="wrap" sx={{ mt: 2.2 }}>
          <Stat icon={<StraightenOutlinedIcon />} value={`${decimal.format(activity.distanceM / 1000)} km`} label="dystans" />
          <Stat icon={<TimerOutlinedIcon />} value={durationLabel(activity.movingTimeSec)} label="czas ruchu" />
          {activity.avgPowerW != null ? <Stat icon={<BoltOutlinedIcon />} value={`${activity.avgPowerW} W`} label="śr. moc" /> : null}
          {activity.avgHeartrate != null ? <Stat icon={<FavoriteBorderOutlinedIcon />} value={`${activity.avgHeartrate} bpm`} label="śr. tętno" /> : null}
          {activity.avgSpeedMs != null ? <Stat icon={<SpeedOutlinedIcon />} value={`${decimal.format(activity.avgSpeedMs * 3.6)} km/h`} label="śr. prędkość" /> : null}
          {activity.elevationGainM != null ? <Stat icon={<LandscapeOutlinedIcon />} value={`${Math.round(activity.elevationGainM)} m`} label="przewyższenie" /> : null}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 'auto', pt: 2.2 }}>
          {activity.primaryBenefit ? <Chip size="small" variant="outlined" label={activity.primaryBenefit} /> : null}
          <Box sx={{ flex: 1 }} />
          <Button endIcon={<ArrowForwardRoundedIcon />} onClick={() => onOpen(activity.id)}>
            Otwórz analizę
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
