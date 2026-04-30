import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';

import type { ActivitySummary } from '@/types/activity';
import { STATUS_COLORS, alphaColor, getSportColor } from '@/utils/colors';
import { formatDistance, formatDuration } from '@/utils/formatters';

type RecentActivityRailProps = {
  activities: ActivitySummary[];
  onSelect: (activityId: string) => void;
};

/**
 * Horizontal film-strip of recent workouts used below the main Home hero.
 */
export default function RecentActivityRail({ activities, onSelect }: RecentActivityRailProps) {
  if (!activities.length) {
    return null;
  }

  return (
    <Box
      data-testid="recent-activity-rail"
      sx={{
        display: 'flex',
        gap: 1.25,
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        pb: 0.5,
        pr: 0.5,
        '&::-webkit-scrollbar': { height: 8 },
        '&::-webkit-scrollbar-thumb': {
          borderRadius: 999,
          bgcolor: alphaColor(STATUS_COLORS.accent, 0.28),
        },
      }}
    >
      {activities.map((activity) => {
        const sportColor = getSportColor(activity.sportType);

        return (
          <Paper
            key={activity.id}
            onClick={() => onSelect(activity.id)}
            sx={{
              minWidth: { xs: 250, sm: 280 },
              p: 1.5,
              borderRadius: 3.5,
              border: '1px solid',
              borderColor: 'divider',
              scrollSnapAlign: 'start',
              cursor: 'pointer',
              bgcolor: 'background.paper',
              backgroundImage: `linear-gradient(180deg, ${alphaColor(sportColor, 0.12)} 0%, transparent 100%)`,
              transition: 'transform 0.16s ease, border-color 0.16s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: alphaColor(sportColor, 0.36),
              },
            }}
          >
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      bgcolor: alphaColor(sportColor, 0.16),
                      color: sportColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <DirectionsBikeIcon sx={{ fontSize: 17 }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
                    {activity.name}
                  </Typography>
                </Stack>
                <Chip label={activity.sportType} size="small" variant="outlined" />
              </Stack>

              <Typography variant="caption" color="text.secondary">
                {new Date(activity.startedAt).toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Typography>

              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                <Chip label={formatDistance(activity.distanceM)} size="small" />
                <Chip label={formatDuration(activity.movingTimeSec)} size="small" />
                {activity.avgPowerW != null ? (
                  <Chip label={`${Math.round(activity.avgPowerW)} W`} size="small" />
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}
