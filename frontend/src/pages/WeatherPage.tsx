import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import TerrainOutlinedIcon from '@mui/icons-material/TerrainOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { weatherMessages } from '@/components/weather/messages';
import WeatherAlgorithmPanel from '@/components/weather/WeatherAlgorithmPanel';
import WeatherForecastViews from '@/components/weather/WeatherForecastViews';
import WeatherLocationMenu from '@/components/weather/WeatherLocationMenu';
import WeatherStudioMap from '@/components/weather/WeatherStudioMap';
import WeatherWidgetHeader from '@/components/weather/WeatherWidgetHeader';
import { getCyclistType } from '@/components/weather/weatherWidgetUtils';
import {
  useAddWeatherLocation,
  useActivateWeatherLocation,
  useDeleteWeatherLocation,
  useRefreshWeatherCache,
  useWeatherGradient,
  useWeatherLocations,
  useWeatherPointGradient,
} from '@/hooks/useAnalytics';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getAppThemeTokens } from '@/theme/theme';
import { Page, Widget } from '@/ui';
import { alphaColor, CHART_COLORS, STATUS_COLORS } from '@/utils/colors';
import { getWeatherIllustrationPath } from '@/utils/illustrationAssets';
import {
  buildWeatherComparison,
  buildWeatherDecision,
  defaultWeatherScoringProfile,
  adaptWeatherGradientForProfile,
} from '@/utils/weatherScoring';

