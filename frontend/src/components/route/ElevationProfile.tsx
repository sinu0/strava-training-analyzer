import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { getChartVisuals } from '../../utils/chartStyles';
import { ROUTE_COLORS } from '../../utils/colors';

import type { ElevationPoint } from '../../types/route';

interface ElevationProfileProps {
  points: ElevationPoint[];
  highlightIndex?: number;
  onHover?: (index: number | null) => void;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function ElevationProfile({ points, onHover }: ElevationProfileProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        distKm: p.distance / 1000,
      })),
    [points]
  );

  if (points.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Dodaj punkty na mapie, aby zobaczyć profil wysokości
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 180 }}>
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          onMouseMove={(e) => {
            if (onHover && e?.activeTooltipIndex != null) {
              onHover(Number(e.activeTooltipIndex));
            }
          }}
          onMouseLeave={() => onHover?.(null)}
        >
          <defs>
            <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ROUTE_COLORS.elevation} stopOpacity={0.6} />
              <stop offset="95%" stopColor={ROUTE_COLORS.elevation} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="distKm"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v) => `${v.toFixed(1)}`}
            {...chart.axis}
          />
          <YAxis {...chart.axis} unit=" m" />
          <Tooltip
            {...chart.tooltip}
            labelFormatter={(value) => formatDistance(Number(value ?? 0) * 1000)}
            formatter={(value, name) => {
              const numericValue = Number(value ?? 0);
              const seriesName = String(name ?? '');
              if (seriesName === 'elevation') return [`${Math.round(numericValue)} m`, 'Wysokość'];
              return [numericValue, seriesName];
            }}
          />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke={ROUTE_COLORS.elevation}
            fill="url(#elevGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
