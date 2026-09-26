import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { alpha, Box, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getAppThemeTokens } from '@/theme/theme';

import { segmentComponentsMessages } from './messages';

const podium = {
  1: { nameKey: 'gold', color: 'gold' },
  2: { nameKey: 'silver', color: 'silver' },
  3: { nameKey: 'bronze', color: 'bronze' },
} as const;

export default function SegmentRankTrophy({ rank }: { rank?: number | null }) {
  const t = segmentComponentsMessages.useT();
  const theme = useTheme();
  const tokens = getAppThemeTokens(theme);
  if (rank !== 1 && rank !== 2 && rank !== 3) return null;
  const placement = podium[rank];
  const color = tokens.podium[placement.color];
  const label = t('trophy.label', { name: t(`trophy.${placement.nameKey}`), rank });

  return (
    <Tooltip title={label} arrow>
      <Box
        component="span"
        role="img"
        tabIndex={0}
        aria-label={label}
        sx={{
          width: 34,
          height: 34,
          display: 'inline-grid',
          placeItems: 'center',
          flex: '0 0 auto',
          color,
          bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.18 : 0.11),
          border: `1px solid ${alpha(color, 0.38)}`,
          borderRadius: '50%',
          '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        }}
      >
        <EmojiEventsRoundedIcon sx={{ fontSize: 22 }} />
      </Box>
    </Tooltip>
  );
}
