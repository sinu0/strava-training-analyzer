import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HotelIcon from '@mui/icons-material/Hotel';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import { Box, Typography, Divider, Stack, Chip } from '@mui/material';

import type { ReadinessData, WeatherData, WeeklySummary } from '@/types/analytics';
import { CHART_COLORS, STATUS_COLORS } from '@/utils/colors';

interface TodayRecommendationProps {
  readiness: ReadinessData | undefined;
  weather: WeatherData | undefined;
  weeklyLoad: WeeklySummary | undefined;
}

interface Recommendation {
  icon: React.ReactNode;
  label: string;
  color: string;
  description: string;
  details: string[];
}

function buildRecommendation(
  readiness: ReadinessData | undefined,
  weather: WeatherData | undefined,
  weeklyLoad: WeeklySummary | undefined,
): Recommendation {
  const details: string[] = [];

  // Analyze each factor
  const readinessOk = readiness && readiness.score >= 40;
  const readinessHigh = readiness && readiness.score >= 70;
  const weatherOk = weather && weather.outdoorScore >= 60;
  const weatherGood = weather && weather.outdoorScore >= 80;
  const lowTemp = weather && weather.temperature < 8;
  const highTemp = weather && weather.temperature > 30;
  const highWind = weather && weather.windSpeed > 20;
  const precipitation = weather && weather.precipitation > 0;

  // Readiness factor
  if (readiness) {
    if (readinessHigh) details.push('Organizm wypoczęty — gotowy na obciążenie');
    else if (readinessOk) details.push('Umiarkowana gotowość — trening możliwy');
    else details.push('Organizm zmęczony — zalecana regeneracja');
  }

  // Weather factor
  if (weather) {
    if (weatherGood) details.push(`Dobre warunki outdoor (${Math.round(weather.temperature)}°C)`);
    else if (weatherOk) details.push('Warunki outdoor akceptowalne');
    else details.push('Warunki outdoor niekorzystne');
  }

  // Weekly load check
  if (weeklyLoad) {
    if (weeklyLoad.totalTss > 600) details.push('Wysoki TSS w tym tygodniu — unikaj przeciążenia');
    else if (weeklyLoad.totalTss > 400) details.push('Umiarkowane obciążenie tygodniowe');
    else details.push('Niskie obciążenie tygodniowe — możesz dodać trening');
  }

  // Decision matrix
  if (!readinessOk) {
    return {
        icon: <HotelIcon sx={{ fontSize: 40 }} />,
        label: 'Odpoczynek / Regeneracja',
        color: STATUS_COLORS.error,
        description: 'Twój organizm potrzebuje odpoczynku. Jeśli musisz trenować, wybierz lekki trening regeneracyjny.',
        details,
      };
  }

  if (readinessHigh && weatherGood) {
    return {
        icon: <DirectionsBikeIcon sx={{ fontSize: 40 }} />,
        label: 'Intensywny trening outdoor',
        color: STATUS_COLORS.success,
        description: 'Świetny dzień na mocny trening na świeżym powietrzu! Jesteś wypoczęty, a pogoda sprzyja.',
        details,
      };
  }

  if (readinessHigh && lowTemp) {
    return {
        icon: <FitnessCenterIcon sx={{ fontSize: 40 }} />,
        label: 'Intensywny trening na trenażerze',
        color: CHART_COLORS.secondary,
        description: 'Masz dobrą gotowość, ale na dworze jest zimno. Proponuję jazdę na trenażerze.',
        details,
      };
  }

  if (readinessHigh && (highTemp || highWind)) {
    return {
        icon: <FitnessCenterIcon sx={{ fontSize: 40 }} />,
        label: 'Trening indoor lub krótki outdoor',
        color: STATUS_COLORS.warning,
        description: highTemp
          ? 'Upał na dworze — rozważ krótki poranny trening lub sesję na trenażerze.'
          : 'Silny wiatr — trenażer będzie bezpieczniejszy.',
      details,
    };
  }

  // Cold + wet = definitely indoor even with moderate readiness
  if (lowTemp && precipitation) {
    return {
        icon: <FitnessCenterIcon sx={{ fontSize: 40 }} />,
        label: 'Trening na trenażerze',
        color: CHART_COLORS.secondary,
        description: 'Zimno i mokro na dworze — trenażer to jedyna rozsądna opcja.',
        details,
      };
  }

  if (readinessOk && weatherOk) {
    return {
        icon: <DirectionsBikeIcon sx={{ fontSize: 40 }} />,
        label: 'Umiarkowany trening outdoor',
        color: STATUS_COLORS.warning,
        description: 'Możesz trenować, ale z rozsądnym obciążeniem. Słuchaj swojego organizmu.',
        details,
      };
  }

  // Moderate readiness, bad weather
  return {
    icon: <SelfImprovementIcon sx={{ fontSize: 40 }} />,
    label: 'Lekki trening / stretching',
    color: STATUS_COLORS.warning,
    description: 'Pogoda nie sprzyja, a gotowość jest umiarkowana. Lekki trening indoor lub joga będą najlepszym wyborem.',
    details,
  };
}

export default function TodayRecommendation({ readiness, weather, weeklyLoad }: TodayRecommendationProps) {
  const rec = buildRecommendation(readiness, weather, weeklyLoad);

  return (
    <Box>
      {/* Main recommendation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box sx={{ color: rec.color }}>{rec.icon}</Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: rec.color }}>
            {rec.label}
          </Typography>
        </Box>
      </Box>

      <Typography variant="body2" sx={{ mb: 2 }}>
        {rec.description}
      </Typography>

      {/* Detail factors */}
      {rec.details.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Na podstawie:
          </Typography>
          <Stack spacing={0.5}>
            {rec.details.map((detail) => (
              <Chip
                key={detail}
                label={detail}
                size="small"
                variant="outlined"
                sx={{
                  justifyContent: 'flex-start',
                  height: 'auto',
                  '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
                }}
              />
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}
