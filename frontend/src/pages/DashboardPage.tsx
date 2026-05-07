import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BarChartIcon from '@mui/icons-material/BarChart';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import ActivityMediaCarousel from '@/components/ActivityMediaCarousel';
import AiTipsCarousel from '@/components/AiTipsCarousel';
import AlternativesPanel from '@/components/daily-decision/AlternativesPanel';
import DailyDecisionHeroCard from '@/components/daily-decision/DailyDecisionHeroCard';
import ReasoningPanel from '@/components/daily-decision/ReasoningPanel';
import DailyCheckInWidget from '@/components/home/DailyCheckInWidget';
import PageContainer from '@/components/common/PageContainer';
import TrainingLoadMiniChart from '@/components/TrainingLoadMiniChart';
import BlockMiniWidget from '@/components/home/BlockMiniWidget';
import EnergyBudgetWidget from '@/components/home/EnergyBudgetWidget';
import EventCountdownWidget from '@/components/home/EventCountdownWidget';
import FatigueWidget from '@/components/home/FatigueWidget';
import ProgressMiniWidget from '@/components/home/ProgressMiniWidget';
import ReadinessMiniWidget from '@/components/home/ReadinessMiniWidget';
import SessionOptimizerWidget from '@/components/home/SessionOptimizerWidget';
import TrainingStatusBadge from '@/components/TrainingStatusBadge';
import WeeklyBriefPanel from '@/components/home/WeeklyBriefPanel';
import WeatherMiniWidget from '@/components/home/WeatherMiniWidget';
import {
  useLatestAiPrediction,
  useTodayAiTips,
  useAiStatus,
} from '@/hooks/useAi';
import {
  useBlockHealth,
  useCreateEvent,
  useDeleteEvent,
  useEventProjection,
  useEvents,
  useFatigueState,
  useFtpProgress,
  usePmc,
  useProgressionLevels,
  useReadiness,
  useRecentActivities,
  useSaveReadinessCheckIn,
  useTrainingStatus,
  useWeatherGradient,
  useWeatherLocations,
} from '@/hooks/useAnalytics';
import { useDailyDecision } from '@/hooks/useDailyDecision';
import { BENEFIT_COLORS, BENEFIT_LABELS } from '@/types/trainingEffect';
import { PMC_COLORS, STATUS_COLORS, alphaColor } from '@/utils/colors';
import { formatDistance, formatDuration } from '@/utils/formatters';

