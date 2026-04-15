import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { CHART_COLORS, ROUTE_COLORS } from '../../utils/colors';

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
              onHover(e.activeTooltipIndex);
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
            stroke={CHART_COLORS.tickText}
            fontSize={11}
          />
          <YAxis stroke={CHART_COLORS.tickText} fontSize={11} unit=" m" />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltip,
              border: `1px solid ${CHART_COLORS.grid}`,
              borderRadius: 8,
            }}
            labelFormatter={(v) => formatDistance(v * 1000)}
            formatter={(value: number, name: string) => {
              if (name === 'elevation') return [`${Math.round(value)} m`, 'Wysokość'];
              return [value, name];
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
