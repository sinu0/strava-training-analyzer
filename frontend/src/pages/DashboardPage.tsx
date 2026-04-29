import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BarChartIcon from '@mui/icons-material/BarChart';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AiStatusWidget from '@/components/AiStatusWidget';
import AiTipsCarousel from '@/components/AiTipsCarousel';
import EditorialHero from '@/components/common/EditorialHero';
import PageContainer from '@/components/common/PageContainer';
import PullToRefreshPanel from '@/components/common/PullToRefreshPanel';
import Section from '@/components/common/Section';
import SkeletonCard from '@/components/common/SkeletonCard';
import TabsNav from '@/components/common/TabsNav';
import FtpProgressCard from '@/components/FtpProgressCard';
import OptimalLoadChart from '@/components/OptimalLoadChart';
import ReadinessGauge from '@/components/ReadinessGauge';
import RecentActivitiesList from '@/components/RecentActivitiesList';
import BlockHealthPanel from '@/components/training/BlockHealthPanel';
import CoachSummaryPanel from '@/components/training/CoachSummaryPanel';
import ProgressionLevelsPanel from '@/components/training/ProgressionLevelsPanel';
import TrainingLoadMiniChart from '@/components/TrainingLoadMiniChart';
import WeatherWidget from '@/components/WeatherWidget';
import WeeklySummaryCard from '@/components/WeeklySummaryCard';
import ZoneDonutChart from '@/components/ZoneDonutChart';
import { useAiPredict, useAiStatus, useLatestAiPrediction, useTodayAiTips } from '@/hooks/useAi';
import {
  useActivateWeatherLocation,
  useBlockHealth,
  useAddWeatherLocation,
  useProgressionLevels,
  useDeleteWeatherLocation,
  useFtpProgress,
  usePmc,
  usePowerCurve,
  useProfile,
  useReadiness,
  useRecentActivities,
  useSaveReadinessCheckIn,
  useRefreshWeatherCache,
  useWeatherForecast,
  useWeatherGradient,
  useWeatherLocations,
  useWeeklyOptimalLoad,
  useWeeklySummaries,
  useZoneDistribution,
} from '@/hooks/useAnalytics';
import { PMC_COLORS, STATUS_COLORS } from '@/utils/colors';
import { getPageHeroIllustrationPath } from '@/utils/illustrationAssets';

