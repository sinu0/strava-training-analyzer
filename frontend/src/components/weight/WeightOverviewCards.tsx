import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
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

import { weightMessages } from '@/components/weight/messages';
import { getLocale } from '@/i18n';
import type { WeightGoal, WeightOverview, WeightRecord } from '@/types/weight';
import { Widget } from '@/ui';
import { CHART_COLORS, STATUS_COLORS, alphaColor } from '@/utils/colors';
import { WEIGHT_TREND_COLORS, getConfidenceColor } from '@/utils/statusColors';

type WeightTrend = 'down' | 'up' | 'flat';

/** Backend sends Polish confidence levels; map them to message keys. */
const CONFIDENCE_KEYS: Record<string, 'low' | 'medium' | 'high'> = { niski: 'low', 'średni': 'medium', wysoki: 'high' };

function useTrendConfig() {
  const t = weightMessages.useT();
  return {
    down: { icon: <TrendingDownIcon />, color: WEIGHT_TREND_COLORS.down, label: t('overview.trendDown') },
    up: { icon: <TrendingUpIcon />, color: WEIGHT_TREND_COLORS.up, label: t('overview.trendUp') },
    flat: { icon: <TrendingFlatIcon />, color: WEIGHT_TREND_COLORS.flat, label: t('overview.trendFlat') },
  } as const;
}

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
  const t = weightMessages.useT();
  const currentWeight = overview?.currentWeightKg ?? null;
  const goal = overview?.goal ?? null;
  const history = overview?.history ?? [];
  const dailyCaloricNeed = overview?.dailyCaloricNeed;
  const dailyDeficit = overview?.dailyDeficitOrSurplus;
  const weeksRemaining = overview?.weeksRemaining;
  const trend = getWeightTrend(history);
  const trendInfo = useTrendConfig()[trend];
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
      <Grid
        size={{
          xs: 12,
          md: 4
        }}>
        <Widget title={t('overview.currentWeight')}>
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
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 1
              }}>
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
                {t('overview.recentChange', { sign: recentChange > 0 ? '+' : '', value: recentChange.toFixed(1) })}
              </Typography>
            )}
          </Box>
        </Widget>
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 4
        }}>
        <Widget
          title={t('overview.weightGoal')}
          action={goal ? (
            <Tooltip title={t('overview.deleteGoal')}>
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
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mb: 1
                }}>
                {t('overview.goalUntil', { date: new Date(goal.targetDate).toLocaleDateString(getLocale()) })}
              </Typography>
              {weeksRemaining != null && (
                <Chip
                  icon={<CalendarMonthIcon />}
                  label={t('overview.weeksRemaining', { count: Number(weeksRemaining).toFixed(0) })}
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
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      {t('overview.goalProgress')}
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
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {t('overview.noGoal')}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FlagIcon />}
                onClick={onOpenGoalDialog}
                sx={{ mt: 1 }}
              >
                {t('overview.setGoal')}
              </Button>
            </Box>
          )}
        </Widget>
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 4
        }}>
        <Widget title={t('overview.caloricNeed')}>
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
                      {t('overview.tdee')}
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
                        ? t('overview.dailyDeficit')
                        : isWeightGain
                          ? t('overview.dailySurplus')
                          : t('overview.maintenance')}
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
                        {t('overview.targetIntake')}
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: CHART_COLORS.primary }}>
                      {dailyCaloricTarget} kcal
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      {t('overview.targetIntakeHint')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {currentWeight == null
                  ? t('overview.addWeightHint')
                  : t('overview.setGoalHint')}
              </Typography>
            </Box>
          )}
        </Widget>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3
        }}>
        <Widget title={t('overview.trainingCalories')}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: STATUS_COLORS.warning }}>
              {overview?.weeklyTrainingCalories != null
                ? Math.round(Number(overview.weeklyTrainingCalories))
                : '—'}
            </Typography>
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>
              {t('overview.perWeek')}
            </Typography>
          </Box>
        </Widget>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3
        }}>
        <Widget title={t('overview.recommendedIntake')}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: STATUS_COLORS.success }}>
              {overview?.recommendedDailyCalories != null
                ? Math.round(Number(overview.recommendedDailyCalories))
                : '—'}
            </Typography>
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>
              {t('overview.perDay')}
            </Typography>
          </Box>
        </Widget>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3
        }}>
        <Widget title={t('overview.weeklyWeightChange')}>
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
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>
              {t('overview.kgPerWeek')}
            </Typography>
          </Box>
        </Widget>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3
        }}>
        <Widget title={t('overview.modelConfidence')}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Chip
              label={t(`overview.confidence.${CONFIDENCE_KEYS[overview?.dataConfidence ?? 'niski'] ?? 'low'}`)}
              sx={{
                ...confidenceStyles,
                fontWeight: 700,
                fontSize: '1rem',
                height: 36,
              }}
            />
          </Box>
        </Widget>
      </Grid>
    </>
  );
}
