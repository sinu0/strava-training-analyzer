import FlagIcon from '@mui/icons-material/Flag';
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';

import { useActiveChallenges } from '@/hooks/useChallenges';
import { STATUS_COLORS } from '@/utils/colors';

export default function ChallengeWidget() {
  const { data: challenges, isLoading } = useActiveChallenges();

  if (isLoading) return null;
  if (!challenges || challenges.length === 0) return null;

  const topChallenge = challenges[0];
  if (!topChallenge) return null;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
        <FlagIcon sx={{ fontSize: 16, color: STATUS_COLORS.warning }} />
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          Aktywne wyzwanie
        </Typography>
      </Stack>

      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
        {topChallenge.name}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={Math.min(topChallenge.progressPercent, 100)}
        sx={{
          height: 6,
          borderRadius: 3,
          mb: 0.5,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': {
            bgcolor: topChallenge.progressPercent >= 100
              ? STATUS_COLORS.success
              : STATUS_COLORS.warning,
          },
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {topChallenge.currentValue} / {topChallenge.targetValue} {topChallenge.targetUnit}
        </Typography>
        <Chip
          label={`${Math.floor(topChallenge.progressPercent)}%`}
          size="small"
          sx={{ fontSize: '0.6rem', fontWeight: 600 }}
        />
        <Typography variant="caption" color="text.secondary">
          {topChallenge.daysLeft > 0 ? `${topChallenge.daysLeft} dni` : 'Koniec'}
        </Typography>
      </Stack>
    </Box>
  );
}
