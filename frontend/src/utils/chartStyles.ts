import { CHART_COLORS } from '@/utils/colors';

export const CHART_TICK = {
  fill: CHART_COLORS.tickText,
  fontSize: 12,
} as const;

export const CHART_TOOLTIP_CONTENT_STYLE = {
  backgroundColor: CHART_COLORS.tooltip,
  border: `1px solid ${CHART_COLORS.grid}`,
  borderRadius: 12,
  padding: '12px 14px',
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
  r: 3,
  strokeWidth: 0,
} as const;

export const CHART_ACTIVE_DOT = {
  r: 5,
  strokeWidth: 2,
  fill: CHART_COLORS.tooltip,
} as const;
