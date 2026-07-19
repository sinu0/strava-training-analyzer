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
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import PageContainer from '@/components/common/PageContainer';
import Section from '@/components/common/Section';
import WeatherAlgorithmPanel from '@/components/weather/WeatherAlgorithmPanel';
import WeatherForecastViews from '@/components/weather/WeatherForecastViews';
import WeatherStudioMap from '@/components/weather/WeatherStudioMap';
import WeatherWidgetHeader from '@/components/weather/WeatherWidgetHeader';
import { getCyclistType } from '@/components/weather/weatherWidgetUtils';
import {
  useAddWeatherLocation,
  useRefreshWeatherCache,
  useWeatherGradient,
  useWeatherLocations,
  useWeatherPointGradient,
} from '@/hooks/useAnalytics';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import theme from '@/theme/theme';
import { alphaColor, CHART_COLORS, STATUS_COLORS } from '@/utils/colors';
import { getWeatherIllustrationPath } from '@/utils/illustrationAssets';
import {
  buildWeatherComparison,
  buildWeatherDecision,
  defaultWeatherScoringProfile,
  adaptWeatherGradientForProfile,
} from '@/utils/weatherScoring';

export default function WeatherPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: locations = [] } = useWeatherLocations();
  const addLocation = useAddWeatherLocation();
  const refreshCache = useRefreshWeatherCache();
  const activeLocation = locations.find((location) => location.active) ?? locations[0];
  const [selectedPoint, setSelectedPoint] = useLocalStorage('weather-studio-point-v1', {
    lat: activeLocation?.latitude ?? 50.0614,
    lon: activeLocation?.longitude ?? 19.9366,
    label: activeLocation?.name ?? 'Punkt fokusowy',
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
    // Invaliduj dane punktu — pobierze na nowo z backendu
    queryClient.invalidateQueries({ queryKey: ['weatherPointGradient', selectedPoint.lat, selectedPoint.lon, selectedPoint.label] });
  };

  return (
    <PageContainer
      title="Studio pogody"
      subtitle="Pełny widok pogody dla decyzji treningowej i eksploracji punktów na mapie."
      breadcrumbs={[{ label: 'Home' }, { label: 'Studio pogody' }]}
    >
      <Stack spacing={2.5}>
        {/* Kompaktowy nagłówek — zamiast pełnego EditorialHero */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: { xs: 1.5, md: 2 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: alphaColor(CHART_COLORS.secondary, 0.18),
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', letterSpacing: '0.08em', fontWeight: 800, fontSize: '0.68rem' }}
            >
              Pogoda
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.15, mt: 0.25 }}>
              Studio pogody dla decyzji treningowych
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Kliknij punkt na mapie, zobacz dzień i tydzień, dostroj algorytm.
            </Typography>
            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
              {['Mapa klików', 'Live scoring', 'Decyzja'].map((tag) => (
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
                  <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.68rem' }}>
                    {tag}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
          <Box
            component="img"
            src={getWeatherIllustrationPath(cyclistType)}
            alt="Studio pogody"
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
          {/* Główna kolumna — mapa i forecast */}
          <Grid item xs={12} xl={8}>
            <Stack spacing={2.5}>
              <Section
                title="Punkt fokusowy"
                subtitle="Kliknij na mapie lub wybierz zapisane miejsce, aby przebudować całą analizę."
                accentColor={theme.tokens.chart.secondary}
              >
                <Stack spacing={1.5}>
                  <WeatherStudioMap
                    selectedPoint={selectedPoint}
                    locations={locations}
                    onSelectPoint={setSelectedPoint}
                  />
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip icon={<PlaceOutlinedIcon />} label={selectedPoint.label} />
                    <Chip label={`${selectedPoint.lat.toFixed(4)}, ${selectedPoint.lon.toFixed(4)}`} />
                    {!!comparison && <Chip icon={<TerrainOutlinedIcon />} label={comparison} />}
                  </Stack>
                </Stack>
              </Section>

              <Section
                title="Dzień i tydzień"
                subtitle="Histogram i forecast przeliczone dokładnie według Twoich ustawień."
                accentColor={theme.tokens.chart.secondary}
              >
                {pointGradient ? (
                  <WeatherForecastViews
                    gradient={pointGradient}
                    view={forecastView}
                    onViewChange={setForecastView}
                  />
                ) : (
                  <Typography color="text.secondary">Ładowanie widoku forecastu…</Typography>
                )}
              </Section>
            </Stack>
          </Grid>

          {/* Boczna szyna — decyzja, algorytm, akcje */}
          <Grid item xs={12} xl={4}>
            <Stack
              spacing={2.5}
              sx={{
                position: { xs: 'static', xl: 'sticky' },
                top: { xl: 24 },
                alignSelf: 'flex-start',
              }}
            >
              <Section
                title="Decyzja treningowa"
                subtitle="Ta sama logika forecastu, ale z pełną kontrolą nad interpretacją."
                accentColor={theme.tokens.status.accent}
                action={
                  <Tooltip title="Odśwież dane pogodowe">
                    <IconButton
                      size="small"
                      onClick={handleRefresh}
                      disabled={refreshCache.isPending}
                      sx={{
                        color: theme.tokens.status.accent,
                        bgcolor: alphaColor(theme.tokens.status.accent, 0.08),
                        border: `1px solid ${alphaColor(theme.tokens.status.accent, 0.25)}`,
                        '&:hover': { bgcolor: alphaColor(theme.tokens.status.accent, 0.16) },
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
                      onOpenSettings={handleRefresh}
                    />
                    {!!decision && (
                      <Alert severity={decision.variant === 'indoor' ? 'warning' : 'success'}>
                        <strong>{decision.title}</strong> — {decision.detail}
                      </Alert>
                    )}
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alphaColor(STATUS_COLORS.accent, 0.04),
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Najlepsze okno dziś
                          </Typography>
                          <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 800 }}>
                            {today?.bestWindowStart ?? '—'} — {today?.bestWindowEnd ?? '—'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Score {today?.bestWindowScore ?? 0}/100
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alphaColor(STATUS_COLORS.accent, 0.04),
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Jutro
                          </Typography>
                          <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 800 }}>
                            {tomorrow?.bestWindowStart ?? '—'} — {tomorrow?.bestWindowEnd ?? '—'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Score {tomorrow?.bestWindowScore ?? 0}/100
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Stack>
                ) : (
                  <Typography color="text.secondary">Ładowanie pełnej analizy punktu…</Typography>
                )}
              </Section>

              <Section
                title="Sterowanie algorytmem"
                subtitle="Parametry są stale pod ręką i od razu wpływają na histogram oraz rekomendacje."
                accentColor={theme.tokens.chart.primary}
              >
                <WeatherAlgorithmPanel profile={profile} onChange={handleProfileChange} />
              </Section>

              <Section
                title="Szybkie akcje"
                subtitle="Najkrótsza droga z explorera pogody do dalszych działań."
                accentColor={theme.tokens.status.highlight}
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
                    Zapisz punkt jako lokalizację
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={() => navigate('/route-planner?showWeather=1')}
                  >
                    Otwórz planer z pogodą
                  </Button>
                </Stack>
              </Section>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </PageContainer>
  );
}
