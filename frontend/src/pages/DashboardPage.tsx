import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BarChartIcon from '@mui/icons-material/BarChart';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import ActivityMediaCarousel from '@/components/ActivityMediaCarousel';
import AiTipsCarousel from '@/components/AiTipsCarousel';
import CoachSummaryPanel from '@/components/training/CoachSummaryPanel';
import EditorialHero from '@/components/common/EditorialHero';
import FtpProgressCard from '@/components/FtpProgressCard';
import HomeCelebrationCarousel from '@/components/home/HomeCelebrationCarousel';
import PageContainer from '@/components/common/PageContainer';
import TrainingLoadMiniChart from '@/components/TrainingLoadMiniChart';
import BlockMiniWidget from '@/components/home/BlockMiniWidget';
import DailyCheckInWidget from '@/components/home/DailyCheckInWidget';
import ProgressMiniWidget from '@/components/home/ProgressMiniWidget';
import ReadinessMiniWidget from '@/components/home/ReadinessMiniWidget';
import WeatherMiniWidget from '@/components/home/WeatherMiniWidget';
import {
  useAiNote,
  useAiPredict,
  useAiStatus,
  useGenerateAiNote,
  useLatestAiPrediction,
  useTodayAiTips,
} from '@/hooks/useAi';
import {
  useBlockHealth,
  useFtpProgress,
  usePmc,
  usePowerCurve,
  useProfile,
  useProgressionLevels,
  useReadiness,
  useRecentActivities,
  useSaveReadinessCheckIn,
  useWeatherGradient,
  useWeatherLocations,
} from '@/hooks/useAnalytics';
import { useAchievements } from '@/hooks/useGamification';
import type { ActivitySummary } from '@/types/activity';
import { PMC_COLORS, STATUS_COLORS, alphaColor } from '@/utils/colors';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { getPageHeroIllustrationPath } from '@/utils/illustrationAssets';

const surfaceSx = {
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: (theme: { tokens?: { cardShadow?: string } }) => theme.tokens?.cardShadow ?? 'none',
} as const;

