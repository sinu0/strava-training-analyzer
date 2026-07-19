import {
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import type { ActivityTrainingEffect } from '@/types/trainingEffect';
import {
  BENEFIT_COLORS,
  BENEFIT_LABELS,
  getTrainingScoreColor,
  getTrainingScoreLabel,
} from '@/types/trainingEffect';

interface ActivityScoreTabProps {
  effect: ActivityTrainingEffect;
}

function ScoreRing({ score, color, label }: { score: number; color: string; label: string }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={score}
        size={80}
        thickness={6}
        sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 900, color, lineHeight: 1, fontSize: '1.1rem' }}>
          {score}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', mt: 0.2 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

function TeDetail({
  value,
  label,
  subLabel,
  color,
}: {
  value: number | null;
  label: string;
  subLabel?: string;
  color: string;
}) {
  if (value == null) {
    return (
      <Paper sx={{ p: 2, borderRadius: 2, flex: 1, minWidth: 160, bgcolor: 'rgba(255,255,255,0.02)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Brak danych
        </Typography>
      </Paper>
    );
  }

  const pct = Math.min(100, (value / 5.0) * 100);
  return (
    <Paper sx={{ p: 2, borderRadius: 2, flex: 1, minWidth: 160, bgcolor: 'rgba(255,255,255,0.02)' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Typography variant="h5" sx={{ fontWeight: 900, color, lineHeight: 1 }}>
          {value.toFixed(1)}
        </Typography>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
            {subLabel}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function ActivityScoreTab({ effect }: ActivityScoreTabProps) {
  const scoreColor = getTrainingScoreColor(effect.trainingScore);
  const benefitColor = BENEFIT_COLORS[effect.primaryBenefit] ?? '#58A6FF';
  const benefitLabel = BENEFIT_LABELS[effect.primaryBenefit] ?? effect.primaryBenefit;

  const recoveryEnd = new Date(
    new Date(effect.calculatedAt).getTime() + effect.recoveryTimeHours * 3600000,
  );

  const dataQualityHint =
    effect.dataQuality === 'BOTH'
      ? 'Dane z mocy i tętna'
      : effect.dataQuality === 'POWER_ONLY'
        ? 'Dane tylko z mocy'
        : effect.dataQuality === 'HR_ONLY'
          ? 'Dane tylko z tętna'
          : 'Dane szacowane';

  return (
    <Stack spacing={2.5}>
      {/* Score overview */}
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
          <ScoreRing score={effect.trainingScore} color={scoreColor} label="SCORE" />

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: scoreColor, mb: 0.5 }}>
              {getTrainingScoreLabel(effect.trainingScore)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Główny efekt: <strong style={{ color: benefitColor }}>{benefitLabel}</strong>
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`Odpoczynek: ${effect.recoveryTimeHours}h`}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
              />
              <Chip
                label={dataQualityHint}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              {!!effect.secondaryBenefit && (
                <Chip
                  label={`Wtórny: ${BENEFIT_LABELS[effect.secondaryBenefit] ?? effect.secondaryBenefit}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', color: BENEFIT_COLORS[effect.secondaryBenefit] ?? undefined }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Training Effect details */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TeDetail
          value={effect.aerobicTe}
          label="Aerobowy"
          subLabel={effect.aerobicLabel ?? ''}
          color="#58A6FF"
        />
        <TeDetail
          value={effect.anaerobicTe}
          label="Beztlenowy"
          subLabel={effect.anaerobicLabel ?? ''}
          color="#F85149"
        />
      </Stack>

      {/* Recovery */}
      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Regeneracja
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Zalecany odpoczynek: <strong>{effect.recoveryTimeHours}h</strong>.
          Kolejny ciężki trening możliwy od{' '}
          {recoveryEnd.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}{' '}
          o {recoveryEnd.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}.
        </Typography>
      </Paper>
    </Stack>
  );
}
