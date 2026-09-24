import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { getAppThemeTokens } from '@/theme/theme';

import type { ReactNode } from 'react';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export interface DotMatrixRowProps {
  label: ReactNode;
  valueLabel?: ReactNode;
  /** Number of filled dots out of `total`. */
  filled: number;
  total?: number;
  color: string;
}

/** Horizontal row of dots: a compact gauge for a single current value. */
export function DotMatrixRow({ label, valueLabel, filled, total = 12, color }: DotMatrixRowProps) {
  const count = clamp(Math.round(filled), 0, total);
  return (
    <Stack direction="row" spacing={1.1} sx={{ alignItems: 'center' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', width: 44, fontWeight: 700, flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${total}, 1fr)`, gap: 0.5, flex: 1 }}>
        {Array.from({ length: total }, (_, position) => position).map((position) => (
          <Box
            key={position}
            sx={(theme) => ({
              aspectRatio: '1',
              minWidth: 6,
              borderRadius: '50%',
              bgcolor: position < count ? color : getAppThemeTokens(theme).trackBg,
              boxShadow: position < count ? `0 3px 8px ${alpha(color, 0.2)}` : 'none',
            })}
          />
        ))}
      </Box>
      {valueLabel != null ? <Typography variant="caption" sx={{ width: 40, textAlign: 'right', fontWeight: 750, flexShrink: 0 }}>{valueLabel}</Typography> : null}
    </Stack>
  );
}

export interface DotMatrixColumn {
  /** Stable identity of the column (date, step index…). */
  id: string;
  value: number;
  /** Optional per-column colour, e.g. a training zone. */
  color?: string;
  label?: string;
}

export interface DotMatrixChartProps {
  columns: DotMatrixColumn[];
  /** Dots per column at the maximum value. */
  rows?: number;
  max?: number;
  color: string;
  /** Column index to highlight (e.g. "now"). */
  activeId?: string;
  /** Axis captions under the chart (start, middle, end). */
  axis?: ReactNode[];
  ariaLabel: string;
  dotSize?: number;
}

/** Column chart made of dots, as in the reference "Training" card. */
export function DotMatrixChart({ columns, rows = 7, max, color, activeId, axis, ariaLabel, dotSize = 14 }: DotMatrixChartProps) {
  const ceiling = max ?? Math.max(1, ...columns.map((column) => column.value));
  return (
    <Box role="img" aria-label={ariaLabel} sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '4px', overflow: 'hidden' }}>
        {columns.map((column) => {
          const filled = clamp(Math.round((column.value / ceiling) * rows), column.value > 0 ? 1 : 0, rows);
          const dotColor = column.color ?? color;
          const faded = activeId != null && column.id !== activeId;
          return (
            <Box key={column.id} title={column.label} sx={{ display: 'flex', flexDirection: 'column-reverse', gap: '4px', flex: 1, alignItems: 'center', minWidth: 0 }}>
              {Array.from({ length: rows }, (_, level) => level).map((level) => (
                <Box
                  key={level}
                  sx={(theme) => ({
                    width: '100%',
                    maxWidth: dotSize,
                    aspectRatio: '1',
                    borderRadius: '50%',
                    bgcolor: level < filled ? alpha(dotColor, faded ? 0.38 : 1) : level === 0 ? getAppThemeTokens(theme).trackBg : 'transparent',
                  })}
                />
              ))}
            </Box>
          );
        })}
      </Box>
      {axis?.length ? (
        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
          {axis.map((caption, position) => (
            // Axis captions are fixed slots (start / middle / end).
            // eslint-disable-next-line react/no-array-index-key
            <Typography key={position} variant="caption" sx={{ color: 'text.secondary' }}>{caption}</Typography>
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
