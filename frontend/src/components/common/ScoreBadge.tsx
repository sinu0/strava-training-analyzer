import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { DEFAULT_SCORE_SCALES, getScoreScale, type ScoreScale } from '@/utils/scoreColor';

interface ScoreBadgeProps {
  score: number;
  ranges?: ScoreScale[];
}

/**
 * Renders a score pill using the shared score color scale and label mapping.
 * Soft pill: tinted background, no outline, bold value.
 */
export default function ScoreBadge({
  score,
  ranges = DEFAULT_SCORE_SCALES,
}: ScoreBadgeProps) {
  const scale = getScoreScale(score, ranges);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: 999,
        bgcolor: alpha(scale.color, 0.12),
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 800, color: scale.color }}>
        {score}/100
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {scale.label}
      </Typography>
    </Box>
  );
}
