import {
  Box,
  Chip,
  LinearProgress,
  Paper,
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
        <Typography variant="caption" color="text.secondary">
          Brak danych
        </Typography>
      </Box>
    );
  }
  const pct = Math.min(100, (value / 5.0) * 100);
  return (
    <Box sx={{ flex: 1, minWidth: 120 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
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
            bgcolor: 'rgba(255,255,255,0.06)',
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
          }}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
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
          bgcolor: 'rgba(255,255,255,0.04)',
          color: 'text.secondary',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
    </Tooltip>
  );
}

export default function ActivityScoreBar({ effect }: ActivityScoreBarProps) {
  const scoreColor = getTrainingScoreColor(effect.trainingScore);
  const benefitColor = BENEFIT_COLORS[effect.primaryBenefit] ?? '#58A6FF';
  const benefitLabel = BENEFIT_LABELS[effect.primaryBenefit] ?? effect.primaryBenefit;

  return (
    <Paper
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Stack spacing={1.5}>
        {/* Row 1: Training Score + Primary Benefit + Recovery */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ScoreChip score={effect.trainingScore} color={scoreColor} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: scoreColor, lineHeight: 1.1 }}>
                {getTrainingScoreLabel(effect.trainingScore)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Training Score
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={benefitLabel}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '0.75rem',
                bgcolor: `${benefitColor}22`,
                color: benefitColor,
                border: `1px solid ${benefitColor}44`,
              }}
            />
            <RecoveryChip hours={effect.recoveryTimeHours} />
          </Stack>
        </Stack>

        {/* Row 2: Aerobic + Anaerobic TE */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TeBar value={effect.aerobicTe} label={effect.aerobicLabel} color="#58A6FF" />
          <TeBar value={effect.anaerobicTe} label={effect.anaerobicLabel} color="#F85149" />
        </Stack>
      </Stack>
    </Paper>
  );
}
