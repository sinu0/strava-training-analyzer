import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import TerrainOutlinedIcon from '@mui/icons-material/TerrainOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import EditorialHero from '@/components/common/EditorialHero';
import PageContainer from '@/components/common/PageContainer';
import Section from '@/components/common/Section';
import WeatherForecastViews from '@/components/weather/WeatherForecastViews';
import WeatherStudioMap from '@/components/weather/WeatherStudioMap';
import WeatherWidgetHeader from '@/components/weather/WeatherWidgetHeader';
import { getCyclistType } from '@/components/weather/weatherWidgetUtils';
import {
  useAddWeatherLocation,
  useWeatherGradient,
  useWeatherLocations,
  useWeatherPointGradient,
} from '@/hooks/useAnalytics';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import theme from '@/theme/theme';
import { getWeatherIllustrationPath } from '@/utils/illustrationAssets';
import {
  buildWeatherComparison,
  buildWeatherDecision,
  defaultWeatherScoringProfile,
  adaptWeatherGradientForProfile,
} from '@/utils/weatherScoring';

export default function WeatherPage() {
  const navigate = useNavigate();
  const { data: locations = [] } = useWeatherLocations();
  const addLocation = useAddWeatherLocation();
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

  const updateNumericField = (
    key: keyof typeof profile,
    value: string,
  ) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return;
    }
    setProfile((current) => ({
      ...current,
      [key]: numericValue,
    }));
  };

  return (
    <PageContainer
      title="Studio pogody"
      subtitle="Pełny widok pogody dla decyzji treningowej i eksploracji punktów na mapie."
      breadcrumbs={[{ label: 'Centrum danych' }, { label: 'Studio pogody' }]}
    >
      <Stack spacing={2.5}>
        <EditorialHero
          eyebrow="Pogoda"
          title="Studio pogody dla realnych decyzji treningowych, nie tylko podglądu forecastu."
          description="Klikasz punkt na mapie, od razu widzisz pełny dzień i tydzień, a algorytm masz pod ręką do własnego strojenia."
          accentColor={theme.tokens.chart.secondary}
          imageSrc={getWeatherIllustrationPath(cyclistType)}
          imageAlt="Studio pogody"
          highlights={['Mapa klików', 'Live scoring', 'Decyzja treningowa']}
        />

        <Grid container spacing={2.5}>
          <Grid item xs={12} xl={8}>
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
          </Grid>

          <Grid item xs={12} xl={4}>
            <Section
              title="Sterowanie algorytmem"
              subtitle="Rozsuwane ustawienia są stale pod ręką i od razu wpływają na histogram oraz rekomendacje."
              accentColor={theme.tokens.chart.primary}
            >
              <Stack spacing={1}>
                <Accordion disableGutters defaultExpanded sx={{ bgcolor: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 700 }}>Okno jazdy</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1.2}>
                      <TextField
                        label="Start okna"
                        type="number"
                        value={profile.rideWindowStartHour}
                        onChange={(event) => updateNumericField('rideWindowStartHour', event.target.value)}
                      />
                      <TextField
                        label="Koniec okna"
                        type="number"
                        value={profile.rideWindowEndHour}
                        onChange={(event) => updateNumericField('rideWindowEndHour', event.target.value)}
                      />
                    </Stack>
                  </AccordionDetails>
                </Accordion>
                <Accordion disableGutters sx={{ bgcolor: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 700 }}>Temperatura</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1.2}>
                      <TextField
                        label="Idealne minimum"
                        type="number"
                        value={profile.idealTemperatureMin}
                        onChange={(event) => updateNumericField('idealTemperatureMin', event.target.value)}
                      />
                      <TextField
                        label="Idealne maksimum"
                        type="number"
                        value={profile.idealTemperatureMax}
                        onChange={(event) => updateNumericField('idealTemperatureMax', event.target.value)}
                      />
                      <TextField
                        label="Akceptowalne minimum"
                        type="number"
                        value={profile.acceptableTemperatureMin}
                        onChange={(event) => updateNumericField('acceptableTemperatureMin', event.target.value)}
                      />
                      <TextField
                        label="Akceptowalne maksimum"
                        type="number"
                        value={profile.acceptableTemperatureMax}
                        onChange={(event) => updateNumericField('acceptableTemperatureMax', event.target.value)}
                      />
                    </Stack>
                  </AccordionDetails>
                </Accordion>
                <Accordion disableGutters sx={{ bgcolor: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 700 }}>Wiatr, opady i wagi</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1.2}>
                      <TextField
                        label="Komfortowy wiatr"
                        type="number"
                        value={profile.comfortableWindMax}
                        onChange={(event) => updateNumericField('comfortableWindMax', event.target.value)}
                      />
                      <TextField
                        label="Ryzykowny wiatr"
                        type="number"
                        value={profile.riskyWindMax}
                        onChange={(event) => updateNumericField('riskyWindMax', event.target.value)}
                      />
                      <TextField
                        label="Maks. mżawka"
                        type="number"
                        value={profile.drizzleMmMax}
                        onChange={(event) => updateNumericField('drizzleMmMax', event.target.value)}
                      />
                      <TextField
                        label="Maks. deszcz"
                        type="number"
                        value={profile.rainMmMax}
                        onChange={(event) => updateNumericField('rainMmMax', event.target.value)}
                      />
                      <TextField
                        label="Waga temperatury"
                        type="number"
                        value={profile.temperatureWeight}
                        onChange={(event) => updateNumericField('temperatureWeight', event.target.value)}
                      />
                      <TextField
                        label="Waga wiatru"
                        type="number"
                        value={profile.windWeight}
                        onChange={(event) => updateNumericField('windWeight', event.target.value)}
                      />
                      <TextField
                        label="Waga opadów"
                        type="number"
                        value={profile.precipitationWeight}
                        onChange={(event) => updateNumericField('precipitationWeight', event.target.value)}
                      />
                      <TextField
                        label="Waga warunków"
                        type="number"
                        value={profile.conditionWeight}
                        onChange={(event) => updateNumericField('conditionWeight', event.target.value)}
                      />
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Stack>
            </Section>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Section
              title="Decyzja treningowa"
              subtitle="To jest rozszerzenie widgetu — ta sama logika forecastu, ale z pełną kontrolą nad interpretacją."
              accentColor={theme.tokens.status.accent}
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
                    onOpenSettings={() => {}}
                  />
                  {!!decision && (
                    <Alert severity={decision.variant === 'indoor' ? 'warning' : 'success'}>
                      <strong>{decision.title}</strong> — {decision.detail}
                    </Alert>
                  )}
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2">Najlepsze okno dziś</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5 }}>
                          {today?.bestWindowStart ?? '—'} — {today?.bestWindowEnd ?? '—'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Score {today?.bestWindowScore ?? 0}/100
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2">Jutro</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5 }}>
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
          </Grid>

          <Grid item xs={12} lg={4}>
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
          </Grid>

          <Grid item xs={12}>
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
          </Grid>
        </Grid>
      </Stack>
    </PageContainer>
  );
}
