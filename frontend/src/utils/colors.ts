import { alpha, type Theme } from '@mui/material/styles';

import theme, { tokens } from '@/theme/theme';

export const STATUS_COLORS = tokens.status;

export const CHART_COLORS = {
  primary: tokens.chart.primary,
  secondary: tokens.chart.secondary,
  tertiary: tokens.chart.tertiary,
  grid: tokens.chart.grid,
  tooltip: tokens.chart.tooltip,
  tooltipText: tokens.chart.tooltipText,
  tickText: tokens.chart.tick,
  surface: tokens.chart.surface,
} as const;

export const ZONE_COLORS = tokens.chart.zone;
export const PMC_COLORS = tokens.chart.pmc;
export const LOAD_COLORS = tokens.chart.load;
export const SPORT_COLORS = tokens.sport;
export const WEATHER_SCORE_COLORS = tokens.weather.score;
export const WEATHER_METRIC_COLORS = tokens.weather.metric;
export const WEATHER_ICON_COLORS = tokens.weather.icon;

export const UI_COLORS = {
  backgroundDefault: theme.palette.background.default,
  backgroundPaper: theme.palette.background.paper,
  textPrimary: theme.palette.text.primary,
  textSecondary: theme.palette.text.secondary,
  divider: theme.palette.divider,
} as const;

export const COMMON_COLORS = {
  white: theme.palette.common.white,
  black: theme.palette.common.black,
} as const;

export const SURFACE_COLORS = {
  elevated: tokens.surfaceElevated,
  subtle: tokens.surfaceSubtle,
  muted: tokens.surfaceMuted,
  border: tokens.surfaceBorder,
  strongBorder: tokens.surfaceStrongBorder,
  hover: tokens.hoverOverlay,
  active: tokens.activeOverlay,
} as const;

export const BRAND_COLORS = tokens.brand;
export const GRADIENTS = tokens.gradients;

export const AI_PREDICTION_COLORS = {
  FTP_PREDICTION: STATUS_COLORS.accent,
  FATIGUE_PREDICTION: STATUS_COLORS.error,
  TRAINING_TYPE_RECOMMENDATION: STATUS_COLORS.success,
  PERFORMANCE_TREND: STATUS_COLORS.info,
  OVERTRAINING_RISK: STATUS_COLORS.warning,
  RACE_READINESS: STATUS_COLORS.highlight,
  TRAINING_COACH_SUMMARY: STATUS_COLORS.secondary,
} as const;

export const HEALTH_COLORS = {
  hrv: '#39D353',
  restingHeartRate: STATUS_COLORS.error,
  sleepScore: STATUS_COLORS.info,
  stress: STATUS_COLORS.warning,
  bodyBattery: '#FFA657',
} as const;

export const TRAINING_ZONE_COLORS = {
  Z1: STATUS_COLORS.neutral,
  Z2: STATUS_COLORS.info,
  Z3: STATUS_COLORS.success,
  Z4: STATUS_COLORS.warning,
  Z5: '#F78166',
  Z6: STATUS_COLORS.error,
  Z7: ZONE_COLORS.Z6,
} as const;

export const PROFILE_GRADIENTS = {
  hero: 'linear-gradient(135deg, #0D1117 0%, #1A2332 50%, #0D2140 100%)',
} as const;

export const ROUTE_HEATMAP_COLORS = [
  { stop: 0, color: '#1A237E' },
  { stop: 0.35, color: STATUS_COLORS.accent },
  { stop: 0.7, color: '#FF2020' },
  { stop: 1, color: '#FF1744' },
] as const;

export const ROUTE_COLORS = {
  waypointStart: '#2E7D32',
  waypointEnd: '#C62828',
  path: STATUS_COLORS.accent,
  pathShadow: '#0F172A',
  highlight: '#FF6B6B',
  alternative: '#3B82F6',
  elevation: STATUS_COLORS.info,
} as const;

export function getSportColor(sportType: string): string {
  const type = sportType.toLowerCase();

  if (type.includes('cycling') || type.includes('bike') || type.includes('ride')) {
    return SPORT_COLORS.cycling;
  }
  if (type.includes('run')) {
    return SPORT_COLORS.running;
  }
  if (type.includes('swim')) {
    return SPORT_COLORS.swimming;
  }
  if (type.includes('walk')) {
    return SPORT_COLORS.walking;
  }
  if (type.includes('strength')) {
    return SPORT_COLORS.strength;
  }

  return SPORT_COLORS.default;
}

export function alphaColor(color: string, opacity: number): string {
  return alpha(color, opacity);
}

export function resolveThemeColor(theme: Theme, color: string): string {
  if (!color.includes('.')) {
    return color;
  }

  const [paletteKey, shade] = color.split('.');
  const paletteEntry = theme.palette[paletteKey as keyof Theme['palette']];
  if (!paletteEntry || typeof paletteEntry !== 'object') {
    return color;
  }

  const resolved = (paletteEntry as Record<string, unknown>)[shade ?? 'main'];
  return typeof resolved === 'string' ? resolved : color;
}