export default function WeatherPage() {
  const t = weatherMessages.useT();
  const theme = useTheme();
  const themeTokens = getAppThemeTokens(theme);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: locations = [] } = useWeatherLocations();
  const addLocation = useAddWeatherLocation();
  const activateLocation = useActivateWeatherLocation();
  const deleteLocation = useDeleteWeatherLocation();
  const refreshCache = useRefreshWeatherCache();
  const [locationMenuAnchor, setLocationMenuAnchor] = useState<HTMLElement | null>(null);
  const activeLocation = locations.find((location) => location.active) ?? locations[0];
  const [selectedPoint, setSelectedPoint] = useLocalStorage('weather-studio-point-v1', {
    lat: activeLocation?.latitude ?? 50.0614,
    lon: activeLocation?.longitude ?? 19.9366,
    label: activeLocation?.name ?? t('page.defaultPointLabel'),
  });
  const [profile, setProfile] = useLocalStorage(
    'weather-studio-profile-v1',
    defaultWeatherScoringProfile,
  );
  const [forecastView, setForecastView] = useLocalStorage<'today' | 'week'>(
    'weather-studio-view-v1',
    'today',
  );

  const { data: activeGradient } = useWeatherGradient(activeLocation?.name);
  const { data: rawPointGradient } = useWeatherPointGradient(
    selectedPoint.lat,
    selectedPoint.lon,
    selectedPoint.label,
  );

  const pointGradient = useMemo(
    () =>
      rawPointGradient
        ? adaptWeatherGradientForProfile(rawPointGradient, profile)
        : undefined,
    [profile, rawPointGradient],
  );

  const decision = pointGradient ? buildWeatherDecision(pointGradient) : null;
  const comparison = buildWeatherComparison(pointGradient, activeGradient);
  const today = pointGradient?.days[0];
  const tomorrow = pointGradient?.days[1];
  const cyclistType = pointGradient
    ? getCyclistType(
        pointGradient.current.weatherCode,
        pointGradient.current.windSpeed,
        pointGradient.current.temperature,
      )
    : 'cloudy';

  const handleProfileChange = (key: keyof typeof profile, value: number) => {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleRefresh = () => {
    if (activeLocation?.name) {
      refreshCache.mutate(activeLocation.name);
    }
    // Invalidate the point data — it will be refetched from the backend
    queryClient.invalidateQueries({ queryKey: ['weatherPointGradient', selectedPoint.lat, selectedPoint.lon, selectedPoint.label] });
  };

  const handleActivateLocation = (name: string) => {
    const location = locations.find((candidate) => candidate.name === name);
    if (location) {
      setSelectedPoint({
        lat: location.latitude,
        lon: location.longitude,
        label: location.name,
      });
    }
    activateLocation.mutate(name);
  };

  return (
    <Page
      title={t('page.title')}
      subtitle={t('page.subtitle')}
      breadcrumbs={[{ label: t('page.breadcrumbHome') }, { label: t('page.title') }]}
    >
      <Stack spacing={2.5}>
        {/* Compact header — instead of the full EditorialHero */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: (currentTheme) => getAppThemeTokens(currentTheme).space.card,
            borderRadius: (currentTheme) => `${getAppThemeTokens(currentTheme).radius.card}px`,
            border: '1px solid',
            borderColor: alphaColor(CHART_COLORS.secondary, 0.18),
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', fontSize: '0.68rem' }}
            >
              {t('page.overline')}
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1.15, mt: 0.25 }}>
              {t('page.heroTitle')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                display: 'block'
              }}>
              {t('page.heroSubtitle')}
            </Typography>
            <Stack
              direction="row"
              spacing={0.5}
              useFlexGap
              sx={{
                flexWrap: "wrap",
                mt: 0.75
              }}>
              {[t('page.tagMap'), t('page.tagLiveScoring'), t('page.tagDecision')].map((tag) => (
                <Box
                  key={tag}
                  sx={{
                    px: 1,
                    py: 0.3,
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: alphaColor(CHART_COLORS.secondary, 0.2),
                    bgcolor: alphaColor(theme.palette.background.default, 0.28),
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: (currentTheme) => getAppThemeTokens(currentTheme).type.weight.label, fontSize: '0.68rem' }}>
                    {tag}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
          <Box
            component="img"
            src={getWeatherIllustrationPath(cyclistType)}
            alt={t('page.heroAlt')}
            sx={{
              width: { xs: 72, md: 90 },
              height: { xs: 54, md: 68 },
              borderRadius: 2,
              objectFit: 'cover',
              objectPosition: 'center',
              flexShrink: 0,
              border: `1px solid ${alphaColor(CHART_COLORS.secondary, 0.14)}`,
              filter: 'saturate(0.88) contrast(1.03)',
            }}
          />
        </Box>

        <Grid container spacing={2.5}>
          {/* Main column — map and forecast */}
          <Grid
            size={{
              xs: 12,
              xl: 8
            }}>
            <Stack spacing={2.5}>
              <Widget
                title={t('page.focusPointTitle')}
                subtitle={t('page.focusPointSubtitle')}
              >
                <Stack spacing={1.5}>
                  <WeatherStudioMap
                    selectedPoint={selectedPoint}
                    locations={locations}
                    onSelectPoint={setSelectedPoint}
                  />
                  <Stack direction="row" spacing={1} useFlexGap sx={{
                    flexWrap: "wrap"
                  }}>
                    <Chip icon={<PlaceOutlinedIcon />} label={selectedPoint.label} />
                    <Chip label={`${selectedPoint.lat.toFixed(4)}, ${selectedPoint.lon.toFixed(4)}`} />
                    {!!comparison && <Chip icon={<TerrainOutlinedIcon />} label={comparison} />}
                  </Stack>
                </Stack>
              </Widget>

              <Widget
                title={t('page.dayWeekTitle')}
                subtitle={t('page.dayWeekSubtitle')}
              >
                {pointGradient ? (
                  <WeatherForecastViews
                    gradient={pointGradient}
                    view={forecastView}
                    onViewChange={setForecastView}
                  />
                ) : (
                  <Typography sx={{
                    color: "text.secondary"
                  }}>{t('page.loadingForecast')}</Typography>
                )}
              </Widget>
            </Stack>
          </Grid>

          {/* Side rail — decision, algorithm, actions */}
          <Grid
            size={{
              xs: 12,
              xl: 4
            }}>
            <Stack
              spacing={2.5}
              sx={{
                position: { xs: 'static', xl: 'sticky' },
                top: { xl: 24 },
                alignSelf: 'flex-start',
              }}
            >
              <Widget
                title={t('page.decisionTitle')}
                subtitle={t('page.decisionSubtitle')}
                action={
                  <Tooltip title={t('page.refreshTooltip')}>
                    <IconButton
                      size="small"
                      onClick={handleRefresh}
                      disabled={refreshCache.isPending}
                      sx={{
                        color: themeTokens.status.accent,
                        bgcolor: alphaColor(themeTokens.status.accent, 0.08),
                        border: `1px solid ${alphaColor(themeTokens.status.accent, 0.25)}`,
                        '&:hover': { bgcolor: alphaColor(themeTokens.status.accent, 0.16) },
                      }}
                    >
                      <RefreshIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                }
              >
                {pointGradient ? (
                  <Stack spacing={2}>
                    <WeatherWidgetHeader
                      locationName={pointGradient.locationName}
                      weatherDescription={pointGradient.current.weatherDescription}
                      temperature={pointGradient.current.temperature}
                      weatherCode={pointGradient.current.weatherCode}
                      windSpeed={pointGradient.current.windSpeed}
                      precipitation={pointGradient.current.precipitation}
                      outdoorScore={pointGradient.current.outdoorScore}
                      cyclistType={cyclistType}
                      onOpenSettings={(event: MouseEvent<HTMLButtonElement>) => {
                        setLocationMenuAnchor(event.currentTarget);
                      }}
                    />
                    <WeatherLocationMenu
                      anchorEl={locationMenuAnchor}
                      open={Boolean(locationMenuAnchor)}
                      locations={locations}
                      activeLocationName={activeLocation?.name}
                      onClose={() => setLocationMenuAnchor(null)}
                      onActivateLocation={handleActivateLocation}
                      onAddLocation={(name, lat, lon) => {
                        addLocation.mutate({ name, lat, lon });
                      }}
                      onDeleteLocation={(name) => deleteLocation.mutate(name)}
                      onRefresh={(name) => refreshCache.mutate(name)}
                    />
                    {!!decision && (
                      <Alert severity={decision.variant === 'indoor' ? 'warning' : 'success'}>
                        <strong>{decision.title}</strong> — {decision.detail}
                      </Alert>
                    )}
                    <Grid container spacing={1.5}>
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6
                        }}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alphaColor(STATUS_COLORS.accent, 0.04),
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: (currentTheme) => getAppThemeTokens(currentTheme).type.weight.label }}>
                            {t('page.bestWindowToday')}
                          </Typography>
                          <Typography variant="h5" sx={{ mt: 0.5 }}>
                            {today?.bestWindowStart ?? '—'} — {today?.bestWindowEnd ?? '—'}
                          </Typography>
                          <Typography variant="body2" sx={{
                            color: "text.secondary"
                          }}>
                            {t('page.score', { score: today?.bestWindowScore ?? 0 })}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6
                        }}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alphaColor(STATUS_COLORS.accent, 0.04),
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: (currentTheme) => getAppThemeTokens(currentTheme).type.weight.label }}>
                            {t('page.bestWindowTomorrow')}
                          </Typography>
                          <Typography variant="h5" sx={{ mt: 0.5 }}>
                            {tomorrow?.bestWindowStart ?? '—'} — {tomorrow?.bestWindowEnd ?? '—'}
                          </Typography>
                          <Typography variant="body2" sx={{
                            color: "text.secondary"
                          }}>
                            {t('page.score', { score: tomorrow?.bestWindowScore ?? 0 })}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Stack>
                ) : (
                  <Typography sx={{
                    color: "text.secondary"
                  }}>{t('page.loadingFullAnalysis')}</Typography>
                )}
              </Widget>

              <Widget
                title={t('page.algorithmTitle')}
                subtitle={t('page.algorithmSubtitle')}
              >
                <WeatherAlgorithmPanel profile={profile} onChange={handleProfileChange} />
              </Widget>

              <Widget
                title={t('page.quickActionsTitle')}
                subtitle={t('page.quickActionsSubtitle')}
              >
                <Stack spacing={1.2}>
                  <Button
                    variant="contained"
                    startIcon={<PlaceOutlinedIcon />}
                    onClick={() =>
                      addLocation.mutate({
                        name: selectedPoint.label,
                        lat: selectedPoint.lat,
                        lon: selectedPoint.lon,
                      })
                    }
                  >
                    {t('page.saveAsLocation')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={() => navigate('/routes?showWeather=1')}
                  >
                    {t('page.openPlannerWithWeather')}
                  </Button>
                </Stack>
              </Widget>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Page>
  );
}
