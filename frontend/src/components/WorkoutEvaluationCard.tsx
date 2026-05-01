import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Typography,
  useTheme,
} from '@mui/material';
import type { WorkoutEvaluationResponse } from '@/types/evaluation';

const OUTCOME_LABELS: Record<string, string> = {
  SUCCESS: 'Bodziec trafiony',
  PARTIAL: 'Częściowo trafiony',
  FAIL: 'Nietrafiony',
  OVERACHIEVE: 'Przekroczony',
};

const OUTCOME_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  SUCCESS: 'success',
  PARTIAL: 'warning',
  FAIL: 'error',
  OVERACHIEVE: 'info',
};

const HR_LABELS: Record<string, string> = {
  LOW: 'Niska',
  OK: 'OK',
  HIGH: 'Wysoka',
};

const DRIFT_LABELS: Record<string, string> = {
  LOW: 'Niski',
  MODERATE: 'Umiarkowany',
  HIGH: 'Wysoki',
};

const STABILITY_LABELS: Record<string, string> = {
  LOW: 'Niska',
  MODERATE: 'Umiarkowana',
  HIGH: 'Wysoka',
};

const FATIGUE_LABELS: Record<string, string> = {
  LOW: 'Niskie',
  MODERATE: 'Umiarkowane',
  HIGH: 'Wysokie',
};

interface Props {
  evaluation: WorkoutEvaluationResponse;
}

export default function WorkoutEvaluationCard({ evaluation }: Props) {
  const theme = useTheme();
  const { outcome, score, confidence, reasons, analysis, contextualFactors, insight, recommendation } = evaluation;

  const outcomeColor = useScoreColor(score, theme.tokens);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Chip
            label={OUTCOME_LABELS[outcome] ?? outcome}
            color={OUTCOME_COLORS[outcome] ?? 'default'}
            size="small"
          />
          <Typography variant="h5" fontWeight={700} sx={{ color: outcomeColor }}>
            {score}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            /100
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CircularProgress
              variant="determinate"
              value={confidence * 100}
              size={22}
              thickness={5}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="caption" color="text.secondary">
              {Math.round(confidence * 100)}%
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {insight}
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
          <MetricBar label="Moc" value={analysis.powerCompliance} tokens={theme.tokens} />
          <MetricBar label="Interwały" value={analysis.intervalCompletion} tokens={theme.tokens} />
          <MetricBar label="Strefa" value={analysis.timeInZoneAccuracy} tokens={theme.tokens} />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
          <Chip label={`HR: ${HR_LABELS[analysis.hrResponse] ?? analysis.hrResponse}`} size="small" variant="outlined" />
          <Chip label={`Dryft: ${DRIFT_LABELS[analysis.fatigueDrift] ?? analysis.fatigueDrift}`} size="small" variant="outlined" />
          <Chip label={`Stabilność: ${STABILITY_LABELS[analysis.executionStability] ?? analysis.executionStability}`} size="small" variant="outlined" />
          <Chip label={`Zmęczenie: ${FATIGUE_LABELS[contextualFactors.fatigueState] ?? contextualFactors.fatigueState}`} size="small" variant="outlined" />
          {contextualFactors.recentFailures && (
            <Chip label="Powtarzające się niepowodzenia" size="small" color="error" variant="outlined" />
          )}
        </Box>

        {reasons.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            {reasons.map((reason, i) => (
              <Typography key={i} variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                • {reason}
              </Typography>
            ))}
          </Box>
        )}

        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: theme.tokens.surfaceSubtle,
            border: `1px solid ${theme.tokens.surfaceBorder}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ color: theme.tokens.status.accent, mb: 0.5 }}>
            Rekomendacja
          </Typography>
          <Typography variant="body2">{recommendation}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function MetricBar({
  label,
  value,
  tokens,
}: {
  label: string;
  value: number;
  tokens: typeof import('@/theme/theme').tokens;
}) {
  const barColor =
    value >= 85 ? tokens.status.success : value >= 65 ? tokens.status.warning : tokens.status.error;

  return (
    <Box sx={{ minWidth: 80 }}>
      <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
        {label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: tokens.chart.grid,
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            bgcolor: barColor,
          },
        }}
      />
      <Typography variant="caption" fontWeight={600} display="block" textAlign="center" mt={0.25}>
        {value}%
      </Typography>
    </Box>
  );
}

function useScoreColor(
  score: number,
  tokens: typeof import('@/theme/theme').tokens,
): string {
  if (score >= 85) return tokens.status.success;
  if (score >= 65) return tokens.status.warning;
  return tokens.status.error;
}
