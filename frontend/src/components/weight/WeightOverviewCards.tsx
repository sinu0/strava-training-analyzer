import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlagIcon from '@mui/icons-material/Flag';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ScaleIcon from '@mui/icons-material/Scale';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import Section from '@/components/common/Section';
import type { WeightGoal, WeightOverview, WeightRecord } from '@/types/weight';
import { CHART_COLORS, STATUS_COLORS, alphaColor } from '@/utils/colors';
import { WEIGHT_TREND_COLORS, getConfidenceColor } from '@/utils/statusColors';

type WeightTrend = 'down' | 'up' | 'flat';

const TREND_CONFIG = {
  down: { icon: <TrendingDownIcon />, color: WEIGHT_TREND_COLORS.down, label: 'Spadek' },
  up: { icon: <TrendingUpIcon />, color: WEIGHT_TREND_COLORS.up, label: 'Wzrost' },
  flat: { icon: <TrendingFlatIcon />, color: WEIGHT_TREND_COLORS.flat, label: 'Stabilna' },
} as const;

function getWeightTrend(history: WeightRecord[]): WeightTrend {
  if (history.length < 2) {
    return 'flat';
  }

  const current = Number(history[history.length - 1]!.weightKg);
  const previous = Number(history[history.length - 2]!.weightKg);

  if (current < previous) {
    return 'down';
  }
  if (current > previous) {
    return 'up';
  }
  return 'flat';
}

function getRecentWeightChange(history: WeightRecord[]): number | null {
  if (history.length < 2) {
    return null;
  }

  return Number(history[history.length - 1]!.weightKg) - Number(history[history.length - 2]!.weightKg);
}

function getGoalProgress(
  history: WeightRecord[],
  currentWeight: number | null,
  goal: WeightGoal | null,
): number | null {
  if (!goal || currentWeight == null || history.length === 0) {
    return null;
  }

  const startWeight = Number(history[0]!.weightKg);
  const targetWeight = Number(goal.targetWeightKg);
  const totalDifference = startWeight - targetWeight;

  if (totalDifference === 0) {
    return 100;
  }

  const progressDifference = startWeight - Number(currentWeight);
  return Math.min(100, Math.max(0, (progressDifference / totalDifference) * 100));
}

function getConfidenceStyles(confidence: string | null | undefined) {
  const color = getConfidenceColor(confidence);
  return {
    bgcolor: alphaColor(color, 0.15),
    color,
  };
}

interface WeightOverviewCardsProps {
  overview: WeightOverview | undefined;
  isDeletingGoal: boolean;
  onOpenGoalDialog: () => void;
  onDeleteGoal: () => void;
}

