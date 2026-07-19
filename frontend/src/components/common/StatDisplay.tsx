import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Typography } from '@mui/material';

import type { ReactNode } from 'react';

type StatSize = 'sm' | 'md' | 'lg';

interface StatDisplayProps {
  value: string | number;
  label: string;
  unit?: string;
  trend?: number;
  icon?: ReactNode;
  color?: string;
  size?: StatSize;
}

const SIZE_CONFIG: Record<StatSize, { valueVariant: 'caption' | 'h6' | 'h4'; labelSize: string; gap: number }> = {
  sm: { valueVariant: 'caption', labelSize: '0.6rem', gap: 0.25 },
  md: { valueVariant: 'h6', labelSize: '0.7rem', gap: 0.5 },
  lg: { valueVariant: 'h4', labelSize: '0.75rem', gap: 0.5 },
};

/**
 * Formats a compact labeled statistic with optional unit, icon, and trend.
 */
export default function StatDisplay({
  value,
  label,
  unit,
  trend,
  icon,
  color,
  size = 'md',
}: StatDisplayProps) {
  const cfg = SIZE_CONFIG[size];
  const TrendIcon =
    trend !== undefined
      ? trend > 0
        ? TrendingUpIcon
        : trend < 0
          ? TrendingDownIcon
          : TrendingFlatIcon
      : null;
  const trendColor =
    trend !== undefined ? (trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.secondary') : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: cfg.gap }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {!!icon && <Box sx={{ color: color ?? 'text.secondary', display: 'flex' }}>{icon}</Box>}
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontSize: cfg.labelSize, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          {label}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography
          variant={cfg.valueVariant}
          sx={{ fontWeight: 800, letterSpacing: '-0.01em', color: color ?? 'text.primary' }}
        >
          {value}
        </Typography>
        {!!unit && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {unit}
          </Typography>
        )}
        {!!TrendIcon && trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 0.5 }}>
            <TrendIcon sx={{ fontSize: size === 'sm' ? 12 : 14, color: trendColor }} />
            <Typography variant="caption" sx={{ color: trendColor, fontWeight: 600, fontSize: size === 'sm' ? '0.6rem' : '0.7rem' }}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
