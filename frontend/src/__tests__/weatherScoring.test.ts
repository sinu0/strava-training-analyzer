import { describe, expect, it } from 'vitest';

import type { WeatherGradient } from '@/types/analytics';
import {
  adaptWeatherGradientForProfile,
  buildWeatherDecision,
  defaultWeatherScoringProfile,
} from '@/utils/weatherScoring';

const rawGradient: WeatherGradient = {
  locationName: 'Kliknięty punkt',
  current: {
    temperature: 18,
    windSpeed: 12,
    precipitation: 0,
    weatherCode: 1,
    weatherDescription: 'Słonecznie',
    outdoorScore: 80,
    warnings: [],
  },
  days: [
    {
      date: '2026-04-27',
      dailyScore: 0,
      bestWindowStart: '00:00',
      bestWindowEnd: '00:00',
      bestWindowScore: 0,
      tempMin: 10,
      tempMax: 19,
      precipitationSum: 0,
      windSpeedMax: 18,
      weatherCode: 1,
      weatherDescription: 'Słonecznie',
      hourlyScores: [
        { hour: '08:00', score: 0, temperature: 14, windSpeed: 9, precipitation: 0, weatherCode: 1 },
        { hour: '09:00', score: 0, temperature: 16, windSpeed: 10, precipitation: 0, weatherCode: 1 },
        { hour: '10:00', score: 0, temperature: 18, windSpeed: 12, precipitation: 0, weatherCode: 1 },
        { hour: '11:00', score: 0, temperature: 19, windSpeed: 17, precipitation: 0, weatherCode: 1 },
      ],
    },
  ],
};

describe('weatherScoring', () => {
  it('recomputes best windows using the active profile', () => {
    const adjusted = adaptWeatherGradientForProfile(rawGradient, {
      ...defaultWeatherScoringProfile,
      comfortableWindMax: 10,
      riskyWindMax: 14,
    });

    expect(adjusted.days[0]?.bestWindowStart).toBe('08:00');
    expect(adjusted.days[0]?.bestWindowEnd).toBe('10:00');
    expect(adjusted.days[0]?.bestWindowScore).toBeGreaterThan(0);
  });

  it('builds a wait recommendation when the current hour is worse than the best window', () => {
    const adjusted = adaptWeatherGradientForProfile(
      {
        ...rawGradient,
        current: {
          ...rawGradient.current,
          windSpeed: 18,
          weatherCode: 45,
          weatherDescription: 'Mgła',
        },
      },
      {
        ...defaultWeatherScoringProfile,
        comfortableWindMax: 9,
        riskyWindMax: 11,
      },
    );

    const decision = buildWeatherDecision(adjusted);

    expect(decision.variant).toBe('wait');
    expect(decision.title).toContain('Poczekaj');
  });
});
