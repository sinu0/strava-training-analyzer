import { Box, Typography, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

import { getChartVisuals } from '../utils/chartStyles';
import { ZONE_COLORS } from '../utils/colors';

import type { ZoneDistribution as ZoneDistributionType } from '../types/analytics';

interface ZoneDistributionChartProps {
  data: ZoneDistributionType | undefined;
}

const ZoneDistributionChart = memo(function ZoneDistributionChart({
  data,
}: ZoneDistributionChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const chartData = useMemo(() => {
    if (!data?.zones) return [];
    return Object.entries(data.zones)
      .sort(([zoneA], [zoneB]) => zoneA.localeCompare(zoneB, undefined, { numeric: true }))
      .map(([zone, seconds]) => ({
        zone,
        seconds: Math.round(seconds),
        minutes: Math.round(seconds / 60),
        color: ZONE_COLORS[zone as keyof typeof ZONE_COLORS] ?? theme.tokens.chart.tick,
      }));
  }, [data, theme.tokens.chart.tick]);

  if (!chartData.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Brak danych stref.
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid {...chart.grid} />
            <XAxis dataKey="zone" {...chart.axis} />
            <YAxis
              {...chart.axis}
              label={{ value: 'Minuty', angle: -90, position: 'insideLeft', fill: theme.tokens.chart.tick, fontSize: 11, fontWeight: 700 }}
            />
            <Tooltip
              {...chart.tooltip}
              formatter={(value) => [`${Number(value ?? 0)} min`, 'Czas']}
            />
            <Bar dataKey="minutes" radius={chart.barRadius}>
              {chartData.map((entry) => (
                <Cell key={entry.zone} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
        {chartData.map((entry) => (
          <Box key={entry.zone} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary">
              {entry.zone}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
});

export default ZoneDistributionChart;
