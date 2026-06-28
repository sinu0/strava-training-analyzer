import {
  Bolt,
  BatteryAlert,
  FitnessCenter,
  TrendingUp,
  Warning,
  EmojiEvents,
  AutoAwesome,
  Speed,
  Restaurant,
  Bedtime,
  Healing,
  Timeline,
} from '@mui/icons-material';
import { Box, Typography, Tooltip, Paper } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

import {
  PREDICTION_TYPE_V2_LABELS,
  PREDICTION_TYPE_V2_DESCRIPTIONS,
  PREDICTION_TYPE_V2_COLORS,
  type PredictionTypeV2,
} from '@/types/aiV2';
import { alphaColor } from '@/utils/colors';

const ICON_MAP: Record<string, SvgIconComponent> = {
  BoltIcon: Bolt,
  BatteryAlertIcon: BatteryAlert,
  FitnessCenterIcon: FitnessCenter,
  TrendingUpIcon: TrendingUp,
  WarningIcon: Warning,
  EmojiEventsIcon: EmojiEvents,
  AutoAwesomeIcon: AutoAwesome,
  SpeedIcon: Speed,
  RestaurantIcon: Restaurant,
  BedtimeIcon: Bedtime,
  HealingIcon: Healing,
  TimelineIcon: Timeline,
};

import { PREDICTION_TYPE_V2_ICONS } from '@/types/aiV2';

const ALL_TYPES: PredictionTypeV2[] = [
  'FTP_PREDICTION',
  'FATIGUE_PREDICTION',
  'TRAINING_TYPE_RECOMMENDATION',
  'PERFORMANCE_TREND',
  'OVERTRAINING_RISK',
  'RACE_READINESS',
  'TRAINING_COACH_SUMMARY',
  'RACE_PACING_STRATEGY',
  'NUTRITION_PLAN',
  'RECOVERY_PLAN',
  'INJURY_RISK',
  'PEAK_TIMING',
];

interface PredictionTypeGridProps {
  selected: PredictionTypeV2 | null;
  onSelect: (type: PredictionTypeV2) => void;
  disabled?: boolean;
}

export default function PredictionTypeGrid({
  selected,
  onSelect,
  disabled,
}: PredictionTypeGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
        },
        gap: 1.5,
      }}
    >
      {ALL_TYPES.map((type) => {
        const isSelected = selected === type;
        const color = PREDICTION_TYPE_V2_COLORS[type];
        const label = PREDICTION_TYPE_V2_LABELS[type];
        const description = PREDICTION_TYPE_V2_DESCRIPTIONS[type];
        const iconName = PREDICTION_TYPE_V2_ICONS[type];
        const Icon = ICON_MAP[iconName] ?? AutoAwesome;

        return (
          <Tooltip key={type} title={description} arrow placement="top">
            <Paper
              onClick={() => !disabled && onSelect(type)}
              sx={{
                p: 2,
                cursor: disabled ? 'default' : 'pointer',
                borderRadius: 2,
                border: '2px solid',
                borderColor: isSelected ? color : 'divider',
                bgcolor: isSelected ? alphaColor(color, 0.1) : 'background.paper',
                opacity: disabled ? 0.5 : 1,
                transition: (t) => t.tokens?.transition ?? 'all 0.2s ease',
                '&:hover': disabled
                  ? {}
                  : {
                      borderColor: color,
                      bgcolor: alphaColor(color, 0.08),
                      transform: 'translateY(-1px)',
                    },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                textAlign: 'center',
              }}
            >
              <Icon sx={{ color, fontSize: 28 }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  lineHeight: 1.2,
                  color: isSelected ? color : 'text.primary',
                }}
              >
                {label}
              </Typography>
            </Paper>
          </Tooltip>
        );
      })}
    </Box>
  );
}