const surfaceSx = {
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: (theme: { tokens?: { cardShadow?: string } }) => theme.tokens?.cardShadow ?? 'none',
} as const;

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: decision, isLoading: isDecisionLoading } = useDailyDecision();

  const pmcQuery = usePmc({
    from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const { data: pmcData } = pmcQuery;
  const recentActivitiesQuery = useRecentActivities(4);
  const { data: recentActivities } = recentActivitiesQuery;
  const ftpProgressQuery = useFtpProgress();
  const { data: ftpProgress } = ftpProgressQuery;
  const readinessQuery = useReadiness();
  const { data: readiness } = readinessQuery;
  const weatherLocationsQuery = useWeatherLocations();
  const { data: weatherLocations } = weatherLocationsQuery;
  const activeLocation = weatherLocations?.find((location) => location.active);
  const weatherGradientQuery = useWeatherGradient(activeLocation?.name);
  const { data: weatherGradient } = weatherGradientQuery;
  const { data: coachSummary } = useLatestAiPrediction('TRAINING_COACH_SUMMARY');
  const progressionLevelsQuery = useProgressionLevels();
  const { data: progressionLevels } = progressionLevelsQuery;
  const { data: blockHealth } = useBlockHealth();
  const { data: fatigueState, isLoading: fatigueLoading } = useFatigueState();
  const { data: events } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { data: projection } = useEventProjection();
  const { data: trainingStatus, isLoading: statusLoading } = useTrainingStatus();
  const { data: todayAiTips, isLoading: isTodayAiTipsLoading } = useTodayAiTips();
  const { data: aiStatus } = useAiStatus();
  const saveCheckIn = useSaveReadinessCheckIn();
  const checkInSaving = saveCheckIn.isPending;

  const handleCheckInSave = (payload: Parameters<typeof saveCheckIn.mutate>[0]) => {
    saveCheckIn.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['readiness'] });
        queryClient.invalidateQueries({ queryKey: ['daily-decision'] });
      },
    });
  };

  const latestActivity = recentActivities?.[0] ?? null;
  const previousActivities = recentActivities?.slice(1, 4) ?? [];
  const topProgression = progressionLevels?.[0];

  const latestPmc = pmcData?.[pmcData.length - 1] ?? null;

  return (
    <PageContainer
      title="Decyzja"
      subtitle="Twoja decyzja treningowa na dziś — oparta na gotowości, zmęczeniu i kontekście."
      breadcrumbs={[{ label: 'Decyzja' }]}
      maxWidth={1480}
    >
      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        {/* LEFT SIDEBAR — Context widgets (lower priority) */}
        <Grid item xs={12} md={6} xl={3} order={{ xs: 3, xl: 1 }}>
          <Stack
            spacing={1.5}
            sx={{
              position: { xs: 'static', xl: 'sticky' },
              top: { xl: 24 },
              alignSelf: 'flex-start',
            }}
          >
            <WeatherMiniWidget
              gradient={weatherGradient}
              onOpen={() => navigate('/weather')}
              artTestId="dashboard-widget-art-weather"
            />
            <BlockMiniWidget
              blockHealth={blockHealth}
              onOpen={() => navigate('/training')}
              artTestId="dashboard-widget-art-block"
            />
            <ReadinessMiniWidget
              readiness={readiness}
              onOpen={() => navigate('/health')}
              artTestId="dashboard-widget-art-readiness"
            />
            <FatigueWidget data={fatigueState} isLoading={fatigueLoading} />
            <EnergyBudgetWidget data={fatigueState} isLoading={fatigueLoading} />
            <EventCountdownWidget
              events={events}
              onCreate={(e) => createEvent.mutate(e)}
              onDelete={(id) => deleteEvent.mutate(id)}
              ctlValue={latestPmc?.ctl ?? null}
              projection={projection}
            />
            <ProgressMiniWidget
              progression={topProgression}
              subtitle="Śledzenie progresji"
              onOpen={() => navigate('/analytics')}
              artTestId="dashboard-widget-art-progress"
            />

            {/* Quick links */}
            <Paper
              sx={{
                ...surfaceSx,
                p: 1.75,
                borderRadius: 4,
                bgcolor: alphaColor(STATUS_COLORS.accent, 0.04),
              }}
            >
              <Stack spacing={1.25}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                  Szybkie przejścia
                </Typography>
                {[
                  { label: 'Analityka', icon: <BarChartIcon />, path: '/analytics' },
                  { label: 'Trening', icon: <AutoAwesomeIcon />, path: '/training' },
                  { label: 'Zdrowie', icon: <FavoriteBorderIcon />, path: '/health' },
                  { label: 'Aktywności', icon: <DirectionsBikeIcon />, path: '/activities' },
                ].map((link) => (
                  <Button
                    key={link.label}
                    variant="outlined"
                    startIcon={link.icon}
                    onClick={() => navigate(link.path)}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* CENTER — Decision Screen (hero card + reasoning + alternatives) */}
        <Grid item xs={12} xl={6} order={{ xs: 1, xl: 2 }}>
          <Stack spacing={2.5}>
            {/* HERO DECISION CARD */}
            <DailyDecisionHeroCard
              decision={decision}
              isLoading={isDecisionLoading}
              onStartWorkout={() => navigate('/training')}
            />
            <TrainingStatusBadge data={trainingStatus} isLoading={statusLoading} />

            {/* SESSION OPTIMIZER */}
            <Box
              sx={{
                ...surfaceSx,
                p: { xs: 1, md: 1.5 },
                background: `linear-gradient(180deg, ${alphaColor(STATUS_COLORS.warning, 0.04)}, transparent)`,
              }}
            >
              <SessionOptimizerWidget />
            </Box>

            {/* CHECK-IN — subiektywny sygnał, który wpływa na decyzję */}
            <Box
              sx={{
                ...surfaceSx,
                p: { xs: 1.75, md: 2.5 },
                background: `linear-gradient(135deg, ${alphaColor(STATUS_COLORS.accent, 0.06)}, ${alphaColor(STATUS_COLORS.success, 0.04)})`,
                borderColor: alphaColor(STATUS_COLORS.accent, 0.2),
              }}
            >
              <Stack spacing={0.75}>
                <Typography
                  variant="overline"
                  sx={{ color: STATUS_COLORS.accent, letterSpacing: '0.08em', fontWeight: 800, fontSize: '0.65rem' }}
                >
                  Twój sygnał &rarr; silnik decyzyjny
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Subiektywna ocena samopoczucia wpływa na dzisiejszą rekomendację.
                </Typography>
                <DailyCheckInWidget
                  readiness={readiness}
                  onSave={handleCheckInSave}
                  isSaving={checkInSaving}
                />
              </Stack>
            </Box>

            {/* REASONING PANEL */}
            {decision?.reasons && decision.reasons.length > 0 && (
              <ReasoningPanel reasons={decision.reasons} />
            )}

            {/* ALTERNATIVES PANEL */}
            {decision?.alternatives && decision.alternatives.length > 0 && (
              <AlternativesPanel
                alternatives={decision.alternatives}
                onSelect={() => navigate('/training')}
              />
            )}

            {/* PMC Mini Chart */}
            {pmcData && pmcData.length > 0 && (
              <Paper
                sx={{
                  ...surfaceSx,
                  p: { xs: 1.75, md: 2.5 },
                  bgcolor: alphaColor('#0D1117', 0.28),
                  border: `1px solid ${alphaColor(STATUS_COLORS.warning, 0.14)}`,
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Obciążenie PMC
                  </Typography>
                  <TrainingLoadMiniChart data={pmcData} />
                  {latestPmc && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {([
                        { label: 'CTL', delta: latestPmc.ctlDelta, color: PMC_COLORS.CTL },
                        { label: 'ATL', delta: latestPmc.atlDelta, color: PMC_COLORS.ATL },
                        { label: 'TSB', delta: latestPmc.tsbDelta, color: PMC_COLORS.TSB },
                      ] as const).map((metric) => {
                        const rounded = Math.round(metric.delta * 10) / 10;
                        return (
                          <Chip
                            key={metric.label}
                            size="small"
                            label={
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {metric.label}{' '}
                                <span
                                  style={{
                                    color:
                                      rounded > 0
                                        ? STATUS_COLORS.success
                                        : rounded < 0
                                          ? STATUS_COLORS.error
                                          : STATUS_COLORS.neutral,
                                  }}
                                >
                                  {rounded >= 0 ? `+${rounded}` : rounded}
                                </span>
                              </Typography>
                            }
                            variant="outlined"
                            sx={{ borderColor: `${metric.color}44`, bgcolor: `${metric.color}0A` }}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Weekly Brief Panel */}
            <WeeklyBriefPanel />

            {/* Latest Activity */}
            {latestActivity ? (
              <Paper sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 }, overflow: 'hidden' }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                  >
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: 'text.secondary', letterSpacing: '0.08em', fontWeight: 800 }}
                      >
                        Ostatni trening
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.08, mt: 0.35 }}>
                        {latestActivity.name}
                      </Typography>
                       <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        {new Date(latestActivity.startedAt).toLocaleDateString('pl-PL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}{' '}
                        · {latestActivity.sportType}
                      </Typography>
                      {latestActivity.primaryBenefit || latestActivity.trainingScore != null ? (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                          {latestActivity.trainingScore != null && (
                            <Chip
                              label={latestActivity.trainingScore}
                              size="small"
                              sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                            />
                          )}
                          {latestActivity.primaryBenefit && (
                            <Chip
                              label={BENEFIT_LABELS[latestActivity.primaryBenefit] ?? latestActivity.primaryBenefit}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                bgcolor: `${BENEFIT_COLORS[latestActivity.primaryBenefit] ?? '#58A6FF'}22`,
                                color: BENEFIT_COLORS[latestActivity.primaryBenefit] ?? '#58A6FF',
                                border: `1px solid ${BENEFIT_COLORS[latestActivity.primaryBenefit] ?? '#58A6FF'}44`,
                              }}
                            />
                          )}
                        </Stack>
                      ) : null}
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/activities/${latestActivity.id}`)}
                    >
                      Pełna aktywność
                    </Button>
                  </Stack>

                  <ActivityMediaCarousel
                    activityName={latestActivity.name}
                    geoJson={null}
                    photoUrls={latestActivity.photoUrls}
                    summaryPolyline={latestActivity.summaryPolyline}
                    activitySummary={{
                      movingTimeSec: latestActivity.movingTimeSec,
                      distanceM: latestActivity.distanceM,
                      avgPowerW: latestActivity.avgPowerW,
                      avgHeartrate: latestActivity.avgHeartrate,
                    }}
                  />
                </Stack>
              </Paper>
            ) : null}

            {/* AI Coach Summary */}
            {coachSummary && (
              <Paper
                sx={{
                  ...surfaceSx,
                  p: { xs: 1.75, md: 2.5 },
                  background: `linear-gradient(180deg, ${alphaColor(STATUS_COLORS.info, 0.04)}, transparent)`,
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Coach AI — podsumowanie
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {coachSummary.summary ?? 'Brak podsumowania.'}
                  </Typography>
                </Stack>
              </Paper>
            )}

            {/* Recent Activities */}
            {previousActivities.length > 0 && (
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Poprzednie aktywności
                  </Typography>
                  <Button variant="text" onClick={() => navigate('/activities')}>
                    Wszystkie
                  </Button>
                </Stack>

                {previousActivities.map((activity) => (
                  <Paper
                    key={activity.id}
                    sx={{
                      ...surfaceSx,
                      p: { xs: 1.75, md: 2 },
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        justifyContent="space-between"
                      >
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {activity.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(activity.startedAt).toLocaleDateString('pl-PL', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}{' '}
                            · {activity.sportType}
                          </Typography>
                        </Box>
                        <Chip label={formatDistance(activity.distanceM)} variant="outlined" />
                        <Chip label={formatDuration(activity.movingTimeSec)} variant="outlined" />
                      </Stack>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/activities/${activity.id}`)}
                      >
                        Pokaż
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Grid>

        {/* RIGHT SIDEBAR — AI & FTP */}
        <Grid item xs={12} md={6} xl={3} order={{ xs: 2, xl: 3 }}>
          <Stack
            spacing={1.5}
            sx={{
              position: { xs: 'static', xl: 'sticky' },
              top: { xl: 24 },
              alignSelf: 'flex-start',
            }}
          >
            {/* AI Tips */}
            <Paper
              sx={{
                ...surfaceSx,
                p: { xs: 1.75, md: 2.5 },
                background: `linear-gradient(180deg, ${alphaColor(STATUS_COLORS.info, 0.04)}, transparent)`,
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Wskazówki AI
                </Typography>
                <AiTipsCarousel
                  tips={todayAiTips ?? []}
                  loading={isTodayAiTipsLoading}
                  status={aiStatus}
                />
              </Stack>
            </Paper>

            {/* FTP */}
            {ftpProgress && (
              <Paper
                sx={{
                  ...surfaceSx,
                  p: 1.75,
                  bgcolor: alphaColor(PMC_COLORS.CTL, 0.06),
                }}
              >
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', fontWeight: 800, display: 'block', mb: 1 }}
                >
                  FTP
                </Typography>
                <Stack spacing={0.5}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: PMC_COLORS.CTL }}>
                    {ftpProgress.currentFtp} W
                  </Typography>
                  {ftpProgress.changePercent != null && (
                    <Chip
                      size="small"
                      label={`${ftpProgress.changePercent > 0 ? '+' : ''}${Math.round(ftpProgress.changePercent)}%`}
                      color={ftpProgress.changePercent > 0 ? 'success' : 'error'}
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
