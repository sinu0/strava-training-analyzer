import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useAchievements, useEvaluateAchievements } from '../../hooks/useGamification';
import { COMMON_COLORS, STATUS_COLORS, alphaColor } from '../../utils/colors';

import type { Achievement } from '../../types/analytics';

const TYPE_LABEL: Record<string, string> = {
  DISTANCE: 'Dystans',
  STREAK: 'Seria',
  FTP: 'FTP',
  ELEVATION: 'Przewyższenie',
  CONSISTENCY: 'Regularność',
};

const BADGE_IMAGE_MAP: Record<string, string> = {
  'weekly-100km': 'badge-100km',
  'weekly-200km': 'badge-century',
  'monthly-1000km': 'badge-1000km',
  'streak-7days': 'badge-consistency',
  'streak-30days': 'badge-endurance',
  'ftp-200': 'badge-power',
  'ftp-250': 'badge-speed-demon',
  'ftp-300': 'badge-first-ride',
  'elevation-1000m': 'badge-climber',
  'elevation-10000m': 'badge-climber',
};

const TYPE_BADGE_FALLBACK: Record<string, string> = {
  DISTANCE: 'badge-100km',
  STREAK: 'badge-consistency',
  FTP: 'badge-power',
  ELEVATION: 'badge-climber',
  CONSISTENCY: 'badge-endurance',
};

function getBadgeSrc(achievement: Achievement): string | null {
  const file = BADGE_IMAGE_MAP[achievement.id] ?? TYPE_BADGE_FALLBACK[achievement.type];
  return file ? `/illustrations/${file}.png` : null;
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const unlocked = achievement.unlocked;
  const badgeSrc = getBadgeSrc(achievement);

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2">{achievement.description}</Typography>
          {!!unlocked && !!achievement.unlockedAt && (
            <Typography variant="caption" sx={{ color: alphaColor(COMMON_COLORS.white, 0.6) }}>
              Odblokowane: {achievement.unlockedAt}
            </Typography>
          )}
        </Box>
      }
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          p: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: unlocked ? 'primary.main' : 'divider',
          filter: unlocked ? 'none' : 'grayscale(100%)',
          opacity: unlocked ? 1 : 0.4,
          boxShadow: unlocked ? `0 0 12px ${alphaColor(STATUS_COLORS.info, 0.4)}` : 'none',
          transition: 'all 0.2s',
          cursor: 'default',
          textAlign: 'center',
          minWidth: 80,
        }}
        data-testid={`achievement-badge-${achievement.id}`}
        data-unlocked={unlocked}
      >
        {badgeSrc ? (
          <Box
            component="img"
            src={badgeSrc}
            alt={achievement.name}
            sx={{ width: 48, height: 48, objectFit: 'contain' }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.removeAttribute('style');
            }}
          />
        ) : null}
        <Typography
          fontSize={28}
          sx={{ display: badgeSrc ? 'none' : 'block' }}
        >
          {achievement.icon}
        </Typography>
        <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 90 }}>
          {achievement.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
          {TYPE_LABEL[achievement.type] ?? achievement.type}
        </Typography>
        {!!unlocked && !!achievement.unlockedAt && (
          <Typography variant="caption" color="primary" sx={{ fontSize: 9 }}>
            {achievement.unlockedAt}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

export default function AchievementsSection() {
  const { data: achievements, isLoading } = useAchievements();
  const { mutate: evaluate, isPending } = useEvaluateAchievements();

  if (isLoading) return <CircularProgress size={24} />;

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => evaluate()}
          disabled={isPending}
        >
          {isPending ? 'Ocenianie…' : 'Sprawdź osiągnięcia'}
        </Button>
      </Box>
      <Grid container spacing={2}>
        {(achievements ?? []).map((a) => (
          <Grid
            key={a.id}
            size={{
              xs: 6,
              sm: 4,
              md: 3,
              lg: 2
            }}>
            <AchievementBadge achievement={a} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
