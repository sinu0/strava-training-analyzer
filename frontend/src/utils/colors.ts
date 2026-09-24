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
  hrv: tokens.health.hrv,
  restingHeartRate: STATUS_COLORS.error,
  sleepScore: STATUS_COLORS.info,
  stress: STATUS_COLORS.warning,
  bodyBattery: tokens.health.bodyBattery,
} as const;

/** Workout profiles use the same zone palette as every other zone view (one source: theme tokens). */
export const TRAINING_ZONE_COLORS = ZONE_COLORS;

export const PROFILE_GRADIENTS = {
  hero: tokens.profileHero,
} as const;

export const ROUTE_HEATMAP_COLORS = tokens.map.densityStops;

export const ROUTE_COLORS = {
  waypointStart: tokens.map.waypointStart,
  waypointEnd: tokens.map.waypointEnd,
  path: STATUS_COLORS.accent,
  pathShadow: tokens.map.pathShadow,
  highlight: tokens.map.pathHighlight,
  alternative: tokens.map.alternative,
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

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  return [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16)) as [number, number, number];
}

/** Interpolates low → mid → high (hex colours) for t in [0, 1]; used for metric-coloured tracks. */
export function heatColor(t: number, stops: { low: string; mid: string; high: string }): string {
  const clamped = Math.max(0, Math.min(1, t));
  const [from, to, local] = clamped <= 0.5 ? [stops.low, stops.mid, clamped * 2] : [stops.mid, stops.high, (clamped - 0.5) * 2];
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const mix = a.map((channel, index) => Math.round(channel + ((b[index] ?? channel) - channel) * local));
  return `#${mix.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