function buildGenericSummary(activity: ActivitySummary) {
  const parts = [
    `${formatDistance(activity.distanceM)} w ${formatDuration(activity.movingTimeSec)}`,
  ];

  if (activity.avgPowerW != null) {
    parts.push(`Śr. moc ${Math.round(activity.avgPowerW)} W`);
  }

  if (activity.avgHeartrate != null) {
    parts.push(`tętno ${Math.round(activity.avgHeartrate)} bpm`);
  }

  if (activity.elevationGainM != null && activity.elevationGainM > 0) {
    parts.push(`przewyższenie ${Math.round(activity.elevationGainM)} m`);
  }

  return parts.join(' · ');
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const pmcQuery = usePmc({
    from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const { data: pmcData } = pmcQuery;
  const recentActivitiesQuery = useRecentActivities(6);
  const { data: recentActivities } = recentActivitiesQuery;
  const ftpProgressQuery = useFtpProgress();
  const { data: ftpProgress } = ftpProgressQuery;
  const readinessQuery = useReadiness();
  const { data: readiness } = readinessQuery;
  const powerCurveQuery = usePowerCurve({
    from: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const { data: powerCurve } = powerCurveQuery;
  const weatherLocationsQuery = useWeatherLocations();
  const { data: weatherLocations } = weatherLocationsQuery;
  const activeLocation = weatherLocations?.find((location) => location.active);
  const weatherGradientQuery = useWeatherGradient(activeLocation?.name);
  const { data: weatherGradient } = weatherGradientQuery;
  const { data: coachSummary } = useLatestAiPrediction('TRAINING_COACH_SUMMARY');
  const generateAiPrediction = useAiPredict();
  const profileQuery = useProfile();
  const { data: profile } = profileQuery;
  const progressionLevelsQuery = useProgressionLevels();
  const { data: progressionLevels } = progressionLevelsQuery;
  const { data: blockHealth } = useBlockHealth();
  const saveCheckIn = useSaveReadinessCheckIn();
  const achievementsQuery = useAchievements();
  const { data: achievements } = achievementsQuery;
  const { data: latestAiNote } = useAiNote(recentActivities?.[0]?.id);
  const generateAiNote = useGenerateAiNote();
  const { data: todayAiTips, isLoading: isTodayAiTipsLoading } = useTodayAiTips();
  const { data: aiStatus } = useAiStatus();

  const latestActivity = recentActivities?.[0] ?? null;
  const previousActivities = recentActivities?.slice(1, 6) ?? [];
  const topProgression = progressionLevels?.[0];

  const latestPmc = useMemo(() => {
    if (!pmcData?.length) return null;
    return pmcData[pmcData.length - 1];
  }, [pmcData]);

  const homeCelebrationsReady =
    !recentActivitiesQuery.isLoading &&
    !progressionLevelsQuery.isLoading &&
    !achievementsQuery.isLoading &&
    !ftpProgressQuery.isLoading;

  const aiState = useMemo(() => {
    if (!latestActivity) {
      return {
        label: 'Brak aktywności',
        text: 'Gdy pojawi się nowa aktywność, Home pokaże tutaj skrót AI i stan generowania notki.',
        tone: 'idle' as const,
      };
    }

    if (
      latestAiNote &&
      !latestAiNote.summary &&
      (latestAiNote.queueStatus === 'pending' || latestAiNote.queueStatus === 'processing')
    ) {
      return {
        label: 'AI pracuje',
        text: 'Notka AI generuje się w tle.',
        tone: 'loading' as const,
      };
    }

    if (latestAiNote?.summary) {
      return {
        label: 'Szybki opis AI',
        text: latestAiNote.summary,
        tone: 'ready' as const,
      };
    }

    return {
      label: 'Opis bazowy',
      text: buildGenericSummary(latestActivity),
      tone: 'fallback' as const,
    };
  }, [latestActivity, latestAiNote]);

  const quickLinks = [
    { label: 'Studio pogody', icon: <AutoAwesomeIcon />, onClick: () => navigate('/weather') },
    { label: 'Aktywności', icon: <DirectionsBikeIcon />, onClick: () => navigate('/activities') },
    { label: 'Analityka', icon: <BarChartIcon />, onClick: () => navigate('/analytics') },
    { label: 'Zdrowie', icon: <FavoriteBorderIcon />, onClick: () => navigate('/health') },
  ];

  return (
    <PageContainer
      title="Home"
      subtitle="Twój ostatni trening, jego szybka interpretacja i najbliższy kontekst decyzji w jednym miejscu."
      breadcrumbs={[{ label: 'Home' }]}
      maxWidth={1480}
    >
      <HomeCelebrationCarousel
        latestActivity={latestActivity}
        ftpProgress={ftpProgress}
        progressionLevels={progressionLevels}
        achievements={achievements}
        ready={homeCelebrationsReady}
      />

      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        <Grid item xs={12} md={6} xl={3} order={{ xs: 2, xl: 1 }}>
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
          </Stack>
        </Grid>

        <Grid item xs={12} xl={6} order={{ xs: 1, xl: 2 }}>
          <Stack spacing={2.5}>
            <EditorialHero
              eyebrow="Centrum dnia"
              title="Jeden pulpit na szybki odczyt, a potem głębokie wejścia w dane."
              description="Dashboard zbiera dziś najważniejsze sygnały w bardziej spokojnym, terenowym klimacie zamiast układu pełnego przypadkowych kart."
              accentColor={STATUS_COLORS.accent}
              imageSrc={getPageHeroIllustrationPath('dashboard')}
              imageAlt="Dashboard hero"
              imagePosition="center 58%"
              highlights={['Readiness i blok', 'Pogoda i AI', 'Szybkie przejścia']}
            />

            <Paper
              sx={{
                ...surfaceSx,
                p: { xs: 2, md: 2.5 },
                overflow: 'hidden',
                backgroundImage: `linear-gradient(180deg, ${alphaColor(
                  STATUS_COLORS.warning,
                  0.08,
                )} 0%, ${alphaColor(STATUS_COLORS.accent, 0.03)} 100%)`,
              }}
            >
              <Stack spacing={2.5}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                >
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{ color: 'text.secondary', letterSpacing: '0.09em', fontWeight: 800 }}
                    >
                      Trening i aktywności
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.04, mt: 0.5 }}>
                      {latestActivity?.name ?? 'Czekam na nową aktywność'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      {latestActivity
                        ? `${new Date(latestActivity.startedAt).toLocaleDateString('pl-PL', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })} · ${latestActivity.sportType}`
                        : 'Po kolejnym syncu pojawi się ostatnia aktywność.'}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {latestActivity ? (
                      <>
                        <Chip label={formatDistance(latestActivity.distanceM)} variant="outlined" color="primary" />
                        <Chip label={formatDuration(latestActivity.movingTimeSec)} variant="outlined" />
                        {latestActivity.avgPowerW != null ? (
                          <Chip label={`${Math.round(latestActivity.avgPowerW)} W`} variant="outlined" />
                        ) : null}
                      </>
                    ) : null}
                  </Stack>
                </Stack>

                {latestActivity ? (
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
                ) : null}

                {latestActivity ? (
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor:
                        aiState.tone === 'ready'
                          ? alphaColor(STATUS_COLORS.success, 0.08)
                          : aiState.tone === 'loading'
                            ? alphaColor(STATUS_COLORS.warning, 0.1)
                            : alphaColor(STATUS_COLORS.accent, 0.08),
                      border: '1px solid',
                      borderColor:
                        aiState.tone === 'loading'
                          ? alphaColor(STATUS_COLORS.warning, 0.24)
                          : alphaColor(STATUS_COLORS.accent, 0.16),
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AutoAwesomeIcon sx={{ color: STATUS_COLORS.accent }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            {aiState.label}
                          </Typography>
                        </Stack>
                        {aiState.tone === 'loading' ? (
                          <Chip
                            icon={<CircularProgress size={14} color="inherit" />}
                            label="Generowanie"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ) : null}
                      </Stack>

                      <Typography variant="body1">{aiState.text}</Typography>

                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Button
                          variant="contained"
                          startIcon={<OpenInNewIcon />}
                          onClick={() => navigate(`/activities/${latestActivity.id}`)}
                        >
                          Pokaż pełną aktywność
                        </Button>

                        {aiState.tone === 'fallback' ? (
                          <Button
                            variant="outlined"
                            startIcon={<AutoAwesomeIcon />}
                            onClick={() => generateAiNote.mutate(latestActivity.id)}
                          >
                            Wygeneruj lepszy opis AI
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                ) : null}

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: alphaColor('#0D1117', 0.28),
                    border: `1px solid ${alphaColor(STATUS_COLORS.warning, 0.14)}`,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        Obciążenie PMC
                      </Typography>
                    </Stack>
                    {pmcData && pmcData.length > 0 ? (
                      <Box>
                        <TrainingLoadMiniChart data={pmcData} />
                        {latestPmc && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                            {([
                              { label: 'CTL', delta: latestPmc.ctlDelta, color: PMC_COLORS.CTL },
                              { label: 'ATL', delta: latestPmc.atlDelta, color: PMC_COLORS.ATL },
                              { label: 'TSB', delta: latestPmc.tsbDelta, color: PMC_COLORS.TSB },
                            ] as const).map((metric) => {
                              const rounded = Math.round(metric.delta * 10) / 10;
                              const Icon =
                                rounded > 0 ? TrendingUpIcon : rounded < 0 ? TrendingDownIcon : TrendingFlatIcon;

                              return (
                                <Chip
                                  key={metric.label}
                                  size="small"
                                  icon={<Icon sx={{ color: `${metric.color} !important`, fontSize: 16 }} />}
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
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Brak danych PMC — zsynchronizuj dane treningowe.
                      </Typography>
                    )}
                  </Stack>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="contained" onClick={() => navigate('/analytics')}>
                    Pełna analityka
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/training')}>
                    Planer treningowy
                  </Button>
                </Box>
              </Stack>
            </Paper>

            <Paper
              sx={{
                ...surfaceSx,
                p: { xs: 1.75, md: 2.5 },
                backgroundImage: `linear-gradient(180deg, ${alphaColor(
                  STATUS_COLORS.info,
                  0.06,
                )} 0%, ${alphaColor(STATUS_COLORS.accent, 0.02)} 100%)`,
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Rekomendacje AI na dziś
                </Typography>
                <AiTipsCarousel
                  tips={todayAiTips ?? []}
                  loading={isTodayAiTipsLoading}
                  status={aiStatus}
                />
              </Stack>
            </Paper>

            <Paper
              sx={{
                ...surfaceSx,
                p: { xs: 1.75, md: 2.5 },
                backgroundImage: `linear-gradient(180deg, ${alphaColor(
                  STATUS_COLORS.info,
                  0.06,
                )} 0%, ${alphaColor(STATUS_COLORS.accent, 0.02)} 100%)`,
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Coach AI — podsumowanie
                </Typography>
                <CoachSummaryPanel
                  prediction={coachSummary}
                  isGenerating={generateAiPrediction.isPending}
                  onGenerate={() => generateAiPrediction.mutate({ predictionType: 'TRAINING_COACH_SUMMARY' })}
                />
              </Stack>
            </Paper>

            <Box>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                sx={{ mb: 1.5 }}
              >
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Ostatnie aktywności
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Poprzednie jednostki — każda z mapą i szybkim opisem.
                  </Typography>
                </Box>
                <Button variant="text" onClick={() => navigate('/activities')}>
                  Wszystkie aktywności
                </Button>
              </Stack>

              <Stack spacing={1.5}>
                {previousActivities.map((activity) => (
                  <Paper
                    key={activity.id}
                    sx={{
                      ...surfaceSx,
                      p: { xs: 1.75, md: 2 },
                      backgroundImage: `linear-gradient(180deg, ${alphaColor(
                        STATUS_COLORS.accent,
                        0.06,
                      )} 0%, ${alphaColor(STATUS_COLORS.secondary, 0.03)} 100%)`,
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="overline"
                            sx={{ color: 'text.secondary', letterSpacing: '0.08em', fontWeight: 800 }}
                          >
                            Poprzedni trening
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.08, mt: 0.35 }}>
                            {activity.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                            {new Date(activity.startedAt).toLocaleDateString('pl-PL', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}{' '}
                            · {activity.sportType}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip label={formatDistance(activity.distanceM)} variant="outlined" />
                          <Chip label={formatDuration(activity.movingTimeSec)} variant="outlined" />
                          {activity.avgPowerW != null ? (
                            <Chip label={`${Math.round(activity.avgPowerW)} W`} variant="outlined" />
                          ) : null}
                        </Stack>
                      </Stack>

                      <ActivityMediaCarousel
                        activityName={activity.name}
                        geoJson={null}
                        photoUrls={activity.photoUrls}
                        summaryPolyline={activity.summaryPolyline}
                        activitySummary={{
                          movingTimeSec: activity.movingTimeSec,
                          distanceM: activity.distanceM,
                          avgPowerW: activity.avgPowerW,
                          avgHeartrate: activity.avgHeartrate,
                        }}
                      />

                      <Box>
                        <Button
                          variant="contained"
                          onClick={() => navigate(`/activities/${activity.id}`)}
                          size="small"
                        >
                          Pokaż pełną aktywność
                        </Button>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6} xl={3} order={{ xs: 3, xl: 3 }}>
          <Stack
            spacing={1.5}
            sx={{
              position: { xs: 'static', xl: 'sticky' },
              top: { xl: 24 },
              alignSelf: 'flex-start',
            }}
          >
            <ReadinessMiniWidget
              readiness={readiness}
              onOpen={() => navigate('/health')}
              artTestId="dashboard-widget-art-readiness"
            />

            <DailyCheckInWidget
              readiness={readiness}
              onSave={(payload) => saveCheckIn.mutate(payload)}
              isSaving={saveCheckIn.isPending}
            />

            <ProgressMiniWidget
              progression={topProgression}
              subtitle="Śledzenie progresji"
              onOpen={() => navigate('/analytics')}
              artTestId="dashboard-widget-art-progress"
            />

            <Paper
              sx={{
                ...surfaceSx,
                p: 1.75,
                borderRadius: 4,
                bgcolor: alphaColor(STATUS_COLORS.highlight, 0.08),
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: alphaColor(STATUS_COLORS.highlight, 0.16),
                    color: STATUS_COLORS.highlight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MonitorHeartOutlinedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                    Najlepsze okno
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {readiness?.bestQualityWindowLabel ?? 'Po check-inie pojawi się najlepsze okno jakości.'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper
              sx={{
                ...surfaceSx,
                p: 1.75,
                borderRadius: 4,
              }}
            >
              <Stack spacing={1.25}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                  Szybkie przejścia
                </Typography>
                {quickLinks.map((link) => (
                  <Button
                    key={link.label}
                    variant="outlined"
                    startIcon={link.icon}
                    onClick={link.onClick}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Stack>
            </Paper>

            {ftpProgress ? (
              <Paper
                sx={{
                  ...surfaceSx,
                  p: 1.75,
                  borderRadius: 4,
                  bgcolor: alphaColor(PMC_COLORS.CTL, 0.06),
                }}
              >
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, display: 'block', mb: 1 }}>
                  FTP
                </Typography>
                <FtpProgressCard
                  data={ftpProgress}
                  powerCurve={powerCurve}
                  weightKg={profile?.weightKg}
                />
              </Paper>
            ) : null}
          </Stack>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
