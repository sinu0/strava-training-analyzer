import type {
  GradientDay,
  HourScore,
  WeatherData,
  WeatherGradient,
  WeatherScoringProfile,
} from '@/types/analytics';

export const defaultWeatherScoringProfile: WeatherScoringProfile = {
  rideWindowStartHour: 6,
  rideWindowEndHour: 21,
  idealTemperatureMin: 12,
  idealTemperatureMax: 22,
  acceptableTemperatureMin: 7,
  acceptableTemperatureMax: 28,
  comfortableWindMax: 12,
  riskyWindMax: 22,
  drizzleMmMax: 0.2,
  rainMmMax: 1.2,
  temperatureWeight: 30,
  windWeight: 20,
  precipitationWeight: 30,
  conditionWeight: 20,
};

function parseHourLabel(hour: string): number {
  return Number.parseInt(hour.split(':')[0] ?? '0', 10);
}

function normalizeWeights(profile: WeatherScoringProfile) {
  const total =
    profile.temperatureWeight +
    profile.windWeight +
    profile.precipitationWeight +
    profile.conditionWeight;

  return total > 0 ? total : 100;
}

function scoreTemperature(
  temperature: number,
  profile: WeatherScoringProfile,
) {
  if (temperature >= profile.idealTemperatureMin && temperature <= profile.idealTemperatureMax) {
    return profile.temperatureWeight;
  }
  if (
    temperature >= profile.acceptableTemperatureMin &&
    temperature <= profile.acceptableTemperatureMax
  ) {
    return Math.round(profile.temperatureWeight * 0.62);
  }
  return 0;
}

function scoreWind(windSpeed: number, profile: WeatherScoringProfile) {
  if (windSpeed <= profile.comfortableWindMax) {
    return profile.windWeight;
  }
  if (windSpeed <= profile.riskyWindMax) {
    return Math.round(profile.windWeight * 0.45);
  }
  return 0;
}

function scorePrecipitation(
  precipitation: number,
  profile: WeatherScoringProfile,
) {
  if (precipitation <= profile.drizzleMmMax) {
    return profile.precipitationWeight;
  }
  if (precipitation <= profile.rainMmMax) {
    return Math.round(profile.precipitationWeight * 0.3);
  }
  return 0;
}

function scoreCondition(weatherCode: number, profile: WeatherScoringProfile) {
  if (weatherCode <= 3) {
    return profile.conditionWeight;
  }
  if (weatherCode <= 48) {
    return Math.round(profile.conditionWeight * 0.65);
  }
  if (weatherCode <= 67) {
    return Math.round(profile.conditionWeight * 0.22);
  }
  if (weatherCode <= 86) {
    return Math.round(profile.conditionWeight * 0.1);
  }
  return 0;
}

function scoreHour(hour: Pick<HourScore, 'temperature' | 'windSpeed' | 'precipitation' | 'weatherCode'>, profile: WeatherScoringProfile) {
  const weightsTotal = normalizeWeights(profile);
  const rawScore =
    scoreTemperature(hour.temperature, profile) +
    scoreWind(hour.windSpeed, profile) +
    scorePrecipitation(hour.precipitation, profile) +
    scoreCondition(hour.weatherCode, profile);

  return Math.round((rawScore / weightsTotal) * 100);
}

function scoreCurrent(current: WeatherData, profile: WeatherScoringProfile) {
  return scoreHour(
    {
      temperature: current.temperature,
      windSpeed: current.windSpeed,
      precipitation: current.precipitation,
      weatherCode: current.weatherCode,
    },
    profile,
  );
}

function adaptDay(day: GradientDay, profile: WeatherScoringProfile): GradientDay {
  const hourlyScores = day.hourlyScores.map((hour) => ({
    ...hour,
    score: scoreHour(hour, profile),
  }));

  const windowStart = Math.min(profile.rideWindowStartHour, profile.rideWindowEndHour);
  const windowEnd = Math.max(profile.rideWindowStartHour, profile.rideWindowEndHour);
  const relevantHours = hourlyScores.filter((hour) => {
    const value = parseHourLabel(hour.hour);
    return value >= windowStart && value <= windowEnd;
  });

  const dailyScore =
    relevantHours.length > 0
      ? Math.round(relevantHours.reduce((sum, hour) => sum + hour.score, 0) / relevantHours.length)
      : 0;

  let bestWindowStart = relevantHours[0]?.hour ?? day.bestWindowStart;
  let bestWindowEnd = relevantHours[1]?.hour ?? day.bestWindowEnd;
  let bestWindowScore = 0;

  for (let index = 0; index < relevantHours.length - 1; index += 1) {
    const current = relevantHours[index];
    const next = relevantHours[index + 1];
    if (!current || !next) {
      continue;
    }

    const score = Math.round((current.score + next.score) / 2);
    if (score > bestWindowScore) {
      bestWindowScore = score;
      bestWindowStart = current.hour;
      bestWindowEnd = `${String(parseHourLabel(next.hour) + 1).padStart(2, '0')}:00`;
    }
  }

  return {
    ...day,
    dailyScore,
    bestWindowStart,
    bestWindowEnd,
    bestWindowScore,
    hourlyScores,
  };
}

export function adaptWeatherGradientForProfile(
  gradient: WeatherGradient,
  profile: WeatherScoringProfile,
): WeatherGradient {
  const days = gradient.days.map((day) => adaptDay(day, profile));

  return {
    ...gradient,
    current: {
      ...gradient.current,
      outdoorScore: scoreCurrent(gradient.current, profile),
    },
    days,
  };
}

export function buildWeatherDecision(gradient: WeatherGradient) {
  const today = gradient.days[0];
  const currentScore = gradient.current.outdoorScore;
  const bestScore = today?.bestWindowScore ?? currentScore;

  if (currentScore >= 75) {
    return {
      variant: 'ride-now' as const,
      title: 'Jedź teraz',
      detail: `Warunki już są dobre. Aktualny score to ${currentScore}/100.`,
    };
  }

  if (bestScore >= 70 && today?.bestWindowStart) {
    return {
      variant: 'wait' as const,
      title: `Poczekaj do ${today.bestWindowStart}`,
      detail: `Najlepsze okno daje dziś ${bestScore}/100.`,
    };
  }

  return {
    variant: 'indoor' as const,
    title: 'Rozważ indoor lub lżejszy dzień',
    detail: `Najlepsze okno nie przebija dziś sensownego progu (${bestScore}/100).`,
  };
}

export function buildWeatherComparison(
  selected: WeatherGradient | undefined,
  baseline: WeatherGradient | undefined,
) {
  if (!selected || !baseline) {
    return null;
  }

  const diff = selected.current.outdoorScore - baseline.current.outdoorScore;
  if (diff === 0) {
    return `Tu i w ${baseline.locationName} warunki są praktycznie takie same.`;
  }

  const betterWorse = diff > 0 ? 'lepiej' : 'trudniej';
  return `Tu jest ${betterWorse} niż w ${baseline.locationName} o ${Math.abs(diff)} pkt.`;
}