export default function WeightOverviewCards({
  overview,
  isDeletingGoal,
  onOpenGoalDialog,
  onDeleteGoal,
}: WeightOverviewCardsProps) {
  const currentWeight = overview?.currentWeightKg ?? null;
  const goal = overview?.goal ?? null;
  const history = overview?.history ?? [];
  const dailyCaloricNeed = overview?.dailyCaloricNeed;
  const dailyDeficit = overview?.dailyDeficitOrSurplus;
  const weeksRemaining = overview?.weeksRemaining;
  const trend = getWeightTrend(history);
  const trendInfo = TREND_CONFIG[trend];
  const recentChange = getRecentWeightChange(history);
  const goalProgress = getGoalProgress(history, currentWeight, goal);
  const dailyCaloricTarget =
    dailyCaloricNeed != null && dailyDeficit != null
      ? Math.round(Number(dailyCaloricNeed) - Number(dailyDeficit))
      : null;
  const isWeightLoss = dailyDeficit != null && Number(dailyDeficit) > 0;
  const isWeightGain = dailyDeficit != null && Number(dailyDeficit) < 0;
  const confidenceStyles = getConfidenceStyles(overview?.dataConfidence);

  return (
    <>
      <Grid item xs={12} md={4}>
        <Section title="Aktualna waga">
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  bgcolor: alphaColor(CHART_COLORS.secondary, 0.12),
                  border: `1px solid ${alphaColor(CHART_COLORS.secondary, 0.3)}`,
                }}
              >
                <ScaleIcon sx={{ fontSize: 44, color: CHART_COLORS.secondary }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: CHART_COLORS.secondary }}>
                {currentWeight != null ? Number(currentWeight).toFixed(1) : '—'}
              </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              kg
            </Typography>
            <Chip
              icon={trendInfo.icon}
              label={trendInfo.label}
              size="small"
              sx={{
                bgcolor: `${trendInfo.color}20`,
                color: trendInfo.color,
                fontWeight: 600,
                '& .MuiChip-icon': { color: trendInfo.color },
              }}
            />
            {recentChange != null && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: trendInfo.color }}>
                {`${recentChange > 0 ? '+' : ''}${recentChange.toFixed(1)} kg od ostatniego pomiaru`}
              </Typography>
            )}
          </Box>
        </Section>
      </Grid>

      <Grid item xs={12} md={4}>
        <Section
          title="Cel wagowy"
          action={goal ? (
            <Tooltip title="Usuń cel">
              <Box component="span">
                <IconButton size="small" disabled={isDeletingGoal} onClick={onDeleteGoal}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Tooltip>
          ) : undefined}
        >
          {goal ? (
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  bgcolor: alphaColor(CHART_COLORS.primary, 0.12),
                  border: `1px solid ${alphaColor(CHART_COLORS.primary, 0.3)}`,
                }}
              >
                <FlagIcon sx={{ fontSize: 44, color: CHART_COLORS.primary }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: CHART_COLORS.primary }}>
                {Number(goal.targetWeightKg).toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                kg do {new Date(goal.targetDate).toLocaleDateString('pl-PL')}
              </Typography>
              {weeksRemaining != null && (
                <Chip
                  icon={<CalendarMonthIcon />}
                  label={`${Number(weeksRemaining).toFixed(0)} tyg. pozostało`}
                  size="small"
                  sx={{
                    bgcolor: alphaColor(STATUS_COLORS.info, 0.12),
                    color: STATUS_COLORS.info,
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: STATUS_COLORS.info },
                  }}
                />
              )}
              {goalProgress != null && (
                <Box sx={{ mt: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography variant="caption" color="text.secondary">
                      Postęp
                    </Typography>
                    <Typography variant="caption" sx={{ color: CHART_COLORS.primary, fontWeight: 700 }}>
                      {goalProgress.toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={goalProgress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: CHART_COLORS.surface,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: CHART_COLORS.primary,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="text.secondary" variant="body2">
                Brak celu wagowego
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FlagIcon />}
                onClick={onOpenGoalDialog}
                sx={{ mt: 1 }}
              >
                Ustaw cel
              </Button>
            </Box>
          )}
        </Section>
      </Grid>

      <Grid item xs={12} md={4}>
        <Section title="Zapotrzebowanie kaloryczne">
          {dailyCaloricNeed != null && goal ? (
            <Box sx={{ py: 1 }}>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 0.75,
                    px: 1,
                    borderRadius: 1.5,
                    bgcolor: alphaColor(STATUS_COLORS.info, 0.08),
                    border: `1px solid ${alphaColor(STATUS_COLORS.info, 0.2)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.25 }}>
                    <LocalFireDepartmentIcon sx={{ fontSize: 16, color: STATUS_COLORS.info }} />
                    <Typography variant="caption" sx={{ color: STATUS_COLORS.info, fontWeight: 600 }}>
                      TDEE (bazowe)
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: STATUS_COLORS.info }}>
                    {Math.round(Number(dailyCaloricNeed))} kcal
                  </Typography>
                </Box>

                {dailyDeficit != null && (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 0.75,
                      px: 1,
                      borderRadius: 1.5,
                      bgcolor: alphaColor(
                        isWeightLoss ? STATUS_COLORS.success : STATUS_COLORS.error,
                        0.08,
                      ),
                      border: `1px solid ${
                        alphaColor(isWeightLoss ? STATUS_COLORS.success : STATUS_COLORS.error, 0.2)
                      }`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: isWeightLoss ? STATUS_COLORS.success : STATUS_COLORS.error,
                        fontWeight: 600,
                      }}
                    >
                      {isWeightLoss
                        ? 'Dzienny deficyt'
                        : isWeightGain
                          ? 'Dzienna nadwyżka'
                          : 'Utrzymanie'}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: isWeightLoss ? STATUS_COLORS.success : STATUS_COLORS.error,
                      }}
                    >
                      {Math.abs(Math.round(Number(dailyDeficit)))} kcal
                    </Typography>
                  </Box>
                )}

                {dailyCaloricTarget != null && (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 0.75,
                      px: 1,
                      borderRadius: 1.5,
                      bgcolor: alphaColor(CHART_COLORS.primary, 0.12),
                      border: `1px solid ${alphaColor(CHART_COLORS.primary, 0.3)}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.25 }}>
                      <RestaurantIcon sx={{ fontSize: 16, color: CHART_COLORS.primary }} />
                      <Typography variant="caption" sx={{ color: CHART_COLORS.primary, fontWeight: 600 }}>
                        Docelowe spożycie
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: CHART_COLORS.primary }}>
                      {dailyCaloricTarget} kcal
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      dziennie, aby osiągnąć cel
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="text.secondary" variant="body2">
                {currentWeight == null
                  ? 'Dodaj wagę, aby obliczyć zapotrzebowanie'
                  : 'Ustaw cel wagowy, aby obliczyć zapotrzebowanie'}
              </Typography>
            </Box>
          )}
        </Section>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Section title="Kalorie z treningów (7 dni)">
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: STATUS_COLORS.warning }}>
              {overview?.weeklyTrainingCalories != null
                ? Math.round(Number(overview.weeklyTrainingCalories))
                : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              kcal / tydzień
            </Typography>
          </Box>
        </Section>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Section title="Zalecane spożycie">
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: STATUS_COLORS.success }}>
              {overview?.recommendedDailyCalories != null
                ? Math.round(Number(overview.recommendedDailyCalories))
                : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              kcal / dzień
            </Typography>
          </Box>
        </Section>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Section title="Tygodniowa zmiana wagi">
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              {overview?.weeklyWeightChange != null && Number(overview.weeklyWeightChange) < 0 ? (
                <TrendingDownIcon sx={{ color: WEIGHT_TREND_COLORS.down }} />
              ) : overview?.weeklyWeightChange != null && Number(overview.weeklyWeightChange) > 0 ? (
                <TrendingUpIcon sx={{ color: WEIGHT_TREND_COLORS.up }} />
              ) : (
                <TrendingFlatIcon sx={{ color: WEIGHT_TREND_COLORS.flat }} />
              )}
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {overview?.weeklyWeightChange != null
                  ? `${Number(overview.weeklyWeightChange) > 0 ? '+' : ''}${Number(
                      overview.weeklyWeightChange,
                    ).toFixed(2)}`
                  : '—'}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              kg / tydzień
            </Typography>
          </Box>
        </Section>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Section title="Pewność modelu">
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Chip
              label={overview?.dataConfidence ?? 'niski'}
              sx={{
                ...confidenceStyles,
                fontWeight: 700,
                fontSize: '1rem',
                height: 36,
              }}
            />
          </Box>
        </Section>
      </Grid>
    </>
  );
}
