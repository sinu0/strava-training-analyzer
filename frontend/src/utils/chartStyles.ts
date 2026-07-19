import { CHART_COLORS } from '@/utils/colors';

import type { Theme } from '@mui/material/styles';

export const CHART_TICK = {
  fill: CHART_COLORS.tickText,
  fontSize: 12,
} as const;

export const CHART_TOOLTIP_CONTENT_STYLE = {
  backgroundColor: CHART_COLORS.tooltip,
  border: `1px solid ${CHART_COLORS.grid}`,
  borderRadius: 16,
  padding: '12px 14px',
  boxShadow: '0 16px 34px rgba(49, 56, 90, 0.16)',
} as const;

export const CHART_TOOLTIP_LABEL_STYLE = {
  color: CHART_COLORS.tooltipText,
  fontSize: '0.85rem',
  fontWeight: 600,
} as const;

export const CHART_TOOLTIP_ITEM_STYLE = {
  color: CHART_COLORS.tooltipText,
  fontSize: '0.85rem',
} as const;

export const CHART_LEGEND_STYLE = {
  color: CHART_COLORS.tooltipText,
  fontSize: '0.875rem',
} as const;

export const CHART_DOT = {
  r: 3.5,
  strokeWidth: 0,
} as const;

export const CHART_ACTIVE_DOT = {
  r: 5,
  strokeWidth: 2,
  fill: CHART_COLORS.tooltip,
} as const;

export const CHART_BAR_RADIUS: [number, number, number, number] = [8, 8, 2, 2];

/**
 * Recharts does not inherit MUI palette values. This adapter keeps every chart
 * in sync with the active application theme: quiet dotted horizontal grid,
 * compact labels and a raised tooltip surface.
 */
export function getChartVisuals(theme: Theme) {
  // Isolated component tests and embedders can provide MUI's base theme without
  // the application augmentation. Keep charts readable in that case as well.
  const appTokens = theme.tokens;
  const chart = appTokens?.chart ?? {
    grid: '#D9E2EC',
    tick: theme.palette.text.secondary,
    tooltipText: theme.palette.text.primary,
  };
  const surfaceBorder = appTokens?.surfaceBorder ?? theme.palette.divider;
  const surfaceElevated = appTokens?.surfaceElevated ?? theme.palette.background.paper;
  const hoverOverlay = appTokens?.hoverOverlay ?? 'rgba(17,24,39,0.045)';
  const cardShadow = appTokens?.cardShadow ?? '0 16px 34px rgba(49,56,90,0.16)';

  return {
    grid: {
      stroke: chart.grid,
      strokeDasharray: '2 5',
      vertical: false,
    },
    axis: {
      axisLine: false,
      tickLine: false,
      tick: {
        fill: chart.tick,
        fontSize: 11,
        fontWeight: 600,
      },
    },
    tooltip: {
      contentStyle: {
        backgroundColor: surfaceElevated,
        border: `1px solid ${surfaceBorder}`,
        borderRadius: 16,
        padding: '11px 13px',
        boxShadow: cardShadow,
      },
      labelStyle: {
        color: chart.tooltipText,
        fontSize: '0.78rem',
        fontWeight: 800,
        marginBottom: 4,
      },
      itemStyle: {
        color: chart.tooltipText,
        fontSize: '0.78rem',
        fontWeight: 600,
        padding: '2px 0',
      },
      cursor: { fill: hoverOverlay },
    },
    legend: {
      wrapperStyle: {
        color: chart.tick,
        fontSize: '0.76rem',
        fontWeight: 700,
        paddingTop: 8,
      },
      iconType: 'circle' as const,
    },
    barRadius: CHART_BAR_RADIUS,
  } as const;
}
