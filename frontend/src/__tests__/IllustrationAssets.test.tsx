import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ReadinessGauge from '@/components/ReadinessGauge';
import WeatherWidgetHeader from '@/components/weather/WeatherWidgetHeader';
import {
  getEmptyStateIllustrationPath,
  getReadinessIllustrationPath,
  getWeatherIllustrationPath,
} from '@/utils/illustrationAssets';

import theme from '../theme/theme';

function renderWithTheme(ui: Parameters<typeof render>[0]) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('illustration assets', () => {
  it('returns png asset paths for readiness illustrations', () => {
    expect(getReadinessIllustrationPath('peak')).toBe('/illustrations/readiness-peak.png');
    expect(getReadinessIllustrationPath('exhausted')).toBe(
      '/illustrations/readiness-exhausted.png',
    );
  });

  it('returns png paths for new readiness types', () => {
    expect(getReadinessIllustrationPath('rested')).toBe('/illustrations/readiness-rested.png');
    expect(getReadinessIllustrationPath('fresh')).toBe('/illustrations/readiness-fresh.png');
    expect(getReadinessIllustrationPath('recovering')).toBe(
      '/illustrations/readiness-recovering.png',
    );
  });

  it('returns png asset paths for weather illustrations', () => {
    expect(getWeatherIllustrationPath('sunny')).toBe('/illustrations/weather-sunny.png');
    expect(getWeatherIllustrationPath('night_clear')).toBe('/illustrations/weather-night.png');
  });

  it('returns png paths for new weather types', () => {
    expect(getWeatherIllustrationPath('cloudy')).toBe('/illustrations/weather-cloudy.png');
    expect(getWeatherIllustrationPath('stormy')).toBe('/illustrations/weather-stormy.png');
    expect(getWeatherIllustrationPath('partly_cloudy')).toBe(
      '/illustrations/weather-partly-cloudy.png',
    );
    expect(getWeatherIllustrationPath('hot')).toBe('/illustrations/weather-hot.png');
  });

  it('returns png asset paths for empty state illustrations', () => {
    expect(getEmptyStateIllustrationPath('activities')).toBe(
      '/illustrations/empty-activities.png',
    );
    expect(getEmptyStateIllustrationPath('analytics')).toBe('/illustrations/empty-analytics.png');
    expect(getEmptyStateIllustrationPath('training')).toBe('/illustrations/empty-training.png');
    expect(getEmptyStateIllustrationPath('ai')).toBe('/illustrations/empty-ai.png');
    expect(getEmptyStateIllustrationPath('weight')).toBe('/illustrations/empty-weight.png');
    expect(getEmptyStateIllustrationPath('routes')).toBe('/illustrations/empty-routes.png');
    expect(getEmptyStateIllustrationPath('gallery')).toBe('/illustrations/empty-gallery.png');
    expect(getEmptyStateIllustrationPath('health')).toBe('/illustrations/empty-health.png');
  });

  it('renders readiness hero with png illustration', () => {
    renderWithTheme(
      <ReadinessGauge
        data={{
          score: 96,
          level: 'pełna moc',
          tsb: 6,
          ctl: 74,
          atl: 68,
          description: 'Dzień pod mocny trening.',
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Gotowość: pełna moc' }).getAttribute('src')).toBe(
      '/illustrations/readiness-peak.png',
    );
  });

  it('renders weather hero with png illustration', () => {
    renderWithTheme(
      <WeatherWidgetHeader
        locationName="Kraków"
        weatherDescription="Słonecznie"
        temperature={19}
        weatherCode={1}
        windSpeed={14}
        precipitation={0}
        outdoorScore={86}
        cyclistType="sunny"
        onOpenSettings={() => {}}
      />,
    );

    expect(screen.getByRole('img', { name: 'sunny' }).getAttribute('src')).toBe(
      '/illustrations/weather-sunny.png',
    );
  });
});
