import {
  FitnessCenter,
  Hotel,
  SelfImprovement,
  TrendingUp,
  Warning,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  CircularProgress,
  Fade,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import type { AdaptiveCoachResponse } from '@/types/adaptiveCoach';
import { STATUS_COLORS } from '@/utils/colors';

interface Props {
  data?: AdaptiveCoachResponse | null;
  isLoading: boolean;
}

const DECISION_META: Record<string, { icon: React.ReactElement; label: string; color: string }> = {
  TRAIN: { icon: <FitnessCenter />, label: 'Trenuj', color: STATUS_COLORS.success },
  RECOVER: { icon: <Hotel />, label: 'Regeneracja', color: STATUS_COLORS.warning },
  ACTIVE_RECOVERY: {
    icon: <SelfImprovement />,
    label: 'Aktywna regeneracja',
    color: STATUS_COLORS.info,
  },
  REST: { icon: <Hotel />, label: 'Odpoczynek', color: STATUS_COLORS.error },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: STATUS_COLORS.success,
  MODERATE: STATUS_COLORS.info,
  HARD: STATUS_COLORS.warning,
  VERY_HARD: STATUS_COLORS.error,
  MAXIMAL: STATUS_COLORS.error,
};

const PHASE_LABELS: Record<string, string> = {
  BASE: 'Baza',
  BUILD: 'Budowa',
  PEAK: 'Szczyt',
};

export default function AdaptiveCoachCard({ data, isLoading }: Props) {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Paper sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (!data) {
    return (
      <Paper sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Skonfiguruj cel i parametry aby otrzymać rekomendację</Typography>
      </Paper>
    );
  }

  const metaKey = data.decision in DECISION_META ? (data.decision as keyof typeof DECISION_META) : 'TRAIN';
  const meta = DECISION_META[metaKey]!;
  const best = data.bestSession;
  const progress = data.goalProgress;

  return (
    <Fade in timeout={600}>
      <Stack spacing={3}>
        <Paper
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'tokens.surfaceBorder',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${meta.color}22, transparent)`,
              borderBottom: '1px solid',
              borderColor: 'tokens.surfaceBorder',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ color: meta.color }}>{meta.icon}</Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {meta.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {best.description}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'tokens.surfaceBorder' }}>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Chip
                label={`${best.durationMinutes} min`}
                size="small"
                sx={{ bgcolor: 'tokens.activeOverlay' }}
              />
              <Chip
                label={`TSS ~${Math.round(best.targetTss)}`}
                size="small"
                sx={{ bgcolor: 'tokens.activeOverlay' }}
              />
              <Chip
                label={best.difficulty}
                size="small"
                sx={{
                  bgcolor: `${DIFFICULTY_COLORS[best.difficulty] || theme.tokens.chart.primary}22`,
                  color: DIFFICULTY_COLORS[best.difficulty] || theme.tokens.chart.primary,
                  fontWeight: 600,
                }}
              />
              <Chip
                label={`Typ: ${best.type}`}
                size="small"
                sx={{ bgcolor: 'tokens.activeOverlay' }}
              />
              {!!best.indoor && <Chip label="Trenażer" size="small" color="info" />}
            </Stack>
          </Box>

          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'tokens.surfaceBorder' }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Cel
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<TrendingUp />}
                label={`${progress.status === 'ON_TRACK' ? 'Na dobrej drodze' : 'Wymaga uwagi'}`}
                size="small"
                color={progress.status === 'ON_TRACK' ? 'success' : 'warning'}
              />
              <Chip
                label={`Faza: ${PHASE_LABELS[progress.phase] || progress.phase}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Postęp: ${progress.weeklyProgressRate.toFixed(1)}/tydz.`}
                size="small"
                variant="outlined"
              />
              {progress.projectedDaysToTarget < 999 && (
                <Chip
                  label={`~${Math.round(progress.projectedDaysToTarget)} dni do celu`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>

            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {progress.currentValue}
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {progress.gap > 0 ? `+${progress.gap.toFixed(0)}` : progress.gap.toFixed(0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {progress.targetValue}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (progress.currentValue / progress.targetValue) * 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'tokens.activeOverlay',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: progress.status === 'ON_TRACK'
                      ? STATUS_COLORS.success
                      : STATUS_COLORS.warning,
                  },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Wynik sesji
            </Typography>
            {!!best.scoreBreakdown && (
              <Stack spacing={1}>
                {Object.entries(best.scoreBreakdown).map(([key, value]) => (
                  <Stack key={key} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {value.toFixed(2)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </Paper>

        {data.reasoning.length > 0 && (
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Rozumowanie
            </Typography>
            {!!data.aiInterpretation && data.aiInterpretation !== 'NO_INPUT' && data.aiInterpretation !== 'NONE' && (
              <Chip
                label={`AI: ${data.aiInterpretation}`}
                size="small"
                color="primary"
                sx={{ mb: 1 }}
              />
            )}
            {data.aiInterpretation === 'NONE' && (
              <Chip
                label="AI: odebrano, bez konkretnej intencji"
                size="small"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            )}
            <Stack spacing={0.5}>
              {data.reasoning.map((reason) => (
                <Typography key={reason} variant="caption" color="text.secondary">
                  • {reason}
                </Typography>
              ))}
            </Stack>
          </Paper>
        )}

        {data.risk.level !== 'LOW' && (
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: STATUS_COLORS.warning,
              bgcolor: `${STATUS_COLORS.warning}11`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Warning sx={{ color: STATUS_COLORS.warning, fontSize: 20 }} />
              <Typography variant="body2" color="warning.main">
                {data.risk.primaryRisk}
              </Typography>
            </Stack>
          </Paper>
        )}

        {!!data.accountability && (
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Odpowiedzialność
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.accountability.message}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {data.accountability.recommendedAction}
            </Typography>
          </Paper>
        )}

        <Paper sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Insight
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.insight}
          </Typography>
        </Paper>
      </Stack>
    </Fade>
  );
}
