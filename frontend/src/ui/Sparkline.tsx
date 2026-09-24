import { Box } from '@mui/material';
import { useId } from 'react';

import { useTokens } from './tokens';

export interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  /** Index of the highlighted point (e.g. the latest value). Defaults to the last point. */
  markerIndex?: number | null;
  /** Dotted grid backdrop from the reference "Activity" card. */
  grid?: boolean;
  ariaLabel: string;
}

/** Lightweight smooth line with a marker; no chart library, safe for dense layouts. */
export default function Sparkline({ values, color, height = 96, markerIndex, grid = true, ariaLabel }: SparklineProps) {
  const tokens = useTokens();
  const gradientId = useId();
  const stroke = color ?? tokens.chart.primary;
  const width = 300;
  if (values.length < 2) return <Box role="img" aria-label={ariaLabel} sx={{ height }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 8;
  const points = values.map((value, position) => ({
    x: (position / (values.length - 1)) * width,
    y: pad + (1 - (value - min) / span) * (height - pad * 2),
  }));
  const path = points.reduce((d, point, position) => {
    const previous = points[position - 1];
    if (!previous) return `M${point.x},${point.y}`;
    const mid = (previous.x + point.x) / 2;
    return `${d} C${mid},${previous.y} ${mid},${point.y} ${point.x},${point.y}`;
  }, '');
  const marker = points[markerIndex === undefined ? points.length - 1 : markerIndex ?? -1];

  return (
    <Box role="img" aria-label={ariaLabel} sx={{ width: '100%', height }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden>
        <defs>
          <pattern id={`${gradientId}-grid`} width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.1" fill={tokens.chart.grid} />
          </pattern>
        </defs>
        {grid ? <rect width={width} height={height} fill={`url(#${gradientId}-grid)`} /> : null}
        <path d={path} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {marker ? (
          <>
            <line x1={marker.x} x2={marker.x} y1={0} y2={height} stroke={tokens.chart.grid} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={marker.x} cy={marker.y} r="6" fill={stroke} stroke={tokens.surfaceElevated} strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </>
        ) : null}
      </svg>
    </Box>
  );
}
