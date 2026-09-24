import {
  Box,
  Chip,
  LinearProgress,
  Stack,
  SvgIcon,
  Tooltip,
  Typography,
} from '@mui/material';

import type { ActivityTrainingEffect } from '@/types/trainingEffect';
import {
  BENEFIT_COLORS,
  BENEFIT_LABELS,
  getTrainingScoreColor,
  getTrainingScoreLabel,
} from '@/types/trainingEffect';
import { StatusPill, Surface } from '@/ui';

interface ActivityScoreBarProps {
  effect: ActivityTrainingEffect;
}

function ScoreChip({ score, color }: { score: number; color: string }) {
  return (
    <Chip
      label={score}
      size="small"
      sx={{
        fontWeight: 800,
        fontSize: '0.85rem',
        bgcolor: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        minWidth: 40,
      }}
    />
  );
}

function TeBar({ value, label, color }: { value: number | null; label: string | null; color: string }) {
  if (value == null) {
    return (
      <Box sx={{ flex: 1, minWidth: 120 }}>
        <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>
          Brak danych
        </Typography>
      </Box>
    );
  }
  const pct = Math.min(100, (value / 5.0) * 100);
  return (
    <Box sx={{ flex: 1, minWidth: 120 }}>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          alignItems: "center",
          mb: 0.25
        }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color }}>
          {value.toFixed(1)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            bgcolor: (theme) => theme.tokens.trackBg,
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
          }}
        />
      </Stack>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontSize: '0.65rem'
        }}>
        {label ?? '-'}
      </Typography>
    </Box>
  );
}

function RecoveryChip({ hours }: { hours: number }) {
  const now = new Date();
  const recoveryEnd = new Date(now.getTime() + hours * 3600000);
  const isToday = recoveryEnd.toDateString() === now.toDateString();
  const timeStr = recoveryEnd.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const label = isToday
    ? `Dziś ${timeStr}`
    : `${recoveryEnd.toLocaleDateString('pl-PL', { weekday: 'long' })} ${timeStr}`;

  return (
    <Tooltip title={`Zalecany odpoczynek ${hours}h — kolejny ciężki trening od ${label}`} arrow>
      <Chip
        icon={
          <SvgIcon fontSize="small">
            <path
              d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
              fill="currentColor"
            />
          </SvgIcon>
        }
        label={`Odpoczynek ${hours}h`}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.75rem',
          bgcolor: (theme) => theme.tokens.iconBubble,
          color: 'text.secondary',
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
    </Tooltip>
  );
}

export default function ActivityScoreBar({ effect }: ActivityScoreBarProps) {
  const scoreColor = getTrainingScoreColor(effect.trainingScore);
  const benefitColor = BENEFIT_COLORS[effect.primaryBenefit] ?? BENEFIT_COLORS.ENDURANCE ?? scoreColor;
  const benefitLabel = BENEFIT_LABELS[effect.primaryBenefit] ?? effect.primaryBenefit;

  return (
    <Surface variant="muted" padding="sm" radius="panel">
      <Stack spacing={1.5}>
        {/* Row 1: Training Score + Primary Benefit + Recovery */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            alignItems: { sm: 'center' },
            justifyContent: "space-between"
          }}>
          <Stack direction="row" spacing={1.5} sx={{
            alignItems: "center"
          }}>
            <ScoreChip score={effect.trainingScore} color={scoreColor} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: scoreColor, lineHeight: 1.1 }}>
                {getTrainingScoreLabel(effect.trainingScore)}
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Training Score
                {effect.qualityScore != null && (
                  <Box component="span" sx={{ color: 'success.main', ml: 1, fontWeight: 700 }}>
                    · Quality {effect.qualityScore}
                  </Box>
                )}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{
            alignItems: "center"
          }}>
            <StatusPill size="sm" label={benefitLabel} color={benefitColor} />
            <RecoveryChip hours={effect.recoveryTimeHours} />
          </Stack>
        </Stack>

        {/* Row 2: Aerobic + Anaerobic TE */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TeBar value={effect.aerobicTe} label={effect.aerobicLabel} color={BENEFIT_COLORS.ENDURANCE ?? scoreColor} />
          <TeBar value={effect.anaerobicTe} label={effect.anaerobicLabel} color={BENEFIT_COLORS.VO2MAX ?? scoreColor} />
        </Stack>
      </Stack>
    </Surface>
  );
}
