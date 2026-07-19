import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { getChartVisuals } from '../utils/chartStyles';

import type { WeeklySummary } from '../types/analytics';

interface WeeklyVolumeChartProps {
  data: WeeklySummary[];
}

const WeeklyVolumeChart = memo(function WeeklyVolumeChart({
  data,
}: WeeklyVolumeChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const chartData = useMemo(() => {
    return data.map((w) => ({
      week: new Date(w.weekStart).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
      tss: Math.round(w.totalTss),
      hours: +(w.totalTimeSec / 3600).toFixed(1),
    }));
  }, [data]);

  if (!chartData.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Brak danych tygodniowych.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid {...chart.grid} />
          <XAxis dataKey="week" {...chart.axis} />
          <YAxis
            {...chart.axis}
            label={{ value: 'TSS', angle: -90, position: 'insideLeft', fill: theme.tokens.chart.tick, fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip
            {...chart.tooltip}
          />
          <Bar dataKey="tss" fill={theme.tokens.chart.primary} radius={chart.barRadius} name="TSS" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
});

export default WeeklyVolumeChart;
