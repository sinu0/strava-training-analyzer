import { Box, Typography } from '@mui/material';
import { memo, useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { CHART_TICK, CHART_TOOLTIP_CONTENT_STYLE, CHART_TOOLTIP_ITEM_STYLE, CHART_TOOLTIP_LABEL_STYLE } from '../utils/chartStyles';
import { CHART_COLORS } from '../utils/colors';

import type { TrendPoint } from '../types/analytics';

interface EfficiencyTrendProps {
  data: TrendPoint[];
}

const EfficiencyTrend = memo(function EfficiencyTrend({
  data,
}: EfficiencyTrendProps) {
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
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="index"
            type="number"
            stroke={CHART_COLORS.grid}
            tick={CHART_TICK}
            tickFormatter={(i) => {
              const d = chartData[i];
              return d ? new Date(d.date).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }) : '';
            }}
          />
          <YAxis
            dataKey="value"
            stroke={CHART_COLORS.grid}
            tick={CHART_TICK}
            label={{ value: 'EF', angle: -90, position: 'insideLeft', fill: CHART_COLORS.tickText }}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            itemStyle={CHART_TOOLTIP_ITEM_STYLE}
            formatter={(value) => [Number(value ?? 0).toFixed(3), 'EF']}
            labelFormatter={(i) => {
              const d = chartData[Number(i)];
              return d ? new Date(d.date).toLocaleDateString('pl-PL') : '';
            }}
          />
          <Scatter
            data={chartData}
            fill={CHART_COLORS.secondary}
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </Box>
  );
});

export default EfficiencyTrend;
