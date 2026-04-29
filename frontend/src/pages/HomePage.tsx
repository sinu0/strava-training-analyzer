import AirIcon from '@mui/icons-material/Air';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
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
import PageContainer from '@/components/common/PageContainer';
import HomeCelebrationCarousel from '@/components/home/HomeCelebrationCarousel';
import HomeWidgetCard from '@/components/home/HomeWidgetCard';
import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon';
import { useAiNote, useGenerateAiNote } from '@/hooks/useAi';
import {
  useBlockHealth,
  useFtpProgress,
  useProgressionLevels,
  useReadiness,
  useRecentActivities,
  useWeatherGradient,
  useWeatherLocations,
} from '@/hooks/useAnalytics';
import { useAchievements } from '@/hooks/useGamification';
import type { ActivitySummary } from '@/types/activity';
import type { ProgressionLevel, WeatherGradient } from '@/types/analytics';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { getHomeWidgetIllustrationPath } from '@/utils/illustrationAssets';
import { getReadinessColor } from '@/utils/readinessScales';

const surfaceSx = {
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: (theme: { tokens?: { cardShadow?: string } }) => theme.tokens?.cardShadow ?? 'none',
} as const;

const HOME_WIDGET_ART = {
  weather: getHomeWidgetIllustrationPath('weather'),
  readiness: getHomeWidgetIllustrationPath('readiness'),
  block: getHomeWidgetIllustrationPath('block'),
  progress: getHomeWidgetIllustrationPath('progress'),
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

function RecentActivityStoryCard({
  activity,
  onOpen,
}: {
  activity: ActivitySummary;
  onOpen: () => void;
}) {
  return (
    <Paper
      sx={{
        ...surfaceSx,
        p: { xs: 1.75, md: 2 },
        backgroundImage: `linear-gradient(180deg, ${alphaColor(STATUS_COLORS.accent, 0.06)} 0%, ${alphaColor(
          STATUS_COLORS.secondary,
          0.03,
        )} 100%)`,
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

        <Paper
          sx={{
            p: 1.5,
            borderRadius: 3,
            bgcolor: alphaColor(STATUS_COLORS.accent, 0.06),
            border: '1px solid',
            borderColor: alphaColor(STATUS_COLORS.accent, 0.12),
          }}
        >
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeIcon sx={{ color: STATUS_COLORS.accent, fontSize: '1rem' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Szybki opis AI
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{
                display: '-webkit-box',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {buildGenericSummary(activity)}
            </Typography>
          </Stack>
        </Paper>

        <Box>
          <Button variant="contained" startIcon={<OpenInNewIcon />} onClick={onOpen}>
            Pokaż pełną aktywność
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

function getWeatherAccent(score: number | undefined) {
  if (score == null) {
    return STATUS_COLORS.info;
  }
  if (score >= 80) {
    return STATUS_COLORS.success;
  }
  if (score >= 60) {
    return STATUS_COLORS.accent;
  }
  if (score >= 40) {
    return STATUS_COLORS.warning;
  }
  return STATUS_COLORS.error;
}

function MetricPill({
  icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      sx={{
        minWidth: 0,
        flex: '1 1 96px',
        px: 0.95,
        py: 0.75,
        borderRadius: 999,
        bgcolor: alphaColor(accentColor, 0.12),
        border: '1px solid',
        borderColor: alphaColor(accentColor, 0.16),
      }}
    >
      <Box sx={{ color: accentColor, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function WeatherMiniWidget({
  gradient,
  onOpen,
}: {
  gradient: WeatherGradient | undefined;
  onOpen: () => void;
}) {
  const current = gradient?.current;
  const accentColor = getWeatherAccent(current?.outdoorScore);

  return (
     <HomeWidgetCard
       title="Pogoda"
       subtitle={gradient?.locationName ?? 'Aktywna lokalizacja'}
       accentColor={accentColor}
       minHeight={{ xs: 392, sm: 408, xl: 428 }}
       artwork={{
         src: HOME_WIDGET_ART.weather,
         alt: 'Pogoda na Home',
          testId: 'home-widget-art-pogoda',
          objectPosition: 'center 62%',
         height: { xs: 124, sm: 146 },
       }}
       subtitleLines={1}
       onClick={onOpen}
     >
      <Stack justifyContent="space-between" sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1 }}>
              {current ? `${Math.round(current.temperature)}°` : '--'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                display: '-webkit-box',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {current?.weatherDescription ?? 'Ładowanie warunków'}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: alphaColor(accentColor, 0.16),
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <WeatherConditionIcon
              code={current?.weatherCode}
              size={20}
              alt={current?.weatherDescription ?? 'Ikona pogody'}
            />
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <MetricPill
            icon={<AirIcon sx={{ fontSize: 14 }} />}
            label="Wiatr"
            value={current ? `${Math.round(current.windSpeed)} km/h` : '--'}
            accentColor={accentColor}
          />
          <MetricPill
            icon={<WaterDropIcon sx={{ fontSize: 14 }} />}
            label="Opad"
            value={current ? `${current.precipitation} mm` : '--'}
            accentColor={accentColor}
          />
          <MetricPill
            icon={<WeatherConditionIcon kind="sunny" size={14} alt="" />}
            label="Outdoor"
            value={current ? `${current.outdoorScore}/100` : '--'}
            accentColor={accentColor}
          />
        </Stack>
      </Stack>
    </HomeWidgetCard>
  );
}

function ReadinessMiniWidget({
  readiness,
  onOpen,
}: {
  readiness: ReturnType<typeof useReadiness>['data'];
  onOpen: () => void;
}) {
  const accentColor = getReadinessColor(readiness?.score ?? 55);

  return (
    <HomeWidgetCard
      title="Gotowość"
      subtitle={readiness?.dayLabel ?? 'Brak decyzji dnia'}
      accentColor={accentColor}
      minHeight={{ xs: 432, sm: 456, xl: 476 }}
      artwork={{
        src: HOME_WIDGET_ART.readiness,
        alt: 'Gotowość na Home',
        testId: 'home-widget-art-readiness',
        objectPosition: 'center 48%',
        height: { xs: 122, sm: 146 },
      }}
      subtitleLines={1}
      onClick={onOpen}
    >
      <Stack justifyContent="space-between" alignItems="center" spacing={1.4} sx={{ height: '100%', minWidth: 0 }}>
        <Box
          sx={{
            width: { xs: 82, sm: 96 },
            height: { xs: 82, sm: 96 },
            borderRadius: '50%',
            border: { xs: '7px solid', sm: '8px solid' },
            borderColor: alphaColor(accentColor, 0.2),
            boxShadow: `inset 0 0 0 1px ${alphaColor(accentColor, 0.18)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alphaColor(accentColor, 0.08),
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1, color: accentColor }}>
              {readiness?.score ?? '--'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              /100
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 0, maxWidth: 240 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.35,
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {readiness?.dayFocus ?? 'Po porannym check-inie pojawi się decyzja.'}
          </Typography>
        </Box>
      </Stack>
    </HomeWidgetCard>
  );
}

function BlockMiniWidget({
  blockHealth,
  onOpen,
}: {
  blockHealth: ReturnType<typeof useBlockHealth>['data'];
  onOpen: () => void;
}) {
  return (
    <HomeWidgetCard
      title="Blok"
      subtitle={blockHealth?.status ?? 'Brak aktywnego programu'}
      accentColor={STATUS_COLORS.warning}
      minHeight={{ xs: 392, sm: 408, xl: 428 }}
      artwork={{
        src: HOME_WIDGET_ART.block,
        alt: 'Blok treningowy na Home',
        testId: 'home-widget-art-blok',
        objectPosition: 'center 50%',
        height: { xs: 124, sm: 146 },
      }}
      subtitleLines={1}
      onClick={onOpen}
    >
      <Stack justifyContent="space-between" sx={{ height: '100%' }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              lineHeight: 1.05,
              mb: 0.75,
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {blockHealth?.label ?? 'Brak aktywnego bloku'}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {blockHealth?.description ?? 'Planner pokaże stan bloku, gdy pojawi się aktywny program.'}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1,
            borderRadius: 3,
            bgcolor: alphaColor(STATUS_COLORS.warning, 0.12),
            border: '1px solid',
            borderColor: alphaColor(STATUS_COLORS.warning, 0.18),
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Najbliższy focus
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              mt: 0.25,
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {blockHealth?.nextFocus ?? 'Po aktywacji programu pojawi się kolejny krok.'}
          </Typography>
        </Box>
      </Stack>
    </HomeWidgetCard>
  );
}

function ProgressMiniWidget({
  progression,
  aiLabel,
  onOpen,
}: {
  progression: ProgressionLevel | undefined;
  aiLabel: string;
  onOpen: () => void;
}) {
  const trendIcon =
    progression?.trend === 'UP' ? (
      <TrendingUpIcon sx={{ fontSize: 16 }} />
    ) : progression?.trend === 'DOWN' ? (
      <TrendingDownIcon sx={{ fontSize: 16 }} />
    ) : (
      <TrendingFlatIcon sx={{ fontSize: 16 }} />
    );

  return (
    <HomeWidgetCard
      title="Postęp"
      subtitle={aiLabel}
      accentColor={STATUS_COLORS.accent}
      minHeight={{ xs: 408, sm: 424, xl: 444 }}
      artwork={{
        src: HOME_WIDGET_ART.progress,
        alt: 'Postęp na Home',
        testId: 'home-widget-art-progres',
        objectPosition: 'center 52%',
        height: { xs: 118, sm: 138 },
      }}
      subtitleLines={1}
      onClick={onOpen}
    >
      <Stack justifyContent="space-between" sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1 }}>
              {progression?.level ?? '--'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {progression?.label ?? 'Brak systemu'}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: alphaColor(STATUS_COLORS.accent, 0.16),
              color: STATUS_COLORS.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {trendIcon}
          </Box>
        </Stack>

        <Stack spacing={0.75}>
          <MetricPill
            icon={<BoltIcon sx={{ fontSize: 14 }} />}
            label="Obciążenie"
            value={progression ? `${Math.round(progression.currentLoad)}/${Math.round(progression.targetLoad)}` : '--'}
            accentColor={STATUS_COLORS.accent}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {progression?.nextRecommendation ?? 'Brak mocnego sygnału progresji dla tego systemu.'}
          </Typography>
        </Stack>
      </Stack>
    </HomeWidgetCard>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const readinessQuery = useReadiness();
  const { data: readiness } = readinessQuery;
  const blockHealthQuery = useBlockHealth();
  const { data: blockHealth } = blockHealthQuery;
  const progressionLevelsQuery = useProgressionLevels();
  const { data: progressionLevels } = progressionLevelsQuery;
  const recentActivitiesQuery = useRecentActivities(7);
  const { data: recentActivities } = recentActivitiesQuery;
  const { data: ftpProgress, isLoading: isFtpProgressLoading } = useFtpProgress();
  const achievementsQuery = useAchievements();
  const { data: achievements } = achievementsQuery;
  const { data: weatherLocations } = useWeatherLocations();
  const activeWeatherLocation = weatherLocations?.find((location) => location.active);
  const { data: weatherGradient } = useWeatherGradient(activeWeatherLocation?.name);
  const generateAiNote = useGenerateAiNote();

  const latestActivity = recentActivities?.[0] ?? null;
  const previousActivities = recentActivities?.slice(1, 7) ?? [];
  const topProgression = progressionLevels?.[0];
  const { data: latestAiNote } = useAiNote(latestActivity?.id);
  const homeCelebrationsReady =
    !recentActivitiesQuery.isLoading &&
    !progressionLevelsQuery.isLoading &&
    !achievementsQuery.isLoading &&
    !isFtpProgressLoading;

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
            <WeatherMiniWidget gradient={weatherGradient} onOpen={() => navigate('/dashboard')} />
            <ProgressMiniWidget
              progression={topProgression}
              aiLabel={aiState.label}
              onOpen={() => navigate('/analytics')}
            />
          </Stack>
        </Grid>

        <Grid item xs={12} xl={6} order={{ xs: 1, xl: 2 }}>
          <Stack spacing={2.5}>
            <Paper
              sx={{
                ...surfaceSx,
                p: { xs: 2, md: 2.5 },
                overflow: 'hidden',
                backgroundImage: `linear-gradient(180deg, ${alphaColor(
                  STATUS_COLORS.accent,
                  0.08,
                )} 0%, ${alphaColor(STATUS_COLORS.success, 0.03)} 100%)`,
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
                    Ostatni trening
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.04, mt: 0.5 }}>
                    {latestActivity?.name ?? 'Czekam na nową aktywność'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    {latestActivity
                      ? `${new Date(latestActivity.startedAt).toLocaleDateString('pl-PL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })} · ${latestActivity.sportType}`
                      : 'Po kolejnym syncu to miejsce stanie się głównym wejściem do dnia treningowego.'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {latestActivity ? (
                    <>
                      <Chip
                        label={formatDistance(latestActivity.distanceM)}
                        variant="outlined"
                        color="primary"
                      />
                      <Chip
                        label={formatDuration(latestActivity.movingTimeSec)}
                        variant="outlined"
                      />
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
                    {latestActivity ? (
                      <Button
                        variant="contained"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => navigate(`/activities/${latestActivity.id}`)}
                      >
                        Pokaż pełną aktywność
                      </Button>
                    ) : null}

                    {latestActivity && aiState.tone === 'fallback' ? (
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

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => navigate('/training')}
                >
                  Plan i kolejny krok
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<InsightsOutlinedIcon />}
                  onClick={() => navigate('/dashboard')}
                >
                  Centrum danych
                </Button>
                <Button
                  variant="text"
                  startIcon={<DirectionsBikeIcon />}
                  onClick={() => navigate('/activities')}
                >
                  Historia treningów
                </Button>
              </Box>
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
                    Każda poprzednia aktywność dostaje własny blok, mapę i szybki opis.
                  </Typography>
                </Box>
                <Button variant="text" onClick={() => navigate('/activities')}>
                  Wszystkie aktywności
                </Button>
              </Stack>

              <Stack data-testid="recent-activity-stories" spacing={1.5}>
                {previousActivities.map((activity) => (
                  <RecentActivityStoryCard
                    key={activity.id}
                    activity={activity}
                    onOpen={() => navigate(`/activities/${activity.id}`)}
                  />
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
            />

            <BlockMiniWidget blockHealth={blockHealth} onOpen={() => navigate('/training')} />

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
          </Stack>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
