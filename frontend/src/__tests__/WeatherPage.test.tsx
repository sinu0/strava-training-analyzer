import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import WeatherPage from '@/pages/WeatherPage';
import theme from '@/theme/theme';

vi.mock('@/components/weather/WeatherStudioMap', () => ({
  default: () => <div>Weather map</div>,
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useWeatherLocations: () => ({
    data: [
      { id: 'krk', name: 'Kraków', latitude: 50.0614, longitude: 19.9366, active: true },
    ],
  }),
  useWeatherGradient: () => ({
    data: {
      locationName: 'Kraków',
      current: {
        temperature: 17,
        windSpeed: 11,
        precipitation: 0,
        weatherCode: 1,
        weatherDescription: 'Słonecznie',
        outdoorScore: 82,
        warnings: [],
      },
      days: [
        {
          date: '2026-04-27',
          dailyScore: 80,
          bestWindowStart: '09:00',
          bestWindowEnd: '11:00',
          bestWindowScore: 85,
          tempMin: 10,
          tempMax: 19,
          precipitationSum: 0,
          windSpeedMax: 14,
          weatherCode: 1,
          weatherDescription: 'Słonecznie',
          hourlyScores: [
            { hour: '09:00', score: 84, temperature: 15, windSpeed: 9, precipitation: 0, weatherCode: 1 },
            { hour: '10:00', score: 85, temperature: 17, windSpeed: 10, precipitation: 0, weatherCode: 1 },
          ],
        },
      ],
    },
  }),
  useWeatherPointGradient: () => ({
    data: {
      locationName: 'Punkt testowy',
      current: {
        temperature: 16,
        windSpeed: 14,
        precipitation: 0,
        weatherCode: 1,
        weatherDescription: 'Słonecznie',
        outdoorScore: 76,
        warnings: [],
      },
      days: [
        {
          date: '2026-04-27',
          dailyScore: 78,
          bestWindowStart: '10:00',
          bestWindowEnd: '12:00',
          bestWindowScore: 82,
          tempMin: 9,
          tempMax: 18,
          precipitationSum: 0,
          windSpeedMax: 18,
          weatherCode: 1,
          weatherDescription: 'Słonecznie',
          hourlyScores: [
            { hour: '09:00', score: 74, temperature: 13, windSpeed: 12, precipitation: 0, weatherCode: 1 },
            { hour: '10:00', score: 82, temperature: 15, windSpeed: 10, precipitation: 0, weatherCode: 1 },
            { hour: '11:00', score: 81, temperature: 17, windSpeed: 11, precipitation: 0, weatherCode: 1 },
          ],
        },
      ],
    },
  }),
  useAddWeatherLocation: () => ({ mutate: vi.fn(), isPending: false }),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <WeatherPage />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('WeatherPage', () => {
  it('renders the full weather studio with visible algorithm controls', () => {
    renderPage();

    expect(screen.getAllByText('Studio pogody').length).toBeGreaterThan(0);
    expect(screen.getByText('Sterowanie algorytmem')).toBeDefined();
    expect(screen.getAllByText('Decyzja treningowa').length).toBeGreaterThan(0);
    expect(screen.getByText('Weather map')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Zapisz punkt jako lokalizację' })).toBeDefined();
  });
});
