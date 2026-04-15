import { createTheme } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';

import theme from '@/theme/theme';
import {
  AI_PREDICTION_COLORS,
  CHART_COLORS,
  COMMON_COLORS,
  HEALTH_COLORS,
  PROFILE_GRADIENTS,
  SPORT_COLORS,
  STATUS_COLORS,
  TRAINING_ZONE_COLORS,
  UI_COLORS,
  WEATHER_ICON_COLORS,
  WEATHER_SCORE_COLORS,
  getSportColor,
  resolveThemeColor,
} from '@/utils/colors';
import { getReadinessColor } from '@/utils/readinessScales';
import { DEFAULT_SCORE_SCALES, getScoreColor } from '@/utils/scoreColor';
import {
  LOAD_STATUS_COLORS,
  PERFORMANCE_TREND_COLORS,
  WEIGHT_TREND_COLORS,
  getLoadStatusColor,
} from '@/utils/statusColors';

describe('colors utilities', () => {
  it('returns shared sport colors for supported activity types', () => {
    expect(getSportColor('Ride')).toBe(SPORT_COLORS.cycling);
    expect(getSportColor('Trail Run')).toBe(SPORT_COLORS.running);
    expect(getSportColor('Swim')).toBe(SPORT_COLORS.swimming);
    expect(getSportColor('Unknown')).toBe(SPORT_COLORS.default);
  });

  it('re-exports theme token groups for charts, statuses, and weather', () => {
    expect(STATUS_COLORS.success).toBe(theme.tokens.status.success);
    expect(CHART_COLORS.tickText).toBe(theme.tokens.chart.tick);
    expect(WEATHER_SCORE_COLORS.excellent).toBe(theme.tokens.weather.score.excellent);
    expect(WEATHER_ICON_COLORS.sunny).toBe(theme.tokens.weather.icon.sunny);
  });

  it('centralizes ai, health, training, and neutral palette colors', () => {
    expect(AI_PREDICTION_COLORS.FTP_PREDICTION).toBe(STATUS_COLORS.accent);
    expect(HEALTH_COLORS.restingHeartRate).toBe(STATUS_COLORS.error);
    expect(TRAINING_ZONE_COLORS.Z2).toBe(STATUS_COLORS.info);
    expect(UI_COLORS.backgroundDefault).toBe(theme.palette.background.default);
    expect(COMMON_COLORS.white).toBe('#fff');
    expect(PROFILE_GRADIENTS.hero).toContain(UI_COLORS.backgroundDefault);
  });

  it('shares load and trend colors across helper modules', () => {
    expect(getLoadStatusColor('OPTIMAL')).toBe(LOAD_STATUS_COLORS.OPTIMAL);
    expect(PERFORMANCE_TREND_COLORS.up).toBe(STATUS_COLORS.success);
    expect(WEIGHT_TREND_COLORS.down).toBe(STATUS_COLORS.success);
    expect(WEIGHT_TREND_COLORS.up).toBe(STATUS_COLORS.error);
  });

  it('keeps score and readiness helpers aligned with shared color tokens', () => {
    expect(DEFAULT_SCORE_SCALES[0]!.color).toBe(WEATHER_SCORE_COLORS.excellent);
    expect(getScoreColor(80)).toBe(WEATHER_SCORE_COLORS.excellent);
    expect(getReadinessColor(95)).toBe(STATUS_COLORS.success);
  });

  it('resolves palette colors without changing raw hex values', () => {
    const theme = createTheme();

    expect(resolveThemeColor(theme, 'success.main')).toBe(theme.palette.success.main);
    expect(resolveThemeColor(theme, 'text.primary')).toBe(theme.palette.text.primary);
    expect(resolveThemeColor(theme, '#123456')).toBe('#123456');
  });
});
