import { ThemeProvider } from '@mui/material/styles';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import WeatherWidget from '@/components/WeatherWidget';
import theme from '@/theme/theme';
import type { WeatherGradient, WeatherLocation } from '@/types/analytics';

import type { ComponentProps } from 'react';

const { searchGeocodingLocationsMock } = vi.hoisted(() => ({
  searchGeocodingLocationsMock: vi.fn(),
}));

vi.mock('@/api/externalApis', () => ({
  searchGeocodingLocations: searchGeocodingLocationsMock,
}));

function renderWidget(overrides: Partial<ComponentProps<typeof WeatherWidget>> = {}) {
  const gradient: WeatherGradient = {
    locationName: 'Kraków',
    current: {
      temperature: 18.2,
      windSpeed: 16,
      precipitation: 0,
      weatherCode: 1,
      weatherDescription: 'Słonecznie',
      outdoorScore: 82,
      warnings: [],
    },
    days: [
      {
        date: '2026-04-05',
        dailyScore: 82,
        bestWindowStart: '09:00',
        bestWindowEnd: '11:00',
        bestWindowScore: 88,
        tempMin: 10,
        tempMax: 19,
        precipitationSum: 0,
        windSpeedMax: 20,
        weatherCode: 1,
        weatherDescription: 'Słonecznie',
        hourlyScores: [
          {
            hour: '09:00',
            score: 88,
            temperature: 16,
            windSpeed: 12,
            precipitation: 0,
            weatherCode: 1,
          },
          {
            hour: '10:00',
            score: 86,
            temperature: 17,
            windSpeed: 14,
            precipitation: 0,
            weatherCode: 1,
          },
        ],
      },
    ],
  };

  const locations: WeatherLocation[] = [
    {
      id: 'krk',
      name: 'Kraków',
      latitude: 50.0614,
      longitude: 19.9366,
      active: true,
    },
  ];

  const props = {
    gradient,
    locations,
    onActivateLocation: vi.fn(),
    onAddLocation: vi.fn(),
    onDeleteLocation: vi.fn(),
    onRefresh: vi.fn(),
    onOpenStudio: vi.fn(),
    ...overrides,
  };

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <WeatherWidget {...props} />
      </ThemeProvider>,
    ),
    props,
  };
}

describe('WeatherWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T08:00:00Z'));
    searchGeocodingLocationsMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows sunrise and sunset after clicking an hourly weather segment', () => {
    renderWidget({
      gradient: {
        locationName: 'Kraków',
        current: {
          temperature: 18.2,
          windSpeed: 16,
          precipitation: 0,
          weatherCode: 1,
          weatherDescription: 'Słonecznie',
          outdoorScore: 82,
          warnings: [],
        },
        days: [
          {
            date: '2026-04-05',
            dailyScore: 82,
            bestWindowStart: '09:00',
            bestWindowEnd: '11:00',
            bestWindowScore: 88,
            tempMin: 10,
            tempMax: 19,
            precipitationSum: 0,
            windSpeedMax: 20,
            weatherCode: 1,
            weatherDescription: 'Słonecznie',
            hourlyScores: [
              {
                hour: '09:00',
                score: 88,
                temperature: 16,
                windSpeed: 12,
                precipitation: 0,
                weatherCode: 1,
                sunrise: '06:12',
                sunset: '19:41',
              },
            ],
          },
        ],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pogoda dla 09:00' }));

    expect(screen.getByText('Wschód słońca')).not.toBeNull();
    expect(screen.getByText('06:12')).not.toBeNull();
    expect(screen.getByText('Zachód słońca')).not.toBeNull();
    expect(screen.getByText('19:41')).not.toBeNull();
  });

  it('debounces geocoding search and adds a new location from search results', async () => {
    searchGeocodingLocationsMock.mockResolvedValue([
      {
        name: 'Kraków',
        latitude: 50.0614,
        longitude: 19.9366,
        admin1: 'Małopolskie',
        country: 'Polska',
      },
    ]);

    const { props } = renderWidget();

    fireEvent.click(screen.getByLabelText('Zarządzaj lokalizacjami'));
    act(() => {
      vi.runOnlyPendingTimers();
    });

    fireEvent.click(screen.getByText('Dodaj lokalizację'));

    fireEvent.change(screen.getByPlaceholderText('Wyszukaj miejscowość...'), {
      target: { value: 'Kra' },
    });

    expect(searchGeocodingLocationsMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(399);
      await Promise.resolve();
    });

    expect(searchGeocodingLocationsMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(searchGeocodingLocationsMock).toHaveBeenCalledWith('Kra', expect.any(AbortSignal));
      expect(screen.getAllByRole('button', { name: /Kraków/i }).length).toBeGreaterThan(1);
    });

    const locationButtons = screen.getAllByRole('button', { name: /Kraków/i });
    fireEvent.click(locationButtons[locationButtons.length - 1]!);

    expect(props.onAddLocation).toHaveBeenCalledWith('Kraków', 50.0614, 19.9366);
  });

  it('opens the full weather studio from the widget CTA', () => {
    const { props } = renderWidget();

    fireEvent.click(screen.getByRole('button', { name: 'Otwórz pełne studio pogody' }));

    expect(props.onOpenStudio).toHaveBeenCalled();
  });
});
