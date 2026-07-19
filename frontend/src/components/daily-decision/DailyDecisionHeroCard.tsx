import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HomeIcon from '@mui/icons-material/Home';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Fade,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import type { DailyDecisionDto } from '@/types/dailyDecision';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';

interface Props {
  decision: DailyDecisionDto | undefined;
  isLoading: boolean;
  onStartWorkout?: () => void;
  onSkip?: () => void;
}

const DECISION_META: Record<string, {
  icon: React.ReactNode;
  label: string;
  color: string;
  gradient: string;
}> = {
  RIDE: {
    icon: <DirectionsBikeIcon fontSize="large" />,
    label: 'Jedź!',
    color: STATUS_COLORS.success,
    gradient: `linear-gradient(135deg, ${alphaColor(STATUS_COLORS.success, 0.15)}, ${alphaColor(STATUS_COLORS.success, 0.04)})`,
  },
  MODIFY: {
    icon: <AutoAwesomeIcon fontSize="large" />,
    label: 'Zmodyfikowany',
    color: STATUS_COLORS.warning,
    gradient: `linear-gradient(135deg, ${alphaColor(STATUS_COLORS.warning, 0.15)}, ${alphaColor(STATUS_COLORS.warning, 0.04)})`,
  },
  SKIP: {
    icon: <SelfImprovementIcon fontSize="large" />,
    label: 'Odpoczynek',
    color: STATUS_COLORS.error,
    gradient: `linear-gradient(135deg, ${alphaColor(STATUS_COLORS.error, 0.12)}, ${alphaColor(STATUS_COLORS.error, 0.03)})`,
  },
  INDOOR: {
    icon: <HomeIcon fontSize="large" />,
    label: 'Trenażer',
    color: STATUS_COLORS.info,
    gradient: `linear-gradient(135deg, ${alphaColor(STATUS_COLORS.info, 0.15)}, ${alphaColor(STATUS_COLORS.info, 0.04)})`,
  },
};

const RISK_COLORS: Record<string, string> = {
  LOW: STATUS_COLORS.success,
  MODERATE: STATUS_COLORS.warning,
  HIGH: STATUS_COLORS.error,
  CRITICAL: STATUS_COLORS.error,
};

export default function DailyDecisionHeroCard({
  decision,
  isLoading,
  onStartWorkout,
  onSkip,
}: Props) {
  if (isLoading) {
    return (
      <Paper
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          p: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            Analizuję dane...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (!decision) {
    return (
      <Paper
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          p: 4,
        }}
      >
        <Stack spacing={1} alignItems="center">
          <Typography variant="h5" color="text.secondary">
            Brak danych decyzyjnych
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Zsynchronizuj dane treningowe, aby otrzymać rekomendację na dziś.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  const meta = (DECISION_META[decision.decision] ?? DECISION_META['MODIFY'])!;
  const riskColor = RISK_COLORS[decision.risk] ?? STATUS_COLORS.neutral;
  const confidenceColor =
    decision.confidence.score >= 0.7
      ? STATUS_COLORS.success
      : decision.confidence.score >= 0.4
        ? STATUS_COLORS.warning
        : STATUS_COLORS.error;

  return (
    <Fade in timeout={600}>
      <Paper
        sx={{
          borderRadius: 4,
          border: `1px solid ${alphaColor(meta.color, 0.3)}`,
          background: meta.gradient,
          overflow: 'hidden',
        }}
      >
        <Stack spacing={0}>
          {/* Hero Header */}
          <Box
            sx={{
              p: { xs: 2.5, md: 3 },
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              borderBottom: `1px solid ${alphaColor(meta.color, 0.15)}`,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: alphaColor(meta.color, 0.18),
                color: meta.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {meta.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{ color: 'text.secondary', letterSpacing: '0.1em', fontWeight: 800 }}
              >
                Decyzja na dziś
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.1, mt: 0.25 }}>
                {meta.label}
              </Typography>
              {decision.workout.type !== 'REST' && (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                  {decision.workout.description}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Confidence + Risk badges */}
          <Box
            sx={{
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              gap: 1.5,
              flexWrap: 'wrap',
              borderBottom: `1px solid ${alphaColor(meta.color, 0.1)}`,
            }}
          >
            <Chip
              size="small"
              icon={<AutoAwesomeIcon />}
              label={`Pewność: ${Math.round(decision.confidence.score * 100)}%`}
              sx={{
                bgcolor: alphaColor(confidenceColor, 0.12),
                color: confidenceColor,
                borderColor: alphaColor(confidenceColor, 0.3),
                fontWeight: 700,
              }}
              variant="outlined"
            />
            <Chip
              size="small"
              icon={<WarningAmberIcon />}
              label={`Ryzyko: ${decision.risk}`}
              sx={{
                bgcolor: alphaColor(riskColor, 0.12),
                color: riskColor,
                borderColor: alphaColor(riskColor, 0.3),
                fontWeight: 700,
              }}
              variant="outlined"
            />
          </Box>

          {/* Workout details */}
          {decision.workout.type !== 'REST' && (
            <Box
              sx={{
                p: { xs: 1.5, md: 2 },
                display: 'flex',
                gap: 1.5,
                flexWrap: 'wrap',
                borderBottom: `1px solid ${alphaColor(meta.color, 0.08)}`,
              }}
            >
              <Chip
                size="small"
                icon={<FitnessCenterIcon />}
                label={`${decision.workout.type}`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={`${decision.workout.durationMin} min`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={`TSS ${decision.workout.targetTss}`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={decision.workout.difficulty}
                variant="outlined"
                sx={{
                  bgcolor: alphaColor(STATUS_COLORS.warning, 0.08),
                  borderColor: alphaColor(STATUS_COLORS.warning, 0.3),
                }}
              />
            </Box>
          )}

          {/* CTA Buttons */}
          <Box
            sx={{
              p: { xs: 2, md: 2.5 },
              display: 'flex',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            {decision.decision !== 'SKIP' && !!onStartWorkout && (
              <Button
                variant="contained"
                size="large"
                startIcon={<DirectionsBikeIcon />}
                onClick={onStartWorkout}
                sx={{
                  background: `linear-gradient(135deg, ${meta.color}, ${alphaColor(meta.color, 0.7)})`,
                  fontWeight: 800,
                  px: 3,
                }}
              >
                Rozpocznij trening
              </Button>
            )}

            {!!onSkip && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<RestartAltIcon />}
                onClick={onSkip}
                color="inherit"
              >
                Pomiń / Przełóż
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>
    </Fade>
  );
}
