import {
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import ActivityMediaCarousel from '@/components/ActivityMediaCarousel';
import DailyDecisionHeroCard from '@/components/daily-decision/DailyDecisionHeroCard';
import ReadinessWidget from '@/components/home/ReadinessWidget';
import PageContainer from '@/components/common/PageContainer';
import TrainingLoadMiniChart from '@/components/TrainingLoadMiniChart';
import RecoveryWidget from '@/components/home/RecoveryWidget';
import EventCountdownWidget from '@/components/home/EventCountdownWidget';
import CoachWidget from '@/components/home/CoachWidget';
import WeatherMiniWidget from '@/components/home/WeatherMiniWidget';
import OnboardingOverlay from '@/components/onboarding/OnboardingOverlay';
import {
  useCreateEvent,
  useDeleteEvent,
  useEventProjection,
  useEvents,
  useFatigueState,
  useFtpProgress,
  usePmc,
  useProfile,
  useReadiness,
  useRecentActivities,
  useSaveReadinessCheckIn,
  useWeatherGradient,
  useWeatherLocations,
  useWeeklyBudget,
} from '@/hooks/useAnalytics';
import { useCoachToday } from '@/hooks/useCoach';
import type { DailyDecisionDto } from '@/types/dailyDecision';
import { BENEFIT_COLORS, BENEFIT_LABELS } from '@/types/trainingEffect';
import { PMC_COLORS, STATUS_COLORS, alphaColor } from '@/utils/colors';

const surfaceSx = {
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: (theme: { tokens?: { cardShadow?: string } }) => theme.tokens?.cardShadow ?? 'none',
} as const;

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: coachData, isLoading: isDecisionLoading } = useCoachToday();

  const decision: DailyDecisionDto | undefined = coachData ? {
    decision: (coachData.decision === 'TRAIN' ? 'RIDE' :
              coachData.decision === 'ACTIVE_RECOVERY' ? 'MODIFY' :
              'SKIP') as DailyDecisionDto['decision'],
    workout: {
      type: coachData.bestSession?.type ?? 'ENDURANCE',
      durationMin: coachData.bestSession?.durationMinutes ?? 60,
      targetTss: Math.round(coachData.bestSession?.targetTss ?? 50),
      difficulty: coachData.bestSession?.difficulty ?? 'MODERATE',
      intensityDescription: coachData.bestSession?.description ?? '',
      description: coachData.bestSession?.description ?? '',
      indoor: coachData.bestSession?.indoor ?? false,
    },
    confidence: { score: 0.7, label: 'MEDIUM', description: 'Coach Engine' },
    risk: 'LOW' as DailyDecisionDto['risk'],
    reasons: (coachData.reasoning ?? []).map((r) => ({
      priority: 'COACH', signal: '', message: r, evidence: '',
    })),
    alternatives: (coachData.alternatives ?? []).map((a) => ({
      label: a.type,
      type: 'MODIFY' as const,
      workout: {
        type: a.type,
        durationMin: a.durationMinutes,
        targetTss: Math.round(a.targetTss),
        difficulty: a.difficulty ?? 'MODERATE',
        intensityDescription: a.description ?? '',
        description: a.description ?? '',
        indoor: a.indoor ?? false,
      },
      rationale: `Score: ${a.score}`,
    })),
  } : undefined;

  const pmcQuery = usePmc({
    from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const { data: pmcData } = pmcQuery;
  const recentActivitiesQuery = useRecentActivities(4);
  const { data: recentActivities } = recentActivitiesQuery;
  const ftpProgressQuery = useFtpProgress();
  const { data: ftpProgress } = ftpProgressQuery;
  const { data: profile } = useProfile();
  const readinessQuery = useReadiness();
  const { data: readiness } = readinessQuery;
  const weatherLocationsQuery = useWeatherLocations();
  const { data: weatherLocations } = weatherLocationsQuery;
  const activeLocation = weatherLocations?.find((location) => location.active);
  const weatherGradientQuery = useWeatherGradient(activeLocation?.name);
  const { data: weatherGradient } = weatherGradientQuery;
  const { data: fatigueState, isLoading: fatigueLoading } = useFatigueState();
  const { data: events } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { data: projection } = useEventProjection();
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
  const latestPmc = pmcData?.[pmcData.length - 1] ?? null;
  const { data: weeklyBudget } = useWeeklyBudget(latestPmc?.ctl ?? 0);

  return (
    <PageContainer
      title="Decyzja"
      subtitle="Twoja decyzja treningowa na dziś — oparta na gotowości, zmęczeniu i kontekście."
      breadcrumbs={[{ label: 'Decyzja' }]}
      maxWidth={1480}
    >
      <OnboardingOverlay profile={profile} ftpProgress={ftpProgress} />
      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        {/* LEFT SIDEBAR — Context widgets */}
        <Grid item xs={12} md={6} xl={3} order={{ xs: 3, xl: 1 }}>
          <Stack spacing={1.5} sx={{ position: { xs: 'static', xl: 'sticky' }, top: { xl: 24 }, alignSelf: 'flex-start' }}>
            <WeatherMiniWidget gradient={weatherGradient} onOpen={() => navigate('/weather')} artTestId="dashboard-widget-art-weather" />
            <ReadinessWidget readiness={readiness} onSave={handleCheckInSave} isSaving={checkInSaving} />
            <RecoveryWidget data={fatigueState} isLoading={fatigueLoading} />
            <EventCountdownWidget events={events} onCreate={(e) => createEvent.mutate(e)} onDelete={(id) => deleteEvent.mutate(id)} ctlValue={latestPmc?.ctl ?? null} projection={projection} />
          </Stack>
        </Grid>

        {/* CENTER — Decision + PMC + Latest Activity */}
        <Grid item xs={12} xl={6} order={{ xs: 1, xl: 2 }}>
          <Stack spacing={2.5}>
            <DailyDecisionHeroCard decision={decision} isLoading={isDecisionLoading} onStartWorkout={() => navigate('/training')} />
            <CoachWidget />

            {pmcData && pmcData.length > 0 && (
              <Paper sx={{ ...surfaceSx, p: { xs: 1.75, md: 2.5 }, bgcolor: alphaColor('#0D1117', 0.28), border: `1px solid ${alphaColor(STATUS_COLORS.warning, 0.14)}` }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Obciążenie PMC</Typography>
                  <TrainingLoadMiniChart data={pmcData} />
                  {latestPmc && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {([{ label: 'CTL', delta: latestPmc.ctlDelta, color: PMC_COLORS.CTL }, { label: 'ATL', delta: latestPmc.atlDelta, color: PMC_COLORS.ATL }, { label: 'TSB', delta: latestPmc.tsbDelta, color: PMC_COLORS.TSB }] as const).map((metric) => {
                        const rounded = Math.round(metric.delta * 10) / 10;
                        return (
                          <Chip key={metric.label} size="small" label={<Typography variant="caption" sx={{ fontWeight: 700 }}>{metric.label} <span style={{ color: rounded > 0 ? STATUS_COLORS.success : rounded < 0 ? STATUS_COLORS.error : STATUS_COLORS.neutral }}>{rounded >= 0 ? `+${rounded}` : rounded}</span></Typography>} variant="outlined" sx={{ borderColor: `${metric.color}44`, bgcolor: `${metric.color}0A` }} />
                        );
                      })}
                    </Box>
                  )}
                  {weeklyBudget && (
                    <Box sx={{ mt: 1 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Tydzień: {weeklyBudget.optimalTss} TSS cel</Typography>
                        <Typography variant="caption" fontWeight={700} color={weeklyBudget.status === 'OVER' ? STATUS_COLORS.error : weeklyBudget.status === 'OPTIMAL' ? STATUS_COLORS.success : STATUS_COLORS.warning}>{weeklyBudget.remainingTss} pozostało</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={Math.min(100, weeklyBudget.percentComplete)} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { bgcolor: weeklyBudget.status === 'OVER' ? STATUS_COLORS.error : weeklyBudget.status === 'OPTIMAL' ? STATUS_COLORS.success : STATUS_COLORS.warning, borderRadius: 3 } }} />
                    </Box>
                  )}
                </Stack>
              </Paper>
            )}

            {latestActivity ? (
              <Paper sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 }, overflow: 'hidden' }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                    <Box>
                      <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.08em', fontWeight: 800 }}>Ostatni trening</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.08, mt: 0.35 }}>{latestActivity.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{new Date(latestActivity.startedAt).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })} · {latestActivity.sportType}</Typography>
                      {latestActivity.primaryBenefit || latestActivity.trainingScore != null ? (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                          {latestActivity.trainingScore != null && <Chip label={latestActivity.trainingScore} size="small" sx={{ fontWeight: 800, fontSize: '0.75rem' }} />}
                          {latestActivity.primaryBenefit && <Chip label={BENEFIT_LABELS[latestActivity.primaryBenefit] ?? latestActivity.primaryBenefit} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: `${BENEFIT_COLORS[latestActivity.primaryBenefit] ?? '#58A6FF'}22`, color: BENEFIT_COLORS[latestActivity.primaryBenefit] ?? '#58A6FF', border: `1px solid ${BENEFIT_COLORS[latestActivity.primaryBenefit] ?? '#58A6FF'}44` }} />}
                        </Stack>
                      ) : null}
                    </Box>
                    <Button variant="contained" onClick={() => navigate(`/activities/${latestActivity.id}`)}>Pełna aktywność</Button>
                  </Stack>
                  <ActivityMediaCarousel activityName={latestActivity.name} geoJson={null} photoUrls={latestActivity.photoUrls} summaryPolyline={latestActivity.summaryPolyline} activitySummary={{ movingTimeSec: latestActivity.movingTimeSec, distanceM: latestActivity.distanceM, avgPowerW: latestActivity.avgPowerW, avgHeartrate: latestActivity.avgHeartrate }} />
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        </Grid>

        {/* RIGHT SIDEBAR — FTP + W/kg */}
        <Grid item xs={12} md={6} xl={3} order={{ xs: 2, xl: 3 }}>
          <Stack spacing={1.5} sx={{ position: { xs: 'static', xl: 'sticky' }, top: { xl: 24 }, alignSelf: 'flex-start' }}>
            {ftpProgress && (
              <Paper sx={{ ...surfaceSx, p: 1.75, bgcolor: alphaColor(PMC_COLORS.CTL, 0.06) }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, display: 'block', mb: 1 }}>FTP</Typography>
                <Stack spacing={0.5}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: PMC_COLORS.CTL }}>{ftpProgress.currentFtp} W</Typography>
                  {ftpProgress.changePercent != null && <Chip size="small" label={`${ftpProgress.changePercent > 0 ? '+' : ''}${Math.round(ftpProgress.changePercent)}%`} color={ftpProgress.changePercent > 0 ? 'success' : 'error'} variant="outlined" />}
                  {profile?.weightKg != null && ftpProgress.currentFtp != null && <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>{(ftpProgress.currentFtp / profile.weightKg).toFixed(1)} W/kg</Typography>}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