function FocusWidget({
  title,
  value,
  description,
  onClick,
  accentColor,
}: {
  title: string;
  value: string;
  description: string;
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: `${accentColor}33`,
        cursor: 'pointer',
        transition: 'transform 0.16s ease, border-color 0.16s ease, background-color 0.16s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: `${accentColor}66`,
          bgcolor: `${accentColor}0D`,
        },
      }}
    >
      <Stack spacing={0.75}>
        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Paper>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [trainingTab, setTrainingTab] = useState(0);
  const [aiExpanded, setAiExpanded] = useState(true);

  const weeklySummariesQuery = useWeeklySummaries(8);
  const { data: weeklySummaries, isLoading: weeklySummariesLoading } = weeklySummariesQuery;
  const pmcQuery = usePmc({
    from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const { data: pmcData, isLoading: pmcLoading } = pmcQuery;
  const recentActivitiesQuery = useRecentActivities();
  const { data: recentActivities, isLoading: recentActivitiesLoading } = recentActivitiesQuery;
  useWeatherForecast();
  const ftpProgressQuery = useFtpProgress();
  const { data: ftpProgress, isLoading: ftpLoading } = ftpProgressQuery;
  const readinessQuery = useReadiness();
  const { data: readiness, isLoading: readinessLoading } = readinessQuery;
  const saveReadinessCheckIn = useSaveReadinessCheckIn();
  const powerCurveQuery = usePowerCurve({
    from: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const { data: powerCurve } = powerCurveQuery;
  const zoneDistributionQuery = useZoneDistribution('power', {
    from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const { data: zoneDistribution, isLoading: zoneLoading } = zoneDistributionQuery;
  const weatherLocationsQuery = useWeatherLocations();
  const { data: weatherLocations, isLoading: weatherLocationsLoading } = weatherLocationsQuery;
  const activeLocation = weatherLocations?.find((location) => location.active);
  const weatherGradientQuery = useWeatherGradient(activeLocation?.name);
  const { data: weatherGradient, isLoading: weatherGradientLoading } = weatherGradientQuery;
  const addLocation = useAddWeatherLocation();
  const deleteLocation = useDeleteWeatherLocation();
  const activateLocation = useActivateWeatherLocation();
  const refreshCache = useRefreshWeatherCache();

  const aiStatusQuery = useAiStatus();
  const { data: aiStatus } = aiStatusQuery;
  const { data: todayTips, isLoading: tipsLoading } = useTodayAiTips();
  const { data: coachSummary } = useLatestAiPrediction('TRAINING_COACH_SUMMARY');
  const generateAiPrediction = useAiPredict();
  const profileQuery = useProfile();
  const { data: profile } = profileQuery;
  const weeklyOptimalLoadQuery = useWeeklyOptimalLoad(12);
  const { data: weeklyOptimalLoad, isLoading: weeklyLoadLoading } = weeklyOptimalLoadQuery;
  const { data: progressionLevels } = useProgressionLevels();
  const { data: blockHealth } = useBlockHealth();

  const currentWeek = weeklySummaries?.[weeklySummaries.length - 1];
  const currentOptimalLoad = weeklyOptimalLoad?.[weeklyOptimalLoad.length - 1];
  const hasPmcData = Array.isArray(pmcData) && pmcData.length > 0;
  const hasWeeklyOptimalLoad = Array.isArray(weeklyOptimalLoad) && weeklyOptimalLoad.length > 0;
  const hasRecentActivities = Array.isArray(recentActivities) && recentActivities.length > 0;

  const latestPmc = useMemo(() => {
    if (!pmcData?.length) {
      return null;
    }

    return pmcData[pmcData.length - 1];
  }, [pmcData]);

  const quickLinks = [
    { label: 'Studio pogody', icon: <AutoAwesomeIcon />, onClick: () => navigate('/weather') },
    { label: 'Aktywności', icon: <DirectionsBikeIcon />, onClick: () => navigate('/activities') },
    { label: 'Analityka', icon: <BarChartIcon />, onClick: () => navigate('/analytics') },
    { label: 'Zdrowie', icon: <FavoriteBorderIcon />, onClick: () => navigate('/health') },
  ];
  const focusWidgets = [
    {
      title: 'Readiness',
      value: readiness ? `${readiness.score}/100` : 'Brak danych',
      description: readiness?.description ?? 'Poranny sygnał gotowości i check-in.',
      onClick: () => navigate('/health'),
      accentColor: STATUS_COLORS.success,
    },
    {
      title: 'Obciążenie',
      value: latestPmc ? `CTL ${Math.round(latestPmc.ctl)} / TSB ${Math.round(latestPmc.tsb)}` : 'Brak PMC',
      description: 'Skrót PMC z wejściem do głębszej analityki obciążeń.',
      onClick: () => navigate('/analytics'),
      accentColor: PMC_COLORS.CTL,
    },
    {
      title: 'Aktywności',
      value: hasRecentActivities ? recentActivities![0]!.name : 'Brak aktywności',
      description: 'Ostatnie jednostki i pełny review pojedynczych treningów.',
      onClick: () => navigate('/activities'),
      accentColor: STATUS_COLORS.info,
    },
    {
      title: 'Plan',
      value: blockHealth?.label ?? 'Brak aktywnego bloku',
      description: blockHealth?.nextFocus ?? 'Cele tygodnia, sesje i korekty planu.',
      onClick: () => navigate('/training'),
      accentColor: STATUS_COLORS.warning,
    },
    {
      title: 'Coach AI',
      value: coachSummary?.summary ?? 'Brak świeżego podsumowania',
      description: 'Skrót AI i wejście do pełnych predykcji oraz coach summary.',
      onClick: () => navigate('/ai-predictions'),
      accentColor: STATUS_COLORS.secondary,
    },
  ];

  const handleRefresh = async () => {
    await queryClient.refetchQueries();
  };

  return (
    <PageContainer
      title="Centrum danych"
      subtitle="Kompaktowe widgety i moduły, z których wchodzisz do pełnych stron analitycznych."
      breadcrumbs={[{ label: 'Home' }, { label: 'Centrum danych' }]}
    >
      <PullToRefreshPanel onRefresh={handleRefresh}>
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
        <Grid container spacing={{ xs: 2, md: 2.5 }}>
          <Grid item xs={12}>
            {(weatherLocationsLoading || weatherGradientLoading) && !weatherLocations?.length ? (
              <SkeletonCard height={360} />
            ) : (
              <Section
                title="Studio pogody dnia"
                subtitle="Flagowy moduł Centrum danych — z wejściem do pełnej strony, mapy klików i rozszerzonej analizy tygodnia."
                accentColor={STATUS_COLORS.info}
              >
                <WeatherWidget
                  gradient={weatherGradient}
                  locations={weatherLocations}
                  onActivateLocation={(name) => activateLocation.mutate(name)}
                  onAddLocation={(name, lat, lon) => addLocation.mutate({ name, lat, lon })}
                  onDeleteLocation={(name) => deleteLocation.mutate(name)}
                  onRefresh={(location) => refreshCache.mutate(location)}
                  onOpenStudio={() => navigate('/weather')}
                />
              </Section>
            )}
          </Grid>

          <Grid item xs={12}>
            <Section
              title="Widgety focus"
              subtitle="Krótki przegląd modułów — kliknij widget, żeby wejść w pełny widok danego obszaru."
              accentColor={STATUS_COLORS.highlight}
            >
              <Grid container spacing={1.5}>
                {focusWidgets.map((widget) => (
                  <Grid item xs={12} sm={6} lg={4} xl={3} key={widget.title}>
                    <FocusWidget {...widget} />
                  </Grid>
                ))}
              </Grid>
            </Section>
          </Grid>

          <Grid item xs={12} md={5}>
            {readinessLoading && !readiness ? (
              <SkeletonCard height={320} />
            ) : (
              <Section
                title="Gotowość na dziś"
                subtitle="Najważniejszy sygnał przed decyzją o intensywności treningu."
                accentColor={STATUS_COLORS.success}
              >
                <ReadinessGauge
                  data={readiness}
                  isSavingCheckIn={saveReadinessCheckIn.isPending}
                  onSaveCheckIn={(payload) => saveReadinessCheckIn.mutate(payload)}
                />
              </Section>
            )}
          </Grid>

          <Grid item xs={12} md={3}>
            {ftpLoading && !ftpProgress ? (
              <SkeletonCard height={320} />
            ) : (
              <Section title="FTP" subtitle="Próg i trend mocy" accentColor={PMC_COLORS.CTL}>
                <FtpProgressCard
                  data={ftpProgress}
                  powerCurve={powerCurve}
                  weightKg={profile?.weightKg}
                />
              </Section>
            )}
          </Grid>

          <Grid item xs={12} md={8}>
            {(weeklySummariesLoading && !currentWeek) || (pmcLoading && !hasPmcData) ? (
              <SkeletonCard height={360} />
            ) : (
              <Section
                title="Trening dziś"
                subtitle="Zestawienie tygodnia i krótkoterminowego obciążenia bez przeładowania dashboardu."
                accentColor={STATUS_COLORS.warning}
              >
                <TabsNav
                  tabs={[
                    { label: 'Tydzień', value: 0 },
                    { label: 'Obciążenie', value: 1 },
                  ]}
                  value={trainingTab}
                  onChange={setTrainingTab}
                />
                {trainingTab === 0 ? (
                  <WeeklySummaryCard summary={currentWeek} optimalLoad={currentOptimalLoad} />
                ) : (
                  <Box>
                    <TrainingLoadMiniChart data={pmcData ?? []} />
                    {!!latestPmc && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                        {([
                          { label: 'CTL', delta: latestPmc.ctlDelta, color: PMC_COLORS.CTL },
                          { label: 'ATL', delta: latestPmc.atlDelta, color: PMC_COLORS.ATL },
                          { label: 'TSB', delta: latestPmc.tsbDelta, color: PMC_COLORS.TSB },
                        ] as const).map((metric) => {
                          const rounded = Math.round(metric.delta * 10) / 10;
                          const Icon =
                            rounded > 0
                              ? TrendingUpIcon
                              : rounded < 0
                                ? TrendingDownIcon
                                : TrendingFlatIcon;

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
                )}
              </Section>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Section
              title="Szybkie przejścia"
              subtitle="Najkrótsza droga do ekranów, do których wracasz najczęściej."
              accentColor={STATUS_COLORS.highlight}
            >
              <Stack spacing={1.25}>
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
                <Button
                  variant="contained"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={() => navigate('/ai-predictions')}
                  fullWidth
                >
                  Predykcje AI
                </Button>
              </Stack>
            </Section>
          </Grid>

          <Grid item xs={12}>
            <Section
              title="Stan bloku"
              subtitle="Czy bieżący tydzień nadal dowozi właściwy bodziec, czy zaczyna się rozjeżdżać."
              accentColor={STATUS_COLORS.info}
            >
              <BlockHealthPanel blockHealth={blockHealth} />
            </Section>
          </Grid>

          <Grid item xs={12}>
            {(zoneLoading && !zoneDistribution) || (weeklyLoadLoading && !hasWeeklyOptimalLoad) ? (
              <SkeletonCard height={340} />
            ) : (
              <Section
                title="Analiza obciążeń"
                subtitle="Strefy mocy i tygodniowy TSS w jednej, logicznej sekcji."
                accentColor={STATUS_COLORS.accent}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <ZoneDonutChart data={zoneDistribution} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <OptimalLoadChart data={weeklyOptimalLoad ?? []} compact={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <ProgressionLevelsPanel levels={progressionLevels} />
                  </Grid>
                </Grid>
              </Section>
            )}
          </Grid>

          <Grid item xs={12}>
            {recentActivitiesLoading && !hasRecentActivities ? (
              <SkeletonCard height={320} />
            ) : (
              <Section
                title="Aktywności i AI"
                subtitle="Ostatnie jednostki treningowe oraz wnioski AI bez dodatkowego scrollowania."
                accentColor={STATUS_COLORS.secondary}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={7}>
                    <RecentActivitiesList activities={recentActivities ?? []} />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Accordion
                      disableGutters
                      expanded={aiExpanded}
                      onChange={(_, expanded) => setAiExpanded(expanded)}
                      elevation={0}
                      sx={{ bgcolor: 'transparent', '&::before': { display: 'none' } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 700 }}>AI — rady i status</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0 }}>
                        <Stack spacing={2}>
                          <CoachSummaryPanel
                            prediction={coachSummary}
                            isGenerating={generateAiPrediction.isPending}
                            onGenerate={() => generateAiPrediction.mutate({ predictionType: 'TRAINING_COACH_SUMMARY' })}
                          />
                          <AiTipsCarousel tips={todayTips ?? []} loading={tipsLoading} status={aiStatus} />
                          <AiStatusWidget status={aiStatus} />
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                </Grid>
              </Section>
            )}
          </Grid>
        </Grid>
      </PullToRefreshPanel>
    </PageContainer>
  );
}
