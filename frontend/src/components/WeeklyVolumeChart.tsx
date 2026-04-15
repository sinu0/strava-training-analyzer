import { Box, Typography } from '@mui/material';
import { memo, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { CHART_COLORS } from '../utils/colors';

import type { WeeklySummary } from '../types/analytics';

interface WeeklyVolumeChartProps {
  data: WeeklySummary[];
}

const WeeklyVolumeChart = memo(function WeeklyVolumeChart({
  data,
}: WeeklyVolumeChartProps) {
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
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="week" stroke={CHART_COLORS.grid} tick={{ fill: CHART_COLORS.tickText, fontSize: 12 }} />
          <YAxis
            stroke={CHART_COLORS.grid}
            tick={{ fill: CHART_COLORS.tickText, fontSize: 12 }}
            label={{ value: 'TSS', angle: -90, position: 'insideLeft', fill: CHART_COLORS.tickText }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: CHART_COLORS.tooltip, border: 'none', borderRadius: 8 }}
          />
          <Bar dataKey="tss" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="TSS" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
});

export default WeeklyVolumeChart;
