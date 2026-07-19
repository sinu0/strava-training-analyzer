import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo, useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { getChartVisuals } from '../utils/chartStyles';

import type { TrendPoint } from '../types/analytics';

interface EfficiencyTrendProps {
  data: TrendPoint[];
}

const EfficiencyTrend = memo(function EfficiencyTrend({
  data,
}: EfficiencyTrendProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const chartData = useMemo(
    () =>
      data.map((d, i) => ({
        index: i,
        date: d.date,
        value: +d.value.toFixed(3),
      })),
    [data],
  );

  if (!data.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Brak danych efektywności.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid {...chart.grid} />
          <XAxis
            dataKey="index"
            type="number"
            {...chart.axis}
            tickFormatter={(i) => {
              const d = chartData[i];
              return d ? new Date(d.date).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }) : '';
            }}
          />
          <YAxis
            dataKey="value"
            {...chart.axis}
            label={{ value: 'EF', angle: -90, position: 'insideLeft', fill: theme.tokens.chart.tick, fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip
            {...chart.tooltip}
            formatter={(value) => [Number(value ?? 0).toFixed(3), 'EF']}
            labelFormatter={(i) => {
              const d = chartData[Number(i)];
              return d ? new Date(d.date).toLocaleDateString('pl-PL') : '';
            }}
          />
          <Scatter
            data={chartData}
            fill={theme.tokens.chart.secondary}
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </Box>
  );
});

export default EfficiencyTrend;
